package http

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"image"
	"image/color"
	"image/png"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"swiftsnipple/api/internal/domain"
	"swiftsnipple/api/internal/repo"

	_ "golang.org/x/image/webp"
)

var testAdminAuthConfig = AdminAuthConfig{
	Email:         "creator@justdoswift.com",
	Password:      "secret12",
	SessionSecret: "test-admin-session-secret",
}

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
		store.storeSnippet(snippet)
	}

	return store
}

func (f *fakeSnippetStore) storeSnippet(snippet domain.Snippet) {
	f.snippets[snippet.ID] = snippet
	f.snippetsBySlug[snippet.Locales.EN.Slug] = snippet.ID
	f.snippetsBySlug[snippet.Locales.ZH.Slug] = snippet.ID
}

func (f *fakeSnippetStore) removeSnippet(snippet domain.Snippet) {
	delete(f.snippetsBySlug, snippet.Locales.EN.Slug)
	delete(f.snippetsBySlug, snippet.Locales.ZH.Slug)
	delete(f.snippets, snippet.ID)
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
	normalized := payload.Normalize()
	if normalized.Locales.EN.Slug == f.duplicateSlug || normalized.Locales.ZH.Slug == f.duplicateSlug {
		return domain.Snippet{}, errors.New("duplicate key value violates unique constraint")
	}

	snippet := domain.Snippet{
		ID:          "new-id",
		CoverImage:  normalized.CoverImage,
		Code:        normalized.Code,
		Status:      normalized.Status,
		UpdatedAt:   time.Now().UTC(),
		PublishedAt: normalized.PublishedAt,
		Locales:     normalized.Locales,
	}

	f.storeSnippet(snippet)
	return snippet, nil
}

func (f *fakeSnippetStore) Update(_ context.Context, id string, payload domain.SnippetPayload) (domain.Snippet, error) {
	snippet, ok := f.snippets[id]
	if !ok {
		return domain.Snippet{}, repo.ErrNotFound
	}

	normalized := payload.Normalize()
	if (normalized.Locales.EN.Slug == f.duplicateSlug && normalized.Locales.EN.Slug != snippet.Locales.EN.Slug) ||
		(normalized.Locales.ZH.Slug == f.duplicateSlug && normalized.Locales.ZH.Slug != snippet.Locales.ZH.Slug) {
		return domain.Snippet{}, errors.New("duplicate key value violates unique constraint")
	}

	f.removeSnippet(snippet)

	snippet.CoverImage = normalized.CoverImage
	snippet.Code = normalized.Code
	snippet.Status = normalized.Status
	snippet.PublishedAt = normalized.PublishedAt
	snippet.UpdatedAt = time.Now().UTC()
	snippet.Locales = normalized.Locales

	f.storeSnippet(snippet)
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
	f.storeSnippet(snippet)
	return snippet, nil
}

func (f *fakeSnippetStore) Unpublish(_ context.Context, id string) (domain.Snippet, error) {
	snippet, ok := f.snippets[id]
	if !ok {
		return domain.Snippet{}, repo.ErrNotFound
	}
	snippet.Status = domain.StatusDraft
	snippet.PublishedAt = nil
	f.storeSnippet(snippet)
	return snippet, nil
}

func (f *fakeSnippetStore) Delete(_ context.Context, id string) error {
	snippet, ok := f.snippets[id]
	if !ok {
		return repo.ErrNotFound
	}
	f.removeSnippet(snippet)
	return nil
}

func localizedFields(title, slug, category string) domain.SnippetLocalizedFields {
	return domain.SnippetLocalizedFields{
		Title:          title,
		Slug:           slug,
		Excerpt:        title + " excerpt",
		Category:       category,
		Tags:           []string{"SwiftUI"},
		Content:        "# " + title,
		Prompts:        "Build " + title,
		SEOTitle:       title,
		SEODescription: title + " SEO",
	}
}

func snippetPayloadJSON(t *testing.T, payload domain.SnippetPayload) string {
	t.Helper()

	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}

	return string(body)
}

