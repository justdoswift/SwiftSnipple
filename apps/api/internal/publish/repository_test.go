package publish

import (
	"context"
	"errors"
	"testing"
)

func TestInMemoryRepositoryReturnsKnownState(t *testing.T) {
	repo := NewInMemoryRepository()

	record, err := repo.GetState(context.Background(), "stacked-hero-card")
	if err != nil {
		t.Fatalf("GetState returned error: %v", err)
	}
	if record.State != "draft" {
		t.Fatalf("expected draft state, got %s", record.State)
	}
}

func TestInMemoryRepositoryRejectsUnknownVersion(t *testing.T) {
	repo := NewInMemoryRepository()

	_, err := repo.EnsureVersion(context.Background(), "stacked-hero-card", "9.9.9")
	if !errors.Is(err, ErrVersionNotFound) {
		t.Fatalf("expected ErrVersionNotFound, got %v", err)
	}
}
