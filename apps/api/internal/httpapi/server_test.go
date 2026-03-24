package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/justdoswift/SwiftSnipple/apps/api/internal/config"
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
