package ratelimit

import (
	"net/http"
	"sync"
	"time"
)

type responseWriter interface {
	WriteHeader(statusCode int)
	Header() http.Header
	Write([]byte) (int, error)
}

type keyFunc func(*http.Request) string

type entry struct {
	count   int
	resetAt time.Time
}

type Limiter struct {
	mu      sync.Mutex
	burst   int
	window  time.Duration
	now     func() time.Time
	entries map[string]entry
}

func New(burst int, window time.Duration) *Limiter {
	return &Limiter{
		burst:   burst,
		window:  window,
		now:     time.Now,
		entries: make(map[string]entry),
	}
}

func (l *Limiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := l.now()
	current, ok := l.entries[key]
	if !ok || now.After(current.resetAt) {
		l.entries[key] = entry{
			count:   1,
			resetAt: now.Add(l.window),
		}
		return true
	}

	if current.count >= l.burst {
		return false
	}

	current.count++
	l.entries[key] = current
	return true
}

func Middleware(limiter *Limiter, selectKey keyFunc, reject func(responseWriter)) func(http.HandlerFunc) http.HandlerFunc {
	if selectKey == nil {
		selectKey = func(r *http.Request) string {
			return r.RemoteAddr
		}
	}
	if reject == nil {
		reject = func(w responseWriter) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			_, _ = w.Write([]byte(`{"code":"rate_limited","message":"写入请求过于频繁"}`))
		}
	}

	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if !limiter.Allow(selectKey(r)) {
				reject(w)
				return
			}
			next(w, r)
		}
	}
}
