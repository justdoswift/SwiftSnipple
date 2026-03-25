package ratelimit

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestLimiterRejectsAfterBurst(t *testing.T) {
	limiter := New(2, time.Minute)
	limiter.now = func() time.Time {
		return time.Date(2026, time.March, 25, 12, 0, 0, 0, time.UTC)
	}

	if !limiter.Allow("writer:127.0.0.1") {
		t.Fatalf("expected first request to pass")
	}
	if !limiter.Allow("writer:127.0.0.1") {
		t.Fatalf("expected second request to pass")
	}
	if limiter.Allow("writer:127.0.0.1") {
		t.Fatalf("expected third request to be rejected")
	}
}

func TestMiddlewareReturnsRateLimitedResponse(t *testing.T) {
	limiter := New(1, time.Minute)
	handler := Middleware(limiter, func(_ *http.Request) string { return "same-client" }, nil)(
		func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusOK)
		},
	)

	first := httptest.NewRecorder()
	handler.ServeHTTP(first, httptest.NewRequest(http.MethodPost, "/api/v1/media/upload-url", nil))
	if first.Code != http.StatusOK {
		t.Fatalf("expected first request to pass, got %d", first.Code)
	}

	second := httptest.NewRecorder()
	handler.ServeHTTP(second, httptest.NewRequest(http.MethodPost, "/api/v1/media/upload-url", nil))
	if second.Code != http.StatusTooManyRequests {
		t.Fatalf("expected second request to be rate limited, got %d", second.Code)
	}
}
