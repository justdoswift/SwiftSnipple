package config

import "os"

type Config struct {
	Address     string
	DatabaseURL string
	Environment string
}

func Load() Config {
	return Config{
		Address:     envOrDefault("API_ADDRESS", ":8080"),
		DatabaseURL: envOrDefault("DATABASE_URL", "postgres://swiftsnippet:swiftsnippet@127.0.0.1:5432/swiftsnippet?sslmode=disable"),
		Environment: envOrDefault("APP_ENV", "development"),
	}
}

func envOrDefault(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
