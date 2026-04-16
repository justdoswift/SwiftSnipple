package http

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"swiftsnipple/api/internal/domain"
	"swiftsnipple/api/internal/repo"
)

type fakePinger struct {
	err error
}

func (f fakePinger) Ping(context.Context) error {
	return f.err
}

type fakeSnippetStore struct {
	snippets       map[string]domain.Snippet
	snippetsBySlug map[string]string
	duplicateSlug  string
}

func newFakeSnippetStore(items ...domain.Snippet) *fakeSnippetStore {
	store := &fakeSnippetStore{
		snippets:       map[string]domain.Snippet{},
		snippetsBySlug: map[string]string{},
	}

	for _, snippet := range items {
		store.snippets[snippet.ID] = snippet
		store.snippetsBySlug[snippet.Slug] = snippet.ID
	}

	return store
}

func (f *fakeSnippetStore) List(context.Context) ([]domain.Snippet, error) {
	snippets := make([]domain.Snippet, 0, len(f.snippets))
	for _, snippet := range f.snippets {
		snippets = append(snippets, snippet)
	}
	return snippets, nil
}

func (f *fakeSnippetStore) GetByID(_ context.Context, id string) (domain.Snippet, error) {
	snippet, ok := f.snippets[id]
	if !ok {
		return domain.Snippet{}, repo.ErrNotFound
	}
	return snippet, nil
}

func (f *fakeSnippetStore) GetBySlug(_ context.Context, slug string) (domain.Snippet, error) {
	id, ok := f.snippetsBySlug[slug]
	if !ok {
		return domain.Snippet{}, repo.ErrNotFound
	}
	return f.snippets[id], nil
}

func (f *fakeSnippetStore) Create(_ context.Context, payload domain.SnippetPayload) (domain.Snippet, error) {
	if payload.Slug == f.duplicateSlug {
		return domain.Snippet{}, errors.New("duplicate key value violates unique constraint")
	}

	snippet := domain.Snippet{
		ID:             "new-id",
		Title:          payload.Title,
		Slug:           payload.Slug,
		Excerpt:        payload.Excerpt,
		Category:       payload.Category,
		Tags:           payload.Tags,
		CoverImage:     payload.CoverImage,
		Content:        payload.Content,
		Code:           payload.Code,
		Prompts:        payload.Prompts,
		SEOTitle:       payload.SEOTitle,
		SEODescription: payload.SEODescription,
		Status:         payload.Status,
		UpdatedAt:      time.Now().UTC(),
		PublishedAt:    payload.PublishedAt,
	}

	f.snippets[snippet.ID] = snippet
	f.snippetsBySlug[snippet.Slug] = snippet.ID
	return snippet, nil
}

func (f *fakeSnippetStore) Update(_ context.Context, id string, payload domain.SnippetPayload) (domain.Snippet, error) {
	snippet, ok := f.snippets[id]
	if !ok {
		return domain.Snippet{}, repo.ErrNotFound
	}
	if payload.Slug == f.duplicateSlug && payload.Slug != snippet.Slug {
		return domain.Snippet{}, errors.New("duplicate key value violates unique constraint")
	}

	snippet.Title = payload.Title
	snippet.Slug = payload.Slug
	snippet.Excerpt = payload.Excerpt
	snippet.Category = payload.Category
	snippet.Tags = payload.Tags
	snippet.CoverImage = payload.CoverImage
	snippet.Content = payload.Content
	snippet.Code = payload.Code
	snippet.Prompts = payload.Prompts
	snippet.SEOTitle = payload.SEOTitle
	snippet.SEODescription = payload.SEODescription
	snippet.Status = payload.Status
	snippet.PublishedAt = payload.PublishedAt
	snippet.UpdatedAt = time.Now().UTC()
	f.snippets[id] = snippet
	f.snippetsBySlug[snippet.Slug] = id

	return snippet, nil
}

func (f *fakeSnippetStore) Publish(_ context.Context, id string) (domain.Snippet, error) {
	snippet, ok := f.snippets[id]
	if !ok {
		return domain.Snippet{}, repo.ErrNotFound
	}
	now := time.Now().UTC()
	snippet.Status = domain.StatusPublished
	snippet.PublishedAt = &now
	f.snippets[id] = snippet
	return snippet, nil
}

