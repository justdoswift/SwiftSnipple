package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/justdoswift/SwiftSnipple/apps/api/internal/cache"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/config"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/discovery"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/publish"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/ratelimit"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/storage"
)

func TestHealthEndpoint(t *testing.T) {
	server := NewServer(config.Load())
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	resp := httptest.NewRecorder()

	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}
}

func TestDiscoveryFeedOmitsNotPublicItems(t *testing.T) {
	server := NewServer(config.Load())
	req := httptest.NewRequest(http.MethodGet, "/api/v1/discovery/feed", nil)
	resp := httptest.NewRecorder()

	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var response discovery.FeedResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if len(response.Items) != 12 {
		t.Fatalf("expected 12 published feed items, got %d", len(response.Items))
	}

	for _, item := range response.Items {
		if item.ID == "internal-draft-sample" {
			t.Fatalf("unexpected not-public item in feed")
		}
	}
}

func TestDiscoverySearchReturnsRankedResults(t *testing.T) {
	server := NewServer(config.Load())
	req := httptest.NewRequest(http.MethodGet, "/api/v1/discovery/search?q=按钮", nil)
	resp := httptest.NewRecorder()

	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var response discovery.SearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if len(response.Items) != 2 {
		t.Fatalf("expected 2 search results, got %d", len(response.Items))
	}

	if response.Items[0].ID != "like-button-bounce" {
		t.Fatalf("expected ranked result order, got %s first", response.Items[0].ID)
	}
}

func TestDiscoverySearchHasDemoFalseFilter(t *testing.T) {
	server := NewServer(config.Load())
	req := httptest.NewRequest(http.MethodGet, "/api/v1/discovery/search?hasDemo=false", nil)
	resp := httptest.NewRecorder()

	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var response discovery.SearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if len(response.Items) != 8 || response.Items[0].ID != "stacked-hero-card" {
		t.Fatalf("expected 8 no-demo results with stacked-hero-card first, got %+v", response.Items)
	}
}

func TestDiscoverySearchZeroResultFallbackLength(t *testing.T) {
	server := NewServer(config.Load())
	req := httptest.NewRequest(http.MethodGet, "/api/v1/discovery/search?q=zzz", nil)
	resp := httptest.NewRecorder()

	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var response discovery.SearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if len(response.Fallback) == 0 || len(response.Fallback) > 3 {
		t.Fatalf("expected fallback length between 1 and 3, got %d", len(response.Fallback))
	}
}

func TestDiscoveryDetailReturnsNotPublic(t *testing.T) {
	server := NewServer(config.Load())
	req := httptest.NewRequest(http.MethodGet, "/api/v1/discovery/snippets/internal-draft-sample", nil)
	resp := httptest.NewRecorder()

	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", resp.Code)
	}

	var payload map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if payload["code"] != "not_public" {
		t.Fatalf("expected not_public code, got %s", payload["code"])
	}
}

func TestDiscoveryDetailReturnsNotFound(t *testing.T) {
	server := NewServer(config.Load())
	req := httptest.NewRequest(http.MethodGet, "/api/v1/discovery/snippets/unknown-id", nil)
	resp := httptest.NewRecorder()

	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", resp.Code)
	}

	var payload map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if payload["code"] != "not_found" {
		t.Fatalf("expected not_found code, got %s", payload["code"])
	}
}

func TestUploadURLEndpointReturnsConstrainedPresignResponse(t *testing.T) {
	cfg := config.Load()
	presigner := storage.NewPresigner("https://uploads.example.test/direct", "secret", 10*time.Minute)
	server := newServerWithDeps(cfg, testServerDeps(t, presigner))

	req := authenticatedRequest(t, server, http.MethodPost, "/api/v1/media/upload-url", bytes.NewBufferString(`{
		"snippetID":"stacked-hero-card",
		"version":"1.0.0",
		"assetKind":"cover",
		"contentType":"image/png",
		"contentLength":2048
	}`))
	resp := httptest.NewRecorder()

	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var payload map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if payload["objectKey"] != "stacked-hero-card/1.0.0/cover" {
		t.Fatalf("unexpected object key: %v", payload["objectKey"])
	}
}

func TestUploadURLEndpointRejectsInvalidAssetKind(t *testing.T) {
	cfg := config.Load()
	presigner := storage.NewPresigner("https://uploads.example.test/direct", "secret", 10*time.Minute)
	server := newServerWithDeps(cfg, testServerDeps(t, presigner))

	req := authenticatedRequest(t, server, http.MethodPost, "/api/v1/media/upload-url", bytes.NewBufferString(`{
		"snippetID":"stacked-hero-card",
		"version":"1.0.0",
		"assetKind":"thumbnail",
		"contentType":"image/png",
		"contentLength":2048
	}`))
	resp := httptest.NewRecorder()

	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", resp.Code)
	}
}

