package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	APIPort            string
	DatabaseURL        string
	AdminEmail         string
	AdminPassword      string
	AdminSessionSecret string
	UploadsDir         string
}

func Load() Config {
	_ = godotenv.Load()

	apiPort := envOrDefault("API_PORT", "8080")
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	adminEmail := os.Getenv("ADMIN_EMAIL")
	if adminEmail == "" {
		log.Fatal("ADMIN_EMAIL is required")
	}
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		log.Fatal("ADMIN_PASSWORD is required")
	}
	adminSessionSecret := os.Getenv("ADMIN_SESSION_SECRET")
	if adminSessionSecret == "" {
		log.Fatal("ADMIN_SESSION_SECRET is required")
	}
	uploadsDir := envOrDefault("UPLOADS_DIR", "uploads")

	return Config{
		APIPort:            apiPort,
		DatabaseURL:        databaseURL,
		AdminEmail:         adminEmail,
		AdminPassword:      adminPassword,
		AdminSessionSecret: adminSessionSecret,
		UploadsDir:         uploadsDir,
	}
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