func (f *fakeSnippetStore) Unpublish(_ context.Context, id string) (domain.Snippet, error) {
	snippet, ok := f.snippets[id]
	if !ok {
		return domain.Snippet{}, repo.ErrNotFound
	}
	snippet.Status = domain.StatusDraft
	snippet.PublishedAt = nil
	f.snippets[id] = snippet
	return snippet, nil
}

func (f *fakeSnippetStore) Delete(_ context.Context, id string) error {
	snippet, ok := f.snippets[id]
	if !ok {
		return repo.ErrNotFound
	}
	delete(f.snippetsBySlug, snippet.Slug)
	delete(f.snippets, id)
	return nil
}

func TestSnippetRoutesSuccess(t *testing.T) {
	now := time.Now().UTC()
	store := newFakeSnippetStore(domain.Snippet{
		ID:          "snippet-1",
		Title:       "Glass Drawer Navigation",
		Slug:        "glass-drawer-navigation",
		Category:    "Navigation",
		Status:      domain.StatusPublished,
		UpdatedAt:   now,
		PublishedAt: &now,
	})
	router := NewRouter(fakePinger{}, store)

	req := httptest.NewRequest(http.MethodGet, "/api/snippets", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected list status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/snippets/snippet-1", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected get-by-id status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/snippets/slug/glass-drawer-navigation", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected get-by-slug status 200, got %d", rec.Code)
	}
}

func TestCreateValidationAndDuplicateErrors(t *testing.T) {
	store := newFakeSnippetStore()
	store.duplicateSlug = "taken-slug"
	router := NewRouter(fakePinger{}, store)

	testCases := []struct {
		name       string
		body       string
		statusCode int
		errorText  string
	}{
		{
			name:       "empty title",
			body:       `{"title":"","slug":"valid-slug","status":"Draft"}`,
			statusCode: http.StatusBadRequest,
			errorText:  "title and slug are required",
		},
		{
			name:       "invalid status",
			body:       `{"title":"A","slug":"valid-slug","status":"Archived"}`,
			statusCode: http.StatusBadRequest,
			errorText:  "invalid status",
		},
		{
			name:       "malformed publishedAt",
			body:       `{"title":"A","slug":"valid-slug","status":"Scheduled","publishedAt":"tomorrowish"}`,
			statusCode: http.StatusBadRequest,
			errorText:  "invalid publishedAt",
		},
		{
			name:       "duplicate slug",
			body:       `{"title":"A","slug":"taken-slug","status":"Draft"}`,
			statusCode: http.StatusBadRequest,
			errorText:  "slug already exists",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/admin/snippets", strings.NewReader(tc.body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, req)

			if rec.Code != tc.statusCode {
				t.Fatalf("expected status %d, got %d", tc.statusCode, rec.Code)
			}
			if !strings.Contains(rec.Body.String(), tc.errorText) {
				t.Fatalf("expected response to contain %q, got %q", tc.errorText, rec.Body.String())
			}
		})
	}
}

func TestPublishUnpublishDeleteAndMissingRoutes(t *testing.T) {
	now := time.Now().UTC()
	store := newFakeSnippetStore(domain.Snippet{
		ID:          "snippet-1",
		Title:       "Prompt Driven Layout",
		Slug:        "prompt-driven-layout",
		Status:      domain.StatusScheduled,
		UpdatedAt:   now,
		PublishedAt: &now,
	})
	router := NewRouter(fakePinger{}, store)

	req := httptest.NewRequest(http.MethodPost, "/api/admin/snippets/snippet-1/publish", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected publish status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodPost, "/api/admin/snippets/snippet-1/unpublish", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected unpublish status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodDelete, "/api/admin/snippets/snippet-1", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected delete status 204, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/snippets/snippet-1", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected missing get status 404, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodDelete, "/api/admin/snippets/missing", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected missing delete status 404, got %d", rec.Code)
	}
}

func TestHealthz(t *testing.T) {
	router := NewRouter(fakePinger{}, newFakeSnippetStore())
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected healthz status 200, got %d", rec.Code)
	}

	var body map[string]string
	if err := json.NewDecoder(bytes.NewReader(rec.Body.Bytes())).Decode(&body); err != nil {
		t.Fatalf("decode healthz body: %v", err)
	}
	if body["status"] != "ok" {
		t.Fatalf("expected status ok, got %#v", body)
	}
}
