package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"swiftsnipple/api/internal/domain"
	"swiftsnipple/api/internal/repo"
)

type dbPinger interface {
	Ping(ctx context.Context) error
}

type articleStore interface {
	List(ctx context.Context) ([]domain.Article, error)
	GetByID(ctx context.Context, id string) (domain.Article, error)
	GetBySlug(ctx context.Context, slug string) (domain.Article, error)
	Create(ctx context.Context, payload domain.ArticlePayload) (domain.Article, error)
	Update(ctx context.Context, id string, payload domain.ArticlePayload) (domain.Article, error)
	Publish(ctx context.Context, id string) (domain.Article, error)
	Unpublish(ctx context.Context, id string) (domain.Article, error)
	Delete(ctx context.Context, id string) error
}

type Handler struct {
	db       dbPinger
	articles articleStore
}

func (h *Handler) Healthz(w http.ResponseWriter, r *http.Request) {
	if err := h.db.Ping(r.Context()); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"status": "unhealthy"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) ListArticles(w http.ResponseWriter, r *http.Request) {
	articles, err := h.articles.List(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list articles"})
		return
	}

	writeJSON(w, http.StatusOK, articles)
}

func (h *Handler) GetArticle(w http.ResponseWriter, r *http.Request) {
	article, err := h.articles.GetByID(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "article not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to fetch article"})
		return
	}

	writeJSON(w, http.StatusOK, article)
}

func (h *Handler) GetArticleBySlug(w http.ResponseWriter, r *http.Request) {
	article, err := h.articles.GetBySlug(r.Context(), chi.URLParam(r, "slug"))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "article not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to fetch article"})
		return
	}

	writeJSON(w, http.StatusOK, article)
}

func (h *Handler) CreateArticle(w http.ResponseWriter, r *http.Request) {
	payload, ok := decodePayload(w, r)
	if !ok {
		return
	}

	article, err := h.articles.Create(r.Context(), payload)
	if err != nil {
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, article)
}

func (h *Handler) UpdateArticle(w http.ResponseWriter, r *http.Request) {
	payload, ok := decodePayload(w, r)
	if !ok {
		return
	}

	article, err := h.articles.Update(r.Context(), chi.URLParam(r, "id"), payload)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "article not found"})
			return
		}
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, article)
}

func (h *Handler) PublishArticle(w http.ResponseWriter, r *http.Request) {
	article, err := h.articles.Publish(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "article not found"})
			return
		}
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, article)
}

func (h *Handler) UnpublishArticle(w http.ResponseWriter, r *http.Request) {
	article, err := h.articles.Unpublish(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "article not found"})
			return
		}
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, article)
}

func (h *Handler) DeleteArticle(w http.ResponseWriter, r *http.Request) {
	if err := h.articles.Delete(r.Context(), chi.URLParam(r, "id")); err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "article not found"})
			return
		}
		writeRepositoryError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func decodePayload(w http.ResponseWriter, r *http.Request) (domain.ArticlePayload, bool) {
	var payload domain.ArticlePayload
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": describeDecodeError(err)})
		return domain.ArticlePayload{}, false
	}

	payload = payload.Normalize()
	if strings.TrimSpace(payload.Title) == "" || strings.TrimSpace(payload.Slug) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "title and slug are required"})
		return domain.ArticlePayload{}, false
	}
	if !domain.IsValidStatus(payload.Status) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid status"})
		return domain.ArticlePayload{}, false
	}

	return payload, true
}

func describeDecodeError(err error) string {
	message := strings.ToLower(err.Error())
	if strings.Contains(message, "publishedat") || strings.Contains(message, "time") {
		return "invalid publishedAt"
	}

	return "invalid json payload"
}

func writeRepositoryError(w http.ResponseWriter, err error) {
	if strings.Contains(strings.ToLower(err.Error()), "duplicate key") {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "slug already exists"})
		return
	}

	writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "request failed"})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