func loginCookie(t *testing.T, router http.Handler) *http.Cookie {
	t.Helper()

	req := httptest.NewRequest(
		http.MethodPost,
		"/api/admin/login",
		strings.NewReader(`{"email":"creator@justdoswift.com","password":"secret12"}`),
	)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected login status 200, got %d", rec.Code)
	}

	cookies := rec.Result().Cookies()
	if len(cookies) == 0 {
		t.Fatal("expected login to set a session cookie")
	}

	return cookies[0]
}

func TestSnippetRoutesSuccess(t *testing.T) {
	now := time.Now().UTC()
	store := newFakeSnippetStore(domain.Snippet{
		ID:          "snippet-1",
		CoverImage:  "https://example.com/cover.jpg",
		Code:        "Text(\"Hello\")",
		Status:      domain.StatusPublished,
		UpdatedAt:   now,
		PublishedAt: &now,
		Locales: domain.SnippetLocales{
			EN: localizedFields("Glass Drawer Navigation", "glass-drawer-navigation", "Navigation"),
			ZH: localizedFields("玻璃抽屉导航", "bo-li-chou-ti-dao-hang", "Navigation"),
		},
	})
	router := NewRouter(fakePinger{}, store, testAdminAuthConfig, t.TempDir())

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
		t.Fatalf("expected get-by-slug EN status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/snippets/slug/bo-li-chou-ti-dao-hang", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected get-by-slug ZH status 200, got %d", rec.Code)
	}
}

func TestCreateValidationAndDuplicateErrors(t *testing.T) {
	store := newFakeSnippetStore()
	store.duplicateSlug = "taken-slug"
	router := NewRouter(fakePinger{}, store, testAdminAuthConfig, t.TempDir())
	adminCookie := loginCookie(t, router)

	testCases := []struct {
		name       string
		payload    domain.SnippetPayload
		statusCode int
		errorText  string
	}{
		{
			name: "empty localized title",
			payload: domain.SnippetPayload{
				Status: domain.StatusDraft,
				Locales: domain.SnippetLocales{
					EN: localizedFields("", "valid-slug", "Workflow"),
					ZH: localizedFields("标题", "valid-zh-slug", "Workflow"),
				},
			},
			statusCode: http.StatusBadRequest,
			errorText:  "localized title and slug are required",
		},
		{
			name: "invalid status",
			payload: domain.SnippetPayload{
				Status: "Archived",
				Locales: domain.SnippetLocales{
					EN: localizedFields("A", "valid-slug", "Workflow"),
					ZH: localizedFields("A 中文", "valid-zh-slug", "Workflow"),
				},
			},
			statusCode: http.StatusBadRequest,
			errorText:  "invalid status",
		},
		{
			name: "duplicate slug",
			payload: domain.SnippetPayload{
				Status: domain.StatusDraft,
				Locales: domain.SnippetLocales{
					EN: localizedFields("A", "taken-slug", "Workflow"),
					ZH: localizedFields("A 中文", "zh-slug", "Workflow"),
				},
			},
			statusCode: http.StatusBadRequest,
			errorText:  "slug already exists",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/admin/snippets", strings.NewReader(snippetPayloadJSON(t, tc.payload)))
			req.Header.Set("Content-Type", "application/json")
			req.AddCookie(adminCookie)
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

	req := httptest.NewRequest(
		http.MethodPost,
		"/api/admin/snippets",
		strings.NewReader(`{"status":"Draft","publishedAt":"tomorrowish","locales":{"en":{"title":"A","slug":"valid-slug"},"zh":{"title":"中文","slug":"valid-zh-slug"}}}`),
	)
	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(adminCookie)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected malformed publishedAt status 400, got %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "invalid publishedAt") {
		t.Fatalf("expected publishedAt validation error, got %q", rec.Body.String())
	}
}

func TestPublishUnpublishDeleteAndMissingRoutes(t *testing.T) {
	now := time.Now().UTC()
	store := newFakeSnippetStore(domain.Snippet{
		ID:          "snippet-1",
		CoverImage:  "https://example.com/cover.jpg",
		Code:        "Text(\"Hello\")",
		Status:      domain.StatusDraft,
		UpdatedAt:   now,
		PublishedAt: &now,
		Locales: domain.SnippetLocales{
			EN: localizedFields("Prompt Driven Layout", "prompt-driven-layout", "Workflow"),
			ZH: localizedFields("提示驱动布局", "ti-shi-qu-dong-bu-ju", "Workflow"),
		},
	})
	router := NewRouter(fakePinger{}, store, testAdminAuthConfig, t.TempDir())
	adminCookie := loginCookie(t, router)

	req := httptest.NewRequest(http.MethodPost, "/api/admin/snippets/snippet-1/publish", nil)
	req.AddCookie(adminCookie)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected publish status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodPost, "/api/admin/snippets/snippet-1/unpublish", nil)
	req.AddCookie(adminCookie)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected unpublish status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodDelete, "/api/admin/snippets/snippet-1", nil)
	req.AddCookie(adminCookie)
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
	req.AddCookie(adminCookie)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected missing delete status 404, got %d", rec.Code)
	}
}

