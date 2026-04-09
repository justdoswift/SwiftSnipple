package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func NewRouter(pool dbPinger, articles articleStore) http.Handler {
	handler := &Handler{
		db:       pool,
		articles: articles,
	}

	router := chi.NewRouter()
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.Timeout(15 * time.Second))

	router.Get("/healthz", handler.Healthz)

	router.Route("/api", func(r chi.Router) {
		r.Get("/articles", handler.ListArticles)
		r.Get("/articles/{id}", handler.GetArticle)
		r.Get("/articles/slug/{slug}", handler.GetArticleBySlug)

		r.Route("/admin", func(admin chi.Router) {
			admin.Post("/articles", handler.CreateArticle)
			admin.Put("/articles/{id}", handler.UpdateArticle)
			admin.Post("/articles/{id}/publish", handler.PublishArticle)
			admin.Post("/articles/{id}/unpublish", handler.UnpublishArticle)
			admin.Delete("/articles/{id}", handler.DeleteArticle)
		})
	})

	return router
}
