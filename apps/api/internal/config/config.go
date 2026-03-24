package config

import (
	"os"
	"time"
)

type Config struct {
	Address             string
	DatabaseURL         string
	Environment         string
	PublishedIndexPath  string
	VisibilityIndexPath string
	DiscoveryCacheTTL   time.Duration
}

func Load() Config {
	return Config{
		Address:             envOrDefault("API_ADDRESS", ":8080"),
		DatabaseURL:         envOrDefault("DATABASE_URL", "postgres://swiftsnippet:swiftsnippet@127.0.0.1:5432/swiftsnippet?sslmode=disable"),
		Environment:         envOrDefault("APP_ENV", "development"),
		PublishedIndexPath:  envOrDefault("PUBLISHED_INDEX_PATH", "content/published/snippets.json"),
		VisibilityIndexPath: envOrDefault("VISIBILITY_INDEX_PATH", "content/published/visibility.json"),
		DiscoveryCacheTTL:   durationOrDefault("DISCOVERY_CACHE_TTL", 30*time.Second),
	}
}

func envOrDefault(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func durationOrDefault(key string, fallback time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}

	return parsed
}
