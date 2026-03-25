package publish

import (
	"context"
	"errors"
	"testing"
	"time"
)

type memoryRepository struct {
	snippets map[string]SnippetRecord
	states   map[string]StateRecord
	versions map[string]map[string]VersionRecord
}

func (r *memoryRepository) GetSnippet(_ context.Context, snippetID string) (SnippetRecord, error) {
	record, ok := r.snippets[snippetID]
	if !ok {
		return SnippetRecord{}, ErrSnippetNotFound
	}
	return record, nil
}

func (r *memoryRepository) GetState(_ context.Context, snippetID string) (StateRecord, error) {
	record, ok := r.states[snippetID]
	if !ok {
		return StateRecord{}, ErrSnippetNotFound
	}
	return record, nil
}

func (r *memoryRepository) EnsureVersion(_ context.Context, snippetID string, version string) (VersionRecord, error) {
	versions, ok := r.versions[snippetID]
	if !ok {
		return VersionRecord{}, ErrVersionNotFound
	}
	record, ok := versions[version]
	if !ok {
		return VersionRecord{}, ErrVersionNotFound
	}
	return record, nil
}

func (r *memoryRepository) SaveState(_ context.Context, record StateRecord) error {
	r.states[record.SnippetID] = record
	return nil
}

func TestMoveToReviewTransitionsDraftSnippet(t *testing.T) {
	repo := &memoryRepository{
		snippets: map[string]SnippetRecord{
			"stacked-hero-card": {ID: "stacked-hero-card"},
		},
		states: map[string]StateRecord{
			"stacked-hero-card": {SnippetID: "stacked-hero-card", State: "draft"},
		},
		versions: map[string]map[string]VersionRecord{},
	}
	service := NewService(repo)
	service.now = func() time.Time {
		return time.Date(2026, time.March, 25, 13, 0, 0, 0, time.UTC)
	}

	record, err := service.MoveToReview(context.Background(), "stacked-hero-card")
	if err != nil {
		t.Fatalf("MoveToReview returned error: %v", err)
	}
	if record.State != "review" {
		t.Fatalf("expected review state, got %s", record.State)
	}
	if record.ReviewedAt == nil {
		t.Fatalf("expected reviewedAt timestamp")
	}
}

func TestPublishVersionRequiresReviewState(t *testing.T) {
	repo := &memoryRepository{
		snippets: map[string]SnippetRecord{
			"stacked-hero-card": {ID: "stacked-hero-card"},
		},
		states: map[string]StateRecord{
			"stacked-hero-card": {SnippetID: "stacked-hero-card", State: "draft"},
		},
		versions: map[string]map[string]VersionRecord{
			"stacked-hero-card": {
				"1.0.0": {SnippetID: "stacked-hero-card", Version: "1.0.0"},
			},
		},
	}
	service := NewService(repo)

	_, err := service.PublishVersion(context.Background(), "stacked-hero-card", "1.0.0")
	if err == nil || !errors.Is(err, ErrIllegalTransition) {
		t.Fatalf("expected illegal transition error, got %v", err)
	}
}

func TestPublishVersionRequiresKnownVersion(t *testing.T) {
	repo := &memoryRepository{
		snippets: map[string]SnippetRecord{
			"stacked-hero-card": {ID: "stacked-hero-card"},
		},
		states: map[string]StateRecord{
			"stacked-hero-card": {SnippetID: "stacked-hero-card", State: "review"},
		},
		versions: map[string]map[string]VersionRecord{
			"stacked-hero-card": {},
		},
	}
	service := NewService(repo)

	_, err := service.PublishVersion(context.Background(), "stacked-hero-card", "9.9.9")
	if err == nil || !errors.Is(err, ErrVersionNotFound) {
		t.Fatalf("expected version not found error, got %v", err)
	}
}

func TestPublishVersionTransitionsReviewSnippet(t *testing.T) {
	repo := &memoryRepository{
		snippets: map[string]SnippetRecord{
			"stacked-hero-card": {ID: "stacked-hero-card"},
		},
		states: map[string]StateRecord{
			"stacked-hero-card": {SnippetID: "stacked-hero-card", State: "review"},
		},
		versions: map[string]map[string]VersionRecord{
			"stacked-hero-card": {
				"1.0.0": {SnippetID: "stacked-hero-card", Version: "1.0.0"},
			},
		},
	}
	service := NewService(repo)
	service.now = func() time.Time {
		return time.Date(2026, time.March, 25, 13, 30, 0, 0, time.UTC)
	}

	record, err := service.PublishVersion(context.Background(), "stacked-hero-card", "1.0.0")
	if err != nil {
		t.Fatalf("PublishVersion returned error: %v", err)
	}
	if record.State != "published" {
		t.Fatalf("expected published state, got %s", record.State)
	}
	if record.PublishedVersion != "1.0.0" {
		t.Fatalf("unexpected published version: %s", record.PublishedVersion)
	}
	if record.PublishedAt == nil {
		t.Fatalf("expected publishedAt timestamp")
	}
}
