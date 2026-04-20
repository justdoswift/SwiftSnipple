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
	UploadsDir            string
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
	if stripeSecretKey == "" ||
		stripeWebhookSecret == "" ||
		stripePriceID == "" ||
		stripeSuccessURL == "" ||
		stripeCancelURL == "" ||
		stripePortalReturnURL == "" {
		log.Printf("Stripe billing is not fully configured; membership checkout and billing portal endpoints will be unavailable until STRIPE_* vars are set")
	}
	uploadsDir := envOrDefault("UPLOADS_DIR", "uploads")

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
		UploadsDir:            uploadsDir,
	}
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
