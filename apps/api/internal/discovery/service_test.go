package discovery

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/justdoswift/SwiftSnipple/apps/api/internal/config"
)

func TestFeedOmitsNotPublicAndSortsByFeaturedRank(t *testing.T) {
	service := newTestService(t)

	response, err := service.Feed(context.Background())
	if err != nil {
		t.Fatalf("feed failed: %v", err)
	}

	if len(response.Items) != 2 {
		t.Fatalf("expected 2 published feed items, got %d", len(response.Items))
	}

	if response.Items[0].ID != "stacked-hero-card" {
		t.Fatalf("expected featured item first, got %s", response.Items[0].ID)
	}

	for _, item := range response.Items {
		if item.ID == "review-only-meter" {
			t.Fatalf("unexpected not-public item in feed")
		}
	}
}

func TestSearchRanksCardResults(t *testing.T) {
	service := newTestService(t)

	response, err := service.Search(context.Background(), SearchQuery{Q: "card"})
	if err != nil {
		t.Fatalf("search failed: %v", err)
	}

	if len(response.Items) != 2 {
		t.Fatalf("expected 2 search results, got %d", len(response.Items))
	}

	if response.Items[0].ID != "stacked-hero-card" {
		t.Fatalf("expected stacked-hero-card first on tie-break, got %s", response.Items[0].ID)
	}

	if response.Items[0].Score < response.Items[1].Score {
		t.Fatalf("expected descending score order, got %d < %d", response.Items[0].Score, response.Items[1].Score)
	}
}

func TestSearchFiltersHasDemoFalse(t *testing.T) {
	service := newTestService(t)
	hasDemo := false

	response, err := service.Search(context.Background(), SearchQuery{HasDemo: &hasDemo})
	if err != nil {
		t.Fatalf("search failed: %v", err)
	}

	if len(response.Items) != 1 {
		t.Fatalf("expected 1 no-demo record, got %d", len(response.Items))
	}

	if response.Items[0].ID != "stacked-hero-card" {
		t.Fatalf("expected stacked-hero-card, got %s", response.Items[0].ID)
	}
}

func TestSearchZeroResultReturnsFallbackUpToThree(t *testing.T) {
	service := newTestService(t)

	response, err := service.Search(context.Background(), SearchQuery{Q: "does-not-exist"})
	if err != nil {
		t.Fatalf("search failed: %v", err)
	}

	if response.Total != 0 {
		t.Fatalf("expected zero search results, got %d", response.Total)
	}

	if len(response.Fallback) == 0 {
		t.Fatalf("expected fallback results")
	}

	if len(response.Fallback) > 3 {
		t.Fatalf("expected fallback length <= 3, got %d", len(response.Fallback))
	}
}

func TestDetailReturnsNotPublicError(t *testing.T) {
	service := newTestService(t)

	_, err := service.Detail(context.Background(), "review-only-meter")
	if err == nil {
		t.Fatalf("expected not public error")
	}

	var notPublicErr NotPublicError
	if !errors.As(err, &notPublicErr) {
		t.Fatalf("expected NotPublicError, got %v", err)
	}
}

func TestDetailReturnsNotFoundForUnknownID(t *testing.T) {
	service := newTestService(t)

	_, err := service.Detail(context.Background(), "missing-snippet")
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected not found error, got %v", err)
	}
}

func newTestService(t *testing.T) *Service {
	t.Helper()

	cfg := config.Load()
	repo := NewRepository(cfg)
	return NewService(repo, nil, 30*time.Second)
}
