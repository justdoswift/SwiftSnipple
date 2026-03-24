package httpapi

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/justdoswift/SwiftSnipple/apps/api/internal/config"
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

	// Future snippet APIs will attach under this prefix in later phases.
	mux.HandleFunc("/api/v1/snippets", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusNotImplemented, map[string]string{
			"message": "snippet APIs are not implemented in Phase 1",
		})
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
