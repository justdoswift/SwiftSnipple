package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	APIPort     string
	DatabaseURL string
}

func Load() Config {
	_ = godotenv.Load()

	apiPort := envOrDefault("API_PORT", "8080")
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	return Config{
		APIPort:     apiPort,
		DatabaseURL: databaseURL,
	}
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