func TestPublishReviewEndpointTransitionsSnippet(t *testing.T) {
	cfg := config.Load()
	server := newServerWithDeps(cfg, testServerDeps(t, storage.NewPresigner("https://uploads.example.test/direct", "secret", 10*time.Minute)))

	req := authenticatedRequest(t, server, http.MethodPost, "/api/v1/publish/snippets/stacked-hero-card/review", nil)
	resp := httptest.NewRecorder()

	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var payload map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if payload["state"] != "review" {
		t.Fatalf("expected review state, got %v", payload["state"])
	}
}

func TestPublishEndpointRequiresVersion(t *testing.T) {
	cfg := config.Load()
	server := newServerWithDeps(cfg, testServerDeps(t, storage.NewPresigner("https://uploads.example.test/direct", "secret", 10*time.Minute)))

	req := authenticatedRequest(t, server, http.MethodPost, "/api/v1/publish/snippets/review-only-meter/publish", bytes.NewBufferString(`{}`))
	resp := httptest.NewRecorder()

	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", resp.Code)
	}
}

func TestPublishEndpointReturnsValidationIssues(t *testing.T) {
	cfg := config.Load()
	server := newServerWithDeps(cfg, serverDeps{
		discoveryService:  discovery.NewService(discovery.NewRepository(cfg), cache.NewMemory(), cfg.DiscoveryCacheTTL),
		presigner:         storage.NewPresigner("https://uploads.example.test/direct", "secret", 10*time.Minute),
		publishRepository: publish.NewInMemoryRepository(),
		assetRepository:   publish.NewInMemoryRepository(),
		publishService:    publish.NewService(publish.NewInMemoryRepository()),
		validator: validatorStub{
			result: publish.ValidationResult{
				OK: false,
				Issues: []publish.ValidationIssue{
					{Code: "missing_cover_asset", Message: "发布版本缺少 cover 资产", Path: "assets.cover"},
				},
			},
		},
		uploadLimiterMiddleware:  func(next http.HandlerFunc) http.HandlerFunc { return next },
		publishLimiterMiddleware: func(next http.HandlerFunc) http.HandlerFunc { return next },
	})

	req := authenticatedRequest(t, server, http.MethodPost, "/api/v1/publish/snippets/review-only-meter/publish", bytes.NewBufferString(`{"version":"1.0.0"}`))
	resp := httptest.NewRecorder()
	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected status 422, got %d", resp.Code)
	}
}

func TestPublishEndpointReturnsArtifactMetadataOnSuccess(t *testing.T) {
	cfg := config.Load()
	repo := publish.NewInMemoryRepository()
	repo.States["review-only-meter"] = publish.StateRecord{SnippetID: "review-only-meter", State: "review"}

	server := newServerWithDeps(cfg, serverDeps{
		discoveryService:  discovery.NewService(discovery.NewRepository(cfg), cache.NewMemory(), cfg.DiscoveryCacheTTL),
		presigner:         storage.NewPresigner("https://uploads.example.test/direct", "secret", 10*time.Minute),
		publishRepository: repo,
		assetRepository:   repo,
		publishService:    publish.NewService(repo),
		validator: validatorStub{
			result: publish.ValidationResult{OK: true},
		},
		artifactCompiler: artifactCompilerStub{
			result: publish.ArtifactResult{
				SnippetsPath:        "/tmp/snippets.json",
				VisibilityPath:      "/tmp/visibility.json",
				SearchDocumentsPath: "/tmp/search-documents.json",
				UpdatedFiles:        []string{"/tmp/snippets.json", "/tmp/visibility.json", "/tmp/search-documents.json"},
			},
		},
		uploadLimiterMiddleware:  func(next http.HandlerFunc) http.HandlerFunc { return next },
		publishLimiterMiddleware: func(next http.HandlerFunc) http.HandlerFunc { return next },
	})

	req := authenticatedRequest(t, server, http.MethodPost, "/api/v1/publish/snippets/review-only-meter/publish", bytes.NewBufferString(`{"version":"1.0.0"}`))
	resp := httptest.NewRecorder()
	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.Code)
	}

	var payload map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	artifacts, ok := payload["artifacts"].(map[string]any)
	if !ok {
		t.Fatalf("expected artifacts object, got %#v", payload["artifacts"])
	}
	if artifacts["searchDocumentsPath"] != "/tmp/search-documents.json" {
		t.Fatalf("unexpected artifact metadata: %#v", artifacts)
	}
}

