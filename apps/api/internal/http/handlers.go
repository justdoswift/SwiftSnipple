package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"swiftsnipple/api/internal/domain"
	"swiftsnipple/api/internal/repo"
)

type dbPinger interface {
	Ping(ctx context.Context) error
}

type snippetStore interface {
	List(ctx context.Context) ([]domain.Snippet, error)
	GetByID(ctx context.Context, id string) (domain.Snippet, error)
	GetBySlug(ctx context.Context, slug string) (domain.Snippet, error)
	Create(ctx context.Context, payload domain.SnippetPayload) (domain.Snippet, error)
	Update(ctx context.Context, id string, payload domain.SnippetPayload) (domain.Snippet, error)
	Publish(ctx context.Context, id string) (domain.Snippet, error)
	Unpublish(ctx context.Context, id string) (domain.Snippet, error)
	Delete(ctx context.Context, id string) error
}

type Handler struct {
	db       dbPinger
	snippets snippetStore
	auth     adminAuth
}

func (h *Handler) Healthz(w http.ResponseWriter, r *http.Request) {
	if err := h.db.Ping(r.Context()); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"status": "unhealthy"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) ListSnippets(w http.ResponseWriter, r *http.Request) {
	snippets, err := h.snippets.List(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list snippets"})
		return
	}

	writeJSON(w, http.StatusOK, snippets)
}

func (h *Handler) GetSnippet(w http.ResponseWriter, r *http.Request) {
	snippet, err := h.snippets.GetByID(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to fetch snippet"})
		return
	}

	writeJSON(w, http.StatusOK, snippet)
}

func (h *Handler) GetSnippetBySlug(w http.ResponseWriter, r *http.Request) {
	snippet, err := h.snippets.GetBySlug(r.Context(), chi.URLParam(r, "slug"))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to fetch snippet"})
		return
	}

	writeJSON(w, http.StatusOK, snippet)
}

func (h *Handler) CreateSnippet(w http.ResponseWriter, r *http.Request) {
	payload, ok := decodeSnippetPayload(w, r)
	if !ok {
		return
	}

	snippet, err := h.snippets.Create(r.Context(), payload)
	if err != nil {
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, snippet)
}

func (h *Handler) UpdateSnippet(w http.ResponseWriter, r *http.Request) {
	payload, ok := decodeSnippetPayload(w, r)
	if !ok {
		return
	}

	snippet, err := h.snippets.Update(r.Context(), chi.URLParam(r, "id"), payload)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
			return
		}
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, snippet)
}

func (h *Handler) PublishSnippet(w http.ResponseWriter, r *http.Request) {
	snippet, err := h.snippets.Publish(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
			return
		}
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, snippet)
}

func (h *Handler) UnpublishSnippet(w http.ResponseWriter, r *http.Request) {
	snippet, err := h.snippets.Unpublish(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
			return
		}
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, snippet)
}

func (h *Handler) DeleteSnippet(w http.ResponseWriter, r *http.Request) {
	if err := h.snippets.Delete(r.Context(), chi.URLParam(r, "id")); err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
			return
		}
		writeRepositoryError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) AdminLogin(w http.ResponseWriter, r *http.Request) {
	var payload adminLoginRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json payload"})
		return
	}

	if !h.auth.authenticate(payload.Email, payload.Password) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}

	now := time.Now().UTC()
	expiresAt := now.Add(adminSessionDuration)
	sessionPayload := adminSessionPayload{
		Email:     strings.ToLower(strings.TrimSpace(payload.Email)),
		IssuedAt:  now.Format(time.RFC3339),
		ExpiresAt: expiresAt.Format(time.RFC3339),
	}

	token, err := h.auth.signSession(sessionPayload)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create session"})
		return
	}

	http.SetCookie(w, h.auth.sessionCookie(token, expiresAt))
	writeJSON(w, http.StatusOK, sessionResponseFromPayload(sessionPayload))
}

func (h *Handler) AdminLogout(w http.ResponseWriter, r *http.Request) {
	clearAdminSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) AdminSession(w http.ResponseWriter, r *http.Request) {
	session, ok := h.readAdminSession(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	writeJSON(w, http.StatusOK, sessionResponseFromPayload(*session))
}

func decodeSnippetPayload(w http.ResponseWriter, r *http.Request) (domain.SnippetPayload, bool) {
	var payload domain.SnippetPayload
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": describeDecodeError(err)})
		return domain.SnippetPayload{}, false
	}

	payload = payload.Normalize()
	if strings.TrimSpace(payload.Locales.EN.Title) == "" ||
		strings.TrimSpace(payload.Locales.EN.Slug) == "" ||
		strings.TrimSpace(payload.Locales.ZH.Title) == "" ||
		strings.TrimSpace(payload.Locales.ZH.Slug) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "localized title and slug are required"})
		return domain.SnippetPayload{}, false
	}
	if !domain.IsValidStatus(payload.Status) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid status"})
		return domain.SnippetPayload{}, false
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
