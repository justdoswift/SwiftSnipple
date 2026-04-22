package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func NewRouter(
	pool dbPinger,
	snippets snippetStore,
	members memberStore,
	authConfig AdminAuthConfig,
	memberAuthConfig MemberAuthConfig,
	billing billingProvider,
	assets assetStore,
) http.Handler {
	handler := &Handler{
		db:         pool,
		snippets:   snippets,
		members:    members,
		auth:       newAdminAuth(authConfig),
		memberAuth: newMemberAuth(memberAuthConfig),
		assets:     assets,
		billing:    billing,
	}

	router := chi.NewRouter()
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.Timeout(15 * time.Second))

	router.Get("/healthz", handler.Healthz)
	router.Get("/uploads/*", handler.ServeUpload)

	router.Route("/api", func(r chi.Router) {
		r.Get("/uploads/*", handler.ServeUpload)
		r.Get("/snippets", handler.ListSnippets)
		r.Get("/snippets/{id}", handler.GetSnippet)
		r.Get("/snippets/slug/{slug}", handler.GetSnippetBySlug)
		r.Get("/articles", handler.ListSnippets)
		r.Get("/articles/{id}", handler.GetSnippet)
		r.Get("/articles/slug/{slug}", handler.GetSnippetBySlug)
		r.Post("/stripe/webhook", handler.StripeWebhook)

		r.Route("/member", func(member chi.Router) {
			member.Post("/stripe/webhook", handler.StripeWebhook)
			member.Post("/signup", handler.MemberSignup)
			member.Post("/login", handler.MemberLogin)
			member.Post("/logout", handler.MemberLogout)
			member.Get("/session", handler.MemberSession)

			member.Group(func(protected chi.Router) {
				protected.Use(handler.requireMemberSession)
				protected.Post("/checkout", handler.CreateCheckoutSession)
				protected.Post("/billing-portal", handler.CreateBillingPortalSession)
			})
		})

		r.Route("/admin", func(admin chi.Router) {
			admin.Post("/login", handler.AdminLogin)
			admin.Post("/logout", handler.AdminLogout)
			admin.Get("/session", handler.AdminSession)

			admin.Group(func(protected chi.Router) {
				protected.Use(handler.requireAdminSession)
				protected.Get("/members", handler.ListAdminMembers)
				protected.Get("/snippets", handler.ListAdminSnippets)
				protected.Get("/snippets/{id}", handler.GetAdminSnippet)
				protected.Post("/uploads/cover", handler.UploadCoverImage)
				protected.Post("/uploads/content-image", handler.UploadContentImage)
				protected.Post("/uploads/content-image-url", handler.UploadContentImageByURL)
				protected.Post("/uploads/content-video", handler.UploadContentVideo)
				protected.Post("/snippets", handler.CreateSnippet)
				protected.Put("/snippets/{id}", handler.UpdateSnippet)
				protected.Post("/snippets/{id}/publish", handler.PublishSnippet)
				protected.Post("/snippets/{id}/unpublish", handler.UnpublishSnippet)
				protected.Delete("/snippets/{id}", handler.DeleteSnippet)
				protected.Get("/articles", handler.ListAdminSnippets)
				protected.Get("/articles/{id}", handler.GetAdminSnippet)
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
