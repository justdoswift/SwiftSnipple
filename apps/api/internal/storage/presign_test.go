package storage

import (
	"strings"
	"testing"
	"time"
)

func TestPresignerBuildsConstrainedUploadResponse(t *testing.T) {
	presigner := NewPresigner("https://uploads.example.test/direct", "secret", 10*time.Minute)
	presigner.now = func() time.Time {
		return time.Date(2026, time.March, 25, 10, 0, 0, 0, time.UTC)
	}

	response, err := presigner.Presign(PresignRequest{
		SnippetID:     "stacked-hero-card",
		Version:       "1.2.0",
		AssetKind:     "cover",
		ContentType:   "image/png",
		ContentLength: 2048,
		ContentHash:   "abc123",
	})
	if err != nil {
		t.Fatalf("presign returned error: %v", err)
	}

	if response.ObjectKey != "stacked-hero-card/1.2.0/cover" {
		t.Fatalf("unexpected object key: %s", response.ObjectKey)
	}
	if response.Method != "PUT" {
		t.Fatalf("unexpected method: %s", response.Method)
	}
	if !strings.Contains(response.UploadURL, "objectKey=stacked-hero-card%2F1.2.0%2Fcover") {
		t.Fatalf("upload URL does not contain constrained object key: %s", response.UploadURL)
	}
	if response.Headers["Content-Type"] != "image/png" {
		t.Fatalf("missing content type header")
	}
	if response.Headers["X-Content-SHA256"] != "abc123" {
		t.Fatalf("missing content hash header")
	}
}

func TestPresignerRejectsUnsupportedAssetKind(t *testing.T) {
	presigner := NewPresigner("https://uploads.example.test/direct", "secret", time.Minute)

	_, err := presigner.Presign(PresignRequest{
		SnippetID:     "stacked-hero-card",
		Version:       "1.2.0",
		AssetKind:     "thumbnail",
		ContentType:   "image/png",
		ContentLength: 1024,
	})
	if err == nil || !strings.Contains(err.Error(), "unsupported assetKind") {
		t.Fatalf("expected unsupported assetKind error, got %v", err)
	}
}

func TestPresignerRejectsEmptySnippetID(t *testing.T) {
	presigner := NewPresigner("https://uploads.example.test/direct", "secret", time.Minute)

	_, err := presigner.Presign(PresignRequest{
		Version:       "1.2.0",
		AssetKind:     "cover",
		ContentType:   "image/png",
		ContentLength: 1024,
	})
	if err == nil || !strings.Contains(err.Error(), "snippetID") {
		t.Fatalf("expected snippetID validation error, got %v", err)
	}
}
