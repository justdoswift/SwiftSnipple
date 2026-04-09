package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"swiftsnipple/api/internal/domain"
	"swiftsnipple/api/internal/repo"
)

type Handler struct {
	db       *pgxpool.Pool
	articles *repo.ArticleRepository
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

func decodePayload(w http.ResponseWriter, r *http.Request) (domain.ArticlePayload, bool) {
	var payload domain.ArticlePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json payload"})
		return domain.ArticlePayload{}, false
	}

	payload = payload.Normalize()
	if strings.TrimSpace(payload.Title) == "" || strings.TrimSpace(payload.Slug) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "title and slug are required"})
		return domain.ArticlePayload{}, false
	}

	return payload, true
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
