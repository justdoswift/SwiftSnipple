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

type fakeArticleStore struct {
	articles       map[string]domain.Article
	articlesBySlug map[string]string
	duplicateSlug  string
}

func newFakeArticleStore(items ...domain.Article) *fakeArticleStore {
	store := &fakeArticleStore{
		articles:       map[string]domain.Article{},
		articlesBySlug: map[string]string{},
	}

	for _, article := range items {
		store.articles[article.ID] = article
		store.articlesBySlug[article.Slug] = article.ID
	}

	return store
}

func (f *fakeArticleStore) List(context.Context) ([]domain.Article, error) {
	articles := make([]domain.Article, 0, len(f.articles))
	for _, article := range f.articles {
		articles = append(articles, article)
	}
	return articles, nil
}

func (f *fakeArticleStore) GetByID(_ context.Context, id string) (domain.Article, error) {
	article, ok := f.articles[id]
	if !ok {
		return domain.Article{}, repo.ErrNotFound
	}
	return article, nil
}

func (f *fakeArticleStore) GetBySlug(_ context.Context, slug string) (domain.Article, error) {
	id, ok := f.articlesBySlug[slug]
	if !ok {
		return domain.Article{}, repo.ErrNotFound
	}
	return f.articles[id], nil
}

func (f *fakeArticleStore) Create(_ context.Context, payload domain.ArticlePayload) (domain.Article, error) {
	if payload.Slug == f.duplicateSlug {
		return domain.Article{}, errors.New("duplicate key value violates unique constraint")
	}

	article := domain.Article{
		ID:             "new-id",
		Title:          payload.Title,
		Slug:           payload.Slug,
		Excerpt:        payload.Excerpt,
		Category:       payload.Category,
		Tags:           payload.Tags,
		CoverImage:     payload.CoverImage,
		Content:        payload.Content,
		SEOTitle:       payload.SEOTitle,
		SEODescription: payload.SEODescription,
		Status:         payload.Status,
		UpdatedAt:      time.Now().UTC(),
		PublishedAt:    payload.PublishedAt,
	}

	f.articles[article.ID] = article
	f.articlesBySlug[article.Slug] = article.ID
	return article, nil
}

func (f *fakeArticleStore) Update(_ context.Context, id string, payload domain.ArticlePayload) (domain.Article, error) {
	article, ok := f.articles[id]
	if !ok {
		return domain.Article{}, repo.ErrNotFound
	}
	if payload.Slug == f.duplicateSlug && payload.Slug != article.Slug {
		return domain.Article{}, errors.New("duplicate key value violates unique constraint")
	}

	article.Title = payload.Title
	article.Slug = payload.Slug
	article.Excerpt = payload.Excerpt
	article.Category = payload.Category
	article.Tags = payload.Tags
	article.CoverImage = payload.CoverImage
	article.Content = payload.Content
	article.SEOTitle = payload.SEOTitle
	article.SEODescription = payload.SEODescription
	article.Status = payload.Status
	article.PublishedAt = payload.PublishedAt
	article.UpdatedAt = time.Now().UTC()
	f.articles[id] = article
	f.articlesBySlug[article.Slug] = id

	return article, nil
}

func (f *fakeArticleStore) Publish(_ context.Context, id string) (domain.Article, error) {
	article, ok := f.articles[id]
	if !ok {
		return domain.Article{}, repo.ErrNotFound
	}
	now := time.Now().UTC()
	article.Status = domain.StatusPublished
	article.PublishedAt = &now
	f.articles[id] = article
	return article, nil
}

func (f *fakeArticleStore) Unpublish(_ context.Context, id string) (domain.Article, error) {
	article, ok := f.articles[id]
	if !ok {
		return domain.Article{}, repo.ErrNotFound
	}
	article.Status = domain.StatusDraft
	article.PublishedAt = nil
	f.articles[id] = article
	return article, nil
}

func (f *fakeArticleStore) Delete(_ context.Context, id string) error {
	article, ok := f.articles[id]
	if !ok {
		return repo.ErrNotFound
	}
	delete(f.articlesBySlug, article.Slug)
	delete(f.articles, id)
	return nil
}

func TestArticleRoutesSuccess(t *testing.T) {
	now := time.Now().UTC()
	store := newFakeArticleStore(domain.Article{
		ID:          "article-1",
		Title:       "Glass Drawer Navigation",
		Slug:        "glass-drawer-navigation",
		Category:    "Navigation",
		Status:      domain.StatusPublished,
		UpdatedAt:   now,
		PublishedAt: &now,
	})
	router := NewRouter(fakePinger{}, store)

	req := httptest.NewRequest(http.MethodGet, "/api/articles", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected list status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/articles/article-1", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected get-by-id status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/articles/slug/glass-drawer-navigation", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected get-by-slug status 200, got %d", rec.Code)
	}
}

func TestCreateValidationAndDuplicateErrors(t *testing.T) {
	store := newFakeArticleStore()
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
			req := httptest.NewRequest(http.MethodPost, "/api/admin/articles", strings.NewReader(tc.body))
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
	store := newFakeArticleStore(domain.Article{
		ID:          "article-1",
		Title:       "Prompt Driven Layout",
		Slug:        "prompt-driven-layout",
		Status:      domain.StatusScheduled,
		UpdatedAt:   now,
		PublishedAt: &now,
	})
	router := NewRouter(fakePinger{}, store)

	req := httptest.NewRequest(http.MethodPost, "/api/admin/articles/article-1/publish", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected publish status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodPost, "/api/admin/articles/article-1/unpublish", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected unpublish status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodDelete, "/api/admin/articles/article-1", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected delete status 204, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/articles/article-1", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected missing get status 404, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodDelete, "/api/admin/articles/missing", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected missing delete status 404, got %d", rec.Code)
	}
}

func TestHealthz(t *testing.T) {
	router := NewRouter(fakePinger{}, newFakeArticleStore())
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
