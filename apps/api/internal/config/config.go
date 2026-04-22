package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	APIPort               string
	DatabaseURL           string
	AdminEmail            string
	AdminPassword         string
	AdminSessionSecret    string
	MemberSessionSecret   string
	StripeSecretKey       string
	StripeWebhookSecret   string
	StripePriceID         string
	StripeSuccessURL      string
	StripeCancelURL       string
	StripePortalReturnURL string
	CORSAllowedOrigin     string
	StorageProvider       string
	UploadsDir            string
	UploadsBasePath       string
	GCSPublicBaseURL      string
	MinIOEndpoint         string
	MinIOAccessKey        string
	MinIOSecretKey        string
	MinIOBucket           string
	MinIORegion           string
	MinIOUseSSL           bool
	GCSBucket             string
	GCSProjectID          string
	GCSCredentials        string
}

func Load() Config {
	_ = godotenv.Load()

	apiPort := envOrDefault("API_PORT", "8080")
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	adminEmail := os.Getenv("ADMIN_EMAIL")
	adminEmail = strings.TrimSpace(adminEmail)
	if adminEmail == "" {
		log.Fatal("ADMIN_EMAIL is required")
	}
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	adminPassword = strings.TrimSpace(adminPassword)
	if adminPassword == "" {
		log.Fatal("ADMIN_PASSWORD is required")
	}
	adminSessionSecret := os.Getenv("ADMIN_SESSION_SECRET")
	adminSessionSecret = strings.TrimSpace(adminSessionSecret)
	if adminSessionSecret == "" {
		log.Fatal("ADMIN_SESSION_SECRET is required")
	}
	memberSessionSecret := os.Getenv("MEMBER_SESSION_SECRET")
	memberSessionSecret = strings.TrimSpace(memberSessionSecret)
	if memberSessionSecret == "" {
		memberSessionSecret = adminSessionSecret + "::member"
		log.Printf("MEMBER_SESSION_SECRET is not set; falling back to a derived local value")
	}
	stripeSecretKey := strings.TrimSpace(os.Getenv("STRIPE_SECRET_KEY"))
	stripeWebhookSecret := strings.TrimSpace(os.Getenv("STRIPE_WEBHOOK_SECRET"))
	stripePriceID := strings.TrimSpace(os.Getenv("STRIPE_PRICE_ID"))
	stripeSuccessURL := strings.TrimSpace(os.Getenv("STRIPE_SUCCESS_URL"))
	stripeCancelURL := strings.TrimSpace(os.Getenv("STRIPE_CANCEL_URL"))
	stripePortalReturnURL := strings.TrimSpace(os.Getenv("STRIPE_PORTAL_RETURN_URL"))
	corsAllowedOrigin := strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGIN"))
	if stripeSecretKey == "" ||
		stripeWebhookSecret == "" ||
		stripePriceID == "" ||
		stripeSuccessURL == "" ||
		stripeCancelURL == "" ||
		stripePortalReturnURL == "" {
		log.Printf("Stripe billing is not fully configured; membership checkout and billing portal endpoints will be unavailable until STRIPE_* vars are set")
	}
	storageProvider := strings.TrimSpace(envOrDefault("STORAGE_PROVIDER", "local"))
	uploadsDir := envOrDefault("UPLOADS_DIR", "uploads")
	uploadsBasePath := strings.TrimSpace(envOrDefault("UPLOADS_BASE_PATH", "/api/uploads"))
	gcsPublicBaseURL := strings.TrimSpace(os.Getenv("GCS_PUBLIC_BASE_URL"))
	minIOEndpoint := strings.TrimSpace(os.Getenv("MINIO_ENDPOINT"))
	minIOAccessKey := strings.TrimSpace(os.Getenv("MINIO_ACCESS_KEY"))
	minIOSecretKey := strings.TrimSpace(os.Getenv("MINIO_SECRET_KEY"))
	minIOBucket := strings.TrimSpace(envOrDefault("MINIO_BUCKET", "swiftsnipple-assets"))
	minIORegion := strings.TrimSpace(envOrDefault("MINIO_REGION", "us-east-1"))
	minIOUseSSL := strings.EqualFold(strings.TrimSpace(envOrDefault("MINIO_USE_SSL", "false")), "true")
	gcsBucket := strings.TrimSpace(os.Getenv("GCS_BUCKET"))
	gcsProjectID := strings.TrimSpace(os.Getenv("GCS_PROJECT_ID"))
	gcsCredentials := strings.TrimSpace(os.Getenv("GCS_CREDENTIALS"))

	return Config{
		APIPort:               apiPort,
		DatabaseURL:           databaseURL,
		AdminEmail:            adminEmail,
		AdminPassword:         adminPassword,
		AdminSessionSecret:    adminSessionSecret,
		MemberSessionSecret:   memberSessionSecret,
		StripeSecretKey:       stripeSecretKey,
		StripeWebhookSecret:   stripeWebhookSecret,
		StripePriceID:         stripePriceID,
		StripeSuccessURL:      stripeSuccessURL,
		StripeCancelURL:       stripeCancelURL,
		StripePortalReturnURL: stripePortalReturnURL,
		CORSAllowedOrigin:     corsAllowedOrigin,
		StorageProvider:       storageProvider,
		UploadsDir:            uploadsDir,
		UploadsBasePath:       uploadsBasePath,
		GCSPublicBaseURL:      gcsPublicBaseURL,
		MinIOEndpoint:         minIOEndpoint,
		MinIOAccessKey:        minIOAccessKey,
		MinIOSecretKey:        minIOSecretKey,
		MinIOBucket:           minIOBucket,
		MinIORegion:           minIORegion,
		MinIOUseSSL:           minIOUseSSL,
		GCSBucket:             gcsBucket,
		GCSProjectID:          gcsProjectID,
		GCSCredentials:        gcsCredentials,
	}
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
