package http

import (
	"crypto/rand"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"io"
	"mime/multipart"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/skrashevich/go-webp"
	"golang.org/x/image/draw"
	"swiftsnipple/api/internal/domain"
	"swiftsnipple/api/internal/repo"

	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	_ "golang.org/x/image/webp"
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
	uploads  localUploader
}

type localUploader struct {
	dir string
}

const (
	maxCoverImageDimension = 2200
	coverImageWebPQuality  = 92
)

func newLocalUploader(dir string) localUploader {
	cleanDir := strings.TrimSpace(dir)
	if cleanDir == "" {
		cleanDir = "uploads"
	}

	return localUploader{dir: filepath.Clean(cleanDir)}
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

func (h *Handler) UploadCoverImage(w http.ResponseWriter, r *http.Request) {
	const maxCoverUploadBytes = 25 << 20

	r.Body = http.MaxBytesReader(w, r.Body, maxCoverUploadBytes)
	if err := r.ParseMultipartForm(maxCoverUploadBytes); err != nil {
		var maxBytesError *http.MaxBytesError
		if errors.As(err, &maxBytesError) {
			writeJSON(w, http.StatusRequestEntityTooLarge, map[string]string{"error": "cover image must be 25 MB or smaller"})
			return
		}

		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid multipart upload payload"})
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "cover image file is required"})
		return
	}
	defer file.Close()

	urlPath, err := h.uploads.saveImage(file, header)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"url": urlPath})
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

func (u localUploader) saveImage(file multipart.File, _ *multipart.FileHeader) (string, error) {
	if err := os.MkdirAll(u.dir, 0o755); err != nil {
		return "", errors.New("failed to prepare upload directory")
	}

	sniffBuffer := make([]byte, 512)
	bytesRead, err := file.Read(sniffBuffer)
	if err != nil && !errors.Is(err, io.EOF) {
		return "", errors.New("failed to read cover image")
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", errors.New("failed to reset cover image")
	}

	contentType := http.DetectContentType(sniffBuffer[:bytesRead])
	if !isAllowedCoverContentType(contentType) {
		return "", errors.New("cover image must be PNG, JPEG, WEBP, or GIF")
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", errors.New("failed to reset cover image")
	}

	decodedImage, _, err := image.Decode(file)
	if err != nil {
		return "", errors.New("failed to decode cover image")
	}

	optimizedImage := optimizeCoverImage(decodedImage)

	randomName, err := randomUploadName()
	if err != nil {
		return "", errors.New("failed to create upload name")
	}

	fileName := randomName + ".webp"
	destinationPath := filepath.Join(u.dir, fileName)
	destinationFile, err := os.Create(destinationPath)
	if err != nil {
		return "", errors.New("failed to store cover image")
	}
	defer destinationFile.Close()

	if err := webp.Encode(destinationFile, optimizedImage, &webp.Options{
		Lossy:   true,
		Quality: float32(coverImageWebPQuality),
	}); err != nil {
		return "", errors.New("failed to compress cover image")
	}

	return "/api/uploads/" + fileName, nil
}

func isAllowedCoverContentType(contentType string) bool {
	switch contentType {
	case "image/png":
		return true
	case "image/jpeg":
		return true
	case "image/webp":
		return true
	case "image/gif":
		return true
	default:
		return false
	}
}

func optimizeCoverImage(src image.Image) image.Image {
	bounds := src.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()
	if width <= 0 || height <= 0 {
		return src
	}

	if width <= maxCoverImageDimension && height <= maxCoverImageDimension {
		return cloneToNRGBA(src)
	}

	scale := math.Min(
		float64(maxCoverImageDimension)/float64(width),
		float64(maxCoverImageDimension)/float64(height),
	)
	targetWidth := max(1, int(math.Round(float64(width)*scale)))
	targetHeight := max(1, int(math.Round(float64(height)*scale)))

	destination := image.NewNRGBA(image.Rect(0, 0, targetWidth, targetHeight))
	draw.CatmullRom.Scale(destination, destination.Bounds(), src, bounds, draw.Over, nil)
	return destination
}

func cloneToNRGBA(src image.Image) image.Image {
	bounds := src.Bounds()
	destination := image.NewNRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	draw.Draw(destination, destination.Bounds(), src, bounds.Min, draw.Src)
	return destination
}

func randomUploadName() (string, error) {
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}

	return fmt.Sprintf("%x", randomBytes), nil
}
