package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"swiftsnipple/api/internal/config"
	"swiftsnipple/api/internal/db"
	httpapi "swiftsnipple/api/internal/http"
	"swiftsnipple/api/internal/repo"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg := config.Load()
	log.Printf(
		"Stripe billing config secret_key_set=%t webhook_secret_len=%d price_id_set=%t success_url_set=%t cancel_url_set=%t portal_return_url_set=%t storage_provider=%s uploads_base_path=%s",
		cfg.StripeSecretKey != "",
		len(cfg.StripeWebhookSecret),
		cfg.StripePriceID != "",
		cfg.StripeSuccessURL != "",
		cfg.StripeCancelURL != "",
		cfg.StripePortalReturnURL != "",
		cfg.StorageProvider,
		cfg.UploadsBasePath,
	)

	if err := db.RunMigrations(ctx, cfg.DatabaseURL); err != nil {
		log.Fatalf("run migrations: %v", err)
	}

	pool, err := db.OpenPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}
	defer pool.Close()

	assets, err := httpapi.NewAssetStore(ctx, httpapi.AssetStorageConfig{
		Provider:         cfg.StorageProvider,
		LocalDir:         cfg.UploadsDir,
		PublicBasePath:   cfg.UploadsBasePath,
		GCSPublicBaseURL: cfg.GCSPublicBaseURL,
		MinIOEndpoint:    cfg.MinIOEndpoint,
		MinIOAccessKey:   cfg.MinIOAccessKey,
		MinIOSecretKey:   cfg.MinIOSecretKey,
		MinIOBucket:      cfg.MinIOBucket,
		MinIORegion:      cfg.MinIORegion,
		MinIOUseSSL:      cfg.MinIOUseSSL,
		GCSBucket:        cfg.GCSBucket,
		GCSProjectID:     cfg.GCSProjectID,
		GCSCredentials:   cfg.GCSCredentials,
	})
	if err != nil {
		log.Fatalf("configure asset storage: %v", err)
	}

	router := httpapi.NewRouter(
		pool,
		repo.NewSnippetRepository(pool),
		repo.NewMemberRepository(pool),
		httpapi.AdminAuthConfig{
			Email:         cfg.AdminEmail,
			Password:      cfg.AdminPassword,
			SessionSecret: cfg.AdminSessionSecret,
		},
		httpapi.MemberAuthConfig{
			SessionSecret: cfg.MemberSessionSecret,
		},
		httpapi.NewStripeBillingProvider(httpapi.BillingConfig{
			SecretKey:       cfg.StripeSecretKey,
			WebhookSecret:   cfg.StripeWebhookSecret,
			PriceID:         cfg.StripePriceID,
			SuccessURL:      cfg.StripeSuccessURL,
			CancelURL:       cfg.StripeCancelURL,
			PortalReturnURL: cfg.StripePortalReturnURL,
		}),
		assets,
	)
	server := &http.Server{
		Addr:              ":" + cfg.APIPort,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdownCtx)
	}()

	log.Printf("SwiftSnipple API listening on :%s", cfg.APIPort)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("listen and serve: %v", err)
	}
}
