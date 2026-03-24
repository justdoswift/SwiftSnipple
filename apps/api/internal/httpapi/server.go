package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/justdoswift/SwiftSnipple/apps/api/internal/cache"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/config"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/discovery"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/version"
)

type metadataResponse struct {
	Service      string `json:"service"`
	Version      string `json:"version"`
	Phase        string `json:"phase"`
	Environment  string `json:"environment"`
	DatabaseURL  string `json:"databaseUrl"`
	AIConfigured bool   `json:"aiConfigured"`
}

func NewServer(cfg config.Config) *http.Server {
	mux := http.NewServeMux()
	repo := discovery.NewRepository(cfg)
	service := discovery.NewService(repo, cache.NewMemory(), cfg.DiscoveryCacheTTL)

	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{
			"status":  "ok",
			"service": version.ServiceName,
		})
	})

	mux.HandleFunc("/meta", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, metadataResponse{
			Service:      version.ServiceName,
			Version:      version.Version,
			Phase:        version.Phase,
			Environment:  cfg.Environment,
			DatabaseURL:  cfg.DatabaseURL,
			AIConfigured: true,
		})
	})

	mux.HandleFunc("/api/v1/discovery/feed", func(w http.ResponseWriter, r *http.Request) {
		response, err := service.Feed(r.Context())
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"code":    "internal_error",
				"message": "无法加载内容流",
			})
			return
		}

		writeJSON(w, http.StatusOK, response)
	})

	mux.HandleFunc("/api/v1/discovery/search", func(w http.ResponseWriter, r *http.Request) {
		response, err := service.Search(r.Context(), parseSearchQuery(r))
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"code":    "internal_error",
				"message": "无法搜索内容",
			})
			return
		}

		writeJSON(w, http.StatusOK, response)
	})

	mux.HandleFunc("/api/v1/discovery/snippets/", func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/api/v1/discovery/snippets/")
		if id == "" {
			writeJSON(w, http.StatusNotFound, map[string]string{"code": "not_found"})
			return
		}

		response, err := service.Detail(r.Context(), id)
		if err != nil {
			var notPublicErr discovery.NotPublicError
			switch {
			case errors.As(err, &notPublicErr):
				writeJSON(w, http.StatusForbidden, map[string]string{
					"code":    "not_public",
					"message": "内容未公开",
				})
			case errors.Is(err, discovery.ErrNotFound):
				writeJSON(w, http.StatusNotFound, map[string]string{"code": "not_found"})
			default:
				writeJSON(w, http.StatusInternalServerError, map[string]string{
					"code":    "internal_error",
					"message": "无法加载内容详情",
				})
			}
			return
		}

		writeJSON(w, http.StatusOK, response)
	})

	return &http.Server{
		Addr:              cfg.Address,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func parseSearchQuery(r *http.Request) discovery.SearchQuery {
	query := discovery.SearchQuery{
		Q:          strings.TrimSpace(r.URL.Query().Get("q")),
		Category:   strings.TrimSpace(r.URL.Query().Get("category")),
		Difficulty: strings.TrimSpace(r.URL.Query().Get("difficulty")),
		Platform:   strings.TrimSpace(r.URL.Query().Get("platform")),
	}

	if raw := strings.TrimSpace(r.URL.Query().Get("hasDemo")); raw != "" {
		if value, err := strconv.ParseBool(raw); err == nil {
			query.HasDemo = &value
		}
	}

	if raw := strings.TrimSpace(r.URL.Query().Get("hasPrompt")); raw != "" {
		if value, err := strconv.ParseBool(raw); err == nil {
			query.HasPrompt = &value
		}
	}

	return query
}