func TestPublishEndpointsAreRateLimited(t *testing.T) {
	cfg := config.Load()
	publishRepo := publish.NewInMemoryRepository()
	service := publish.NewService(publishRepo)
	limit := ratelimit.New(1, time.Minute)

	server := newServerWithDeps(cfg, serverDeps{
		discoveryService:        discovery.NewService(discovery.NewRepository(cfg), cache.NewMemory(), cfg.DiscoveryCacheTTL),
		presigner:               storage.NewPresigner("https://uploads.example.test/direct", "secret", 10*time.Minute),
		publishService:          service,
		uploadLimiterMiddleware: func(next http.HandlerFunc) http.HandlerFunc { return next },
		publishLimiterMiddleware: ratelimit.Middleware(limit, func(_ *http.Request) string {
			return "same-client"
		}, nil),
	})

	first := httptest.NewRecorder()
	server.Handler.ServeHTTP(first, authenticatedRequest(t, server, http.MethodPost, "/api/v1/publish/snippets/stacked-hero-card/review", nil))
	if first.Code != http.StatusOK {
		t.Fatalf("expected first request to pass, got %d", first.Code)
	}

	second := httptest.NewRecorder()
	server.Handler.ServeHTTP(second, authenticatedRequest(t, server, http.MethodPost, "/api/v1/publish/snippets/review-only-meter/review", nil))
	if second.Code != http.StatusTooManyRequests {
		t.Fatalf("expected second request to be rate limited, got %d", second.Code)
	}
}

func TestAdminSessionLoginAndSessionProbe(t *testing.T) {
	server := NewServer(config.Load())
	loginResp := httptest.NewRecorder()
	server.Handler.ServeHTTP(loginResp, httptest.NewRequest(http.MethodPost, "/api/v1/admin/session", bytes.NewBufferString(`{"password":"development-admin-password"}`)))
	if loginResp.Code != http.StatusOK {
		t.Fatalf("expected login status 200, got %d", loginResp.Code)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/session", nil)
	for _, cookie := range loginResp.Result().Cookies() {
		req.AddCookie(cookie)
	}
	resp := httptest.NewRecorder()
	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("expected session status 200, got %d", resp.Code)
	}
}

func TestAdminEndpointsRequireAuthentication(t *testing.T) {
	server := NewServer(config.Load())
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/snippets", nil)
	resp := httptest.NewRecorder()
	server.Handler.ServeHTTP(resp, req)

	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", resp.Code)
	}
}

func testServerDeps(t *testing.T, presigner interface {
	Presign(req storage.PresignRequest) (storage.PresignResponse, error)
}) serverDeps {
	t.Helper()

	cfg := config.Load()
	publishRepo := publish.NewInMemoryRepository()
	service := publish.NewService(publishRepo)

	return serverDeps{
		discoveryService:         discovery.NewService(discovery.NewRepository(cfg), cache.NewMemory(), cfg.DiscoveryCacheTTL),
		presigner:                presigner,
		publishRepository:        publishRepo,
		assetRepository:          publishRepo,
		publishService:           service,
		uploadLimiterMiddleware:  func(next http.HandlerFunc) http.HandlerFunc { return next },
		publishLimiterMiddleware: func(next http.HandlerFunc) http.HandlerFunc { return next },
	}
}

func authenticatedRequest(t *testing.T, server *http.Server, method string, path string, body *bytes.Buffer) *http.Request {
	t.Helper()

	loginResp := httptest.NewRecorder()
	loginReq := httptest.NewRequest(http.MethodPost, "/api/v1/admin/session", bytes.NewBufferString(`{"password":"development-admin-password"}`))
	server.Handler.ServeHTTP(loginResp, loginReq)
	if loginResp.Code != http.StatusOK {
		t.Fatalf("admin login failed with status %d", loginResp.Code)
	}

	var reader *bytes.Buffer
	if body == nil {
		reader = bytes.NewBuffer(nil)
	} else {
		reader = body
	}

	req := httptest.NewRequest(method, path, reader)
	for _, cookie := range loginResp.Result().Cookies() {
		req.AddCookie(cookie)
	}
	return req
}

type validatorStub struct {
	result publish.ValidationResult
	err    error
}

func (s validatorStub) ValidateReady(_ context.Context, _ string, _ string) (publish.ValidationResult, error) {
	return s.result, s.err
}

type artifactCompilerStub struct {
	result publish.ArtifactResult
	err    error
}

func (s artifactCompilerStub) Compile(_ context.Context, _ publish.SnippetRecord, _ publish.VersionRecord, _ []publish.AssetRecord, _ time.Time) (publish.ArtifactResult, error) {
	return s.result, s.err
}