func TestHealthz(t *testing.T) {
	router := NewRouter(fakePinger{}, newFakeSnippetStore(), testAdminAuthConfig, t.TempDir())
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

func TestAdminLoginSessionAndLogout(t *testing.T) {
	router := NewRouter(fakePinger{}, newFakeSnippetStore(), testAdminAuthConfig, t.TempDir())

	adminCookie := loginCookie(t, router)

	sessionReq := httptest.NewRequest(http.MethodGet, "/api/admin/session", nil)
	sessionReq.AddCookie(adminCookie)
	sessionRec := httptest.NewRecorder()
	router.ServeHTTP(sessionRec, sessionReq)
	if sessionRec.Code != http.StatusOK {
		t.Fatalf("expected session status 200, got %d", sessionRec.Code)
	}
	if !strings.Contains(sessionRec.Body.String(), "creator@justdoswift.com") {
		t.Fatalf("expected session body to include admin email, got %q", sessionRec.Body.String())
	}

	logoutReq := httptest.NewRequest(http.MethodPost, "/api/admin/logout", nil)
	logoutReq.AddCookie(adminCookie)
	logoutRec := httptest.NewRecorder()
	router.ServeHTTP(logoutRec, logoutReq)
	if logoutRec.Code != http.StatusNoContent {
		t.Fatalf("expected logout status 204, got %d", logoutRec.Code)
	}
}

func TestAdminUnauthorizedAndProtectedRoutes(t *testing.T) {
	now := time.Now().UTC()
	store := newFakeSnippetStore(domain.Snippet{
		ID:          "snippet-1",
		CoverImage:  "https://example.com/cover.jpg",
		Code:        "Text(\"Hello\")",
		Status:      domain.StatusDraft,
		UpdatedAt:   now,
		PublishedAt: nil,
		Locales: domain.SnippetLocales{
			EN: localizedFields("Admin Auth", "admin-auth", "Workflow"),
			ZH: localizedFields("后台鉴权", "hou-tai-jian-quan", "Workflow"),
		},
	})
	router := NewRouter(fakePinger{}, store, testAdminAuthConfig, t.TempDir())

	req := httptest.NewRequest(http.MethodPost, "/api/admin/login", strings.NewReader(`{"email":"creator@justdoswift.com","password":"wrong"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected invalid login status 401, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/admin/session", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected anonymous session status 401, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodPost, "/api/admin/snippets/snippet-1/publish", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected protected publish status 401, got %d", rec.Code)
	}

	adminCookie := loginCookie(t, router)

	protectedReq := httptest.NewRequest(http.MethodPost, "/api/admin/snippets/snippet-1/publish", nil)
	protectedReq.AddCookie(adminCookie)
	protectedRec := httptest.NewRecorder()
	router.ServeHTTP(protectedRec, protectedReq)
	if protectedRec.Code != http.StatusOK {
		t.Fatalf("expected protected publish status 200, got %d", protectedRec.Code)
	}

	invalidCookieReq := httptest.NewRequest(http.MethodGet, "/api/admin/session", nil)
	invalidCookieReq.AddCookie(&http.Cookie{Name: adminSessionCookieName, Value: "invalid"})
	invalidCookieRec := httptest.NewRecorder()
	router.ServeHTTP(invalidCookieRec, invalidCookieReq)
	if invalidCookieRec.Code != http.StatusUnauthorized {
		t.Fatalf("expected invalid cookie session status 401, got %d", invalidCookieRec.Code)
	}
}

func TestUploadCoverImageAndServeStatic(t *testing.T) {
	uploadDir := t.TempDir()
	router := NewRouter(fakePinger{}, newFakeSnippetStore(), testAdminAuthConfig, uploadDir)
	adminCookie := loginCookie(t, router)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	fileWriter, err := writer.CreateFormFile("file", "cover.png")
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	largeImage := image.NewNRGBA(image.Rect(0, 0, 3200, 1600))
	for y := 0; y < 1600; y++ {
		for x := 0; x < 3200; x++ {
			largeImage.Set(x, y, color.NRGBA{
				R: uint8(x % 255),
				G: uint8(y % 255),
				B: uint8((x + y) % 255),
				A: 255,
			})
		}
	}
	if err := png.Encode(fileWriter, largeImage); err != nil {
		t.Fatalf("encode png bytes: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/admin/uploads/cover", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.AddCookie(adminCookie)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected upload status 201, got %d", rec.Code)
	}

	var response map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&response); err != nil {
		t.Fatalf("decode upload response: %v", err)
	}

	uploadedURL := response["url"]
	if !strings.HasPrefix(uploadedURL, "/api/uploads/") || !strings.HasSuffix(uploadedURL, ".webp") {
		t.Fatalf("expected upload url to start with /api/uploads/, got %q", uploadedURL)
	}

	entries, err := os.ReadDir(uploadDir)
	if err != nil {
		t.Fatalf("read upload dir: %v", err)
	}
	if len(entries) != 1 {
		t.Fatalf("expected one uploaded file, got %d", len(entries))
	}

	staticReq := httptest.NewRequest(http.MethodGet, uploadedURL, nil)
	staticRec := httptest.NewRecorder()
	router.ServeHTTP(staticRec, staticReq)
	if staticRec.Code != http.StatusOK {
		t.Fatalf("expected static file status 200, got %d", staticRec.Code)
	}
	if !strings.HasPrefix(staticRec.Header().Get("Content-Type"), "image/webp") {
		t.Fatalf("expected static file content type image/webp, got %q", staticRec.Header().Get("Content-Type"))
	}

	decodedImage, _, err := image.Decode(bytes.NewReader(staticRec.Body.Bytes()))
	if err != nil {
		t.Fatalf("decode optimized image: %v", err)
	}
	if decodedImage.Bounds().Dx() != maxCoverImageDimension || decodedImage.Bounds().Dy() != 1100 {
		t.Fatalf("expected optimized image bounds %dx%d, got %dx%d", maxCoverImageDimension, 1100, decodedImage.Bounds().Dx(), decodedImage.Bounds().Dy())
	}
}

func TestUploadCoverImageRequiresAuthAndImage(t *testing.T) {
	router := NewRouter(fakePinger{}, newFakeSnippetStore(), testAdminAuthConfig, t.TempDir())

	req := httptest.NewRequest(http.MethodPost, "/api/admin/uploads/cover", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected anonymous upload status 401, got %d", rec.Code)
	}

	adminCookie := loginCookie(t, router)
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	fileWriter, err := writer.CreateFormFile("file", "cover.txt")
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	if _, err := io.WriteString(fileWriter, "not-an-image"); err != nil {
		t.Fatalf("write text bytes: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req = httptest.NewRequest(http.MethodPost, "/api/admin/uploads/cover", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.AddCookie(adminCookie)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid image upload status 400, got %d", rec.Code)
	}
}

func TestUploadCoverImageTooLarge(t *testing.T) {
	router := NewRouter(fakePinger{}, newFakeSnippetStore(), testAdminAuthConfig, t.TempDir())
	adminCookie := loginCookie(t, router)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	fileWriter, err := writer.CreateFormFile("file", "cover.png")
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}

	// Keep the content PNG-prefixed so the failure comes from size, not MIME sniffing.
	if _, err := fileWriter.Write([]byte{
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
	}); err != nil {
		t.Fatalf("write png signature: %v", err)
	}

	oversizedPayload := bytes.Repeat([]byte{0x00}, 26<<20)
	if _, err := fileWriter.Write(oversizedPayload); err != nil {
		t.Fatalf("write oversized payload: %v", err)
	}

	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/admin/uploads/cover", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.AddCookie(adminCookie)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected oversized upload status 413, got %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "25 MB or smaller") {
		t.Fatalf("expected oversized upload error message, got %q", rec.Body.String())
	}
}
