package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func NewRouter(pool dbPinger, snippets snippetStore, authConfig AdminAuthConfig, uploadsDir string) http.Handler {
	handler := &Handler{
		db:       pool,
		snippets: snippets,
		auth:     newAdminAuth(authConfig),
		uploads:  newLocalUploader(uploadsDir),
	}

	router := chi.NewRouter()
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.Timeout(15 * time.Second))

	router.Get("/healthz", handler.Healthz)
	router.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir(handler.uploads.dir))))

	router.Route("/api", func(r chi.Router) {
		r.Handle("/uploads/*", http.StripPrefix("/api/uploads/", http.FileServer(http.Dir(handler.uploads.dir))))
		r.Get("/snippets", handler.ListSnippets)
		r.Get("/snippets/{id}", handler.GetSnippet)
		r.Get("/snippets/slug/{slug}", handler.GetSnippetBySlug)
		r.Get("/articles", handler.ListSnippets)
		r.Get("/articles/{id}", handler.GetSnippet)
		r.Get("/articles/slug/{slug}", handler.GetSnippetBySlug)

		r.Route("/admin", func(admin chi.Router) {
			admin.Post("/login", handler.AdminLogin)
			admin.Post("/logout", handler.AdminLogout)
			admin.Get("/session", handler.AdminSession)

			admin.Group(func(protected chi.Router) {
				protected.Use(handler.requireAdminSession)
				protected.Post("/uploads/cover", handler.UploadCoverImage)
				protected.Post("/snippets", handler.CreateSnippet)
				protected.Put("/snippets/{id}", handler.UpdateSnippet)
				protected.Post("/snippets/{id}/publish", handler.PublishSnippet)
				protected.Post("/snippets/{id}/unpublish", handler.UnpublishSnippet)
				protected.Delete("/snippets/{id}", handler.DeleteSnippet)
				protected.Post("/articles", handler.CreateSnippet)
				protected.Put("/articles/{id}", handler.UpdateSnippet)
				protected.Post("/articles/{id}/publish", handler.PublishSnippet)
				protected.Post("/articles/{id}/unpublish", handler.UnpublishSnippet)
				protected.Delete("/articles/{id}", handler.DeleteSnippet)
			})
		})
	})

	return router
}
