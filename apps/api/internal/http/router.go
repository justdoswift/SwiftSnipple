package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func NewRouter(pool dbPinger, snippets snippetStore) http.Handler {
	handler := &Handler{
		db:       pool,
		snippets: snippets,
	}

	router := chi.NewRouter()
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.Timeout(15 * time.Second))

	router.Get("/healthz", handler.Healthz)

	router.Route("/api", func(r chi.Router) {
		r.Get("/snippets", handler.ListSnippets)
		r.Get("/snippets/{id}", handler.GetSnippet)
		r.Get("/snippets/slug/{slug}", handler.GetSnippetBySlug)
		r.Get("/articles", handler.ListSnippets)
		r.Get("/articles/{id}", handler.GetSnippet)
		r.Get("/articles/slug/{slug}", handler.GetSnippetBySlug)

		r.Route("/admin", func(admin chi.Router) {
			admin.Post("/snippets", handler.CreateSnippet)
			admin.Put("/snippets/{id}", handler.UpdateSnippet)
			admin.Post("/snippets/{id}/publish", handler.PublishSnippet)
			admin.Post("/snippets/{id}/unpublish", handler.UnpublishSnippet)
			admin.Delete("/snippets/{id}", handler.DeleteSnippet)
			admin.Post("/articles", handler.CreateSnippet)
			admin.Put("/articles/{id}", handler.UpdateSnippet)
			admin.Post("/articles/{id}/publish", handler.PublishSnippet)
			admin.Post("/articles/{id}/unpublish", handler.UnpublishSnippet)
			admin.Delete("/articles/{id}", handler.DeleteSnippet)
		})
	})

	return router
}
