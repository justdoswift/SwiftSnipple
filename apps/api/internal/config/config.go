package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Address                string
	DatabaseURL            string
	Environment            string
	AdminPassword          string
	AdminSessionSecret     string
	AdminSessionTTL        time.Duration
	SnippetSourceRoot      string
	PublishedIndexPath     string
	VisibilityIndexPath    string
	SearchDocumentsPath    string
	DiscoveryCacheTTL      time.Duration
	StorageUploadBaseURL   string
	StorageSigningSecret   string
	StoragePresignTTL      time.Duration
	UploadRateLimitBurst   int
	UploadRateLimitWindow  time.Duration
	PublishRateLimitBurst  int
	PublishRateLimitWindow time.Duration
}

func Load() Config {
	return Config{
		Address:                envOrDefault("API_ADDRESS", ":8080"),
		DatabaseURL:            envOrDefault("DATABASE_URL", "postgres://swiftsnippet:swiftsnippet@127.0.0.1:5432/swiftsnippet?sslmode=disable"),
		Environment:            envOrDefault("APP_ENV", "development"),
		AdminPassword:          envOrDefault("ADMIN_PASSWORD", "development-admin-password"),
		AdminSessionSecret:     envOrDefault("ADMIN_SESSION_SECRET", "development-admin-session-secret"),
		AdminSessionTTL:        durationOrDefault("ADMIN_SESSION_TTL", 12*time.Hour),
		SnippetSourceRoot:      envOrDefault("SNIPPET_SOURCE_ROOT", "content/snippets"),
		PublishedIndexPath:     envOrDefault("PUBLISHED_INDEX_PATH", "content/published/snippets.json"),
		VisibilityIndexPath:    envOrDefault("VISIBILITY_INDEX_PATH", "content/published/visibility.json"),
		SearchDocumentsPath:    envOrDefault("SEARCH_DOCUMENTS_PATH", "content/published/search-documents.json"),
		DiscoveryCacheTTL:      durationOrDefault("DISCOVERY_CACHE_TTL", 30*time.Second),
		StorageUploadBaseURL:   envOrDefault("STORAGE_UPLOAD_BASE_URL", "https://uploads.swiftsnippet.local/direct"),
		StorageSigningSecret:   envOrDefault("STORAGE_SIGNING_SECRET", "development-storage-secret"),
		StoragePresignTTL:      durationOrDefault("STORAGE_PRESIGN_TTL", 15*time.Minute),
		UploadRateLimitBurst:   intOrDefault("UPLOAD_RATE_LIMIT_BURST", 5),
		UploadRateLimitWindow:  durationOrDefault("UPLOAD_RATE_LIMIT_WINDOW", time.Minute),
		PublishRateLimitBurst:  intOrDefault("PUBLISH_RATE_LIMIT_BURST", 3),
		PublishRateLimitWindow: durationOrDefault("PUBLISH_RATE_LIMIT_WINDOW", time.Minute),
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

func intOrDefault(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}

	return parsed
}
