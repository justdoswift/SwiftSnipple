package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/justdoswift/SwiftSnipple/apps/api/internal/config"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/discovery"
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

	for _, item := range response.Items {
		if item.ID == "review-only-meter" {
			t.Fatalf("unexpected not-public item in feed")
		}
	}
}

func TestDiscoverySearchReturnsRankedResults(t *testing.T) {
	server := NewServer(config.Load())
	req := httptest.NewRequest(http.MethodGet, "/api/v1/discovery/search?q=card", nil)
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

	if response.Items[0].ID != "stacked-hero-card" {
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

	if len(response.Items) != 1 || response.Items[0].ID != "stacked-hero-card" {
		t.Fatalf("expected stacked-hero-card only, got %+v", response.Items)
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
	req := httptest.NewRequest(http.MethodGet, "/api/v1/discovery/snippets/review-only-meter", nil)
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
