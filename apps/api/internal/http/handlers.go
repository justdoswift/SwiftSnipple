package http

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"io"
	"log"
	"math"
	"mime/multipart"
	"net/http"
	"net/mail"
	"path"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/skrashevich/go-webp"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/image/draw"
	"swiftsnipple/api/internal/domain"
	"swiftsnipple/api/internal/repo"

	_ "golang.org/x/image/webp"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
)

type dbPinger interface {
	Ping(ctx context.Context) error
}

type snippetStore interface {
	List(ctx context.Context) ([]domain.Snippet, error)
	GetByID(ctx context.Context, id string) (domain.Snippet, error)
	GetBySlug(ctx context.Context, slug string) (domain.Snippet, error)
	Create(ctx context.Context, payload domain.SnippetPayload) (domain.Snippet, error)
	Update(ctx context.Context, id string, payload domain.SnippetPayload) (domain.Snippet, error)
	Publish(ctx context.Context, id string) (domain.Snippet, error)
	Unpublish(ctx context.Context, id string) (domain.Snippet, error)
	Delete(ctx context.Context, id string) error
}

type memberStore interface {
	CreateUser(ctx context.Context, email, passwordHash string) (domain.MemberUser, error)
	GetUserByEmail(ctx context.Context, email string) (domain.MemberUser, error)
	GetUserByID(ctx context.Context, id string) (domain.MemberUser, error)
	GetSubscriptionByUserID(ctx context.Context, userID string) (*domain.MemberSubscription, error)
	GetSubscriptionByStripeCustomerID(ctx context.Context, customerID string) (*domain.MemberSubscription, error)
	GetSubscriptionByStripeSubscriptionID(ctx context.Context, subscriptionID string) (*domain.MemberSubscription, error)
	UpsertSubscription(ctx context.Context, subscription domain.MemberSubscription) (domain.MemberSubscription, error)
}

type Handler struct {
	db         dbPinger
	snippets   snippetStore
	members    memberStore
	auth       adminAuth
	memberAuth memberAuth
	assets     assetStore
	billing    billingProvider
}

const (
	maxCoverImageDimension = 2200
	coverImageWebPQuality  = 92
	maxCoverUploadBytes    = 25 << 20
	maxContentImageBytes   = 18 << 20
	maxContentVideoBytes   = 250 << 20
)

func (h *Handler) Healthz(w http.ResponseWriter, r *http.Request) {
	if err := h.db.Ping(r.Context()); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"status": "unhealthy"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) ListSnippets(w http.ResponseWriter, r *http.Request) {
	snippets, err := h.snippets.List(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list snippets"})
		return
	}

	viewer, err := h.resolveViewerAccess(r)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to resolve access"})
		return
	}

	publicSnippets := make([]domain.Snippet, 0, len(snippets))
	for _, snippet := range snippets {
		if snippet.Status != domain.StatusPublished {
			continue
		}

		publicSnippets = append(publicSnippets, publicSnippetResponse(snippet, viewer.canAccess(snippet), false))
	}

	writeJSON(w, http.StatusOK, publicSnippets)
}

func (h *Handler) GetSnippet(w http.ResponseWriter, r *http.Request) {
	snippet, err := h.snippets.GetByID(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to fetch snippet"})
		return
	}

	viewer, err := h.resolveViewerAccess(r)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to resolve access"})
		return
	}
	if snippet.Status != domain.StatusPublished && !viewer.IsAdminPreview {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
		return
	}

	writeJSON(w, http.StatusOK, publicSnippetResponse(snippet, viewer.canAccess(snippet), true))
}

func (h *Handler) GetSnippetBySlug(w http.ResponseWriter, r *http.Request) {
	snippet, err := h.snippets.GetBySlug(r.Context(), chi.URLParam(r, "slug"))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to fetch snippet"})
		return
	}

	viewer, err := h.resolveViewerAccess(r)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to resolve access"})
		return
	}
	if snippet.Status != domain.StatusPublished && !viewer.IsAdminPreview {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
		return
	}

	writeJSON(w, http.StatusOK, publicSnippetResponse(snippet, viewer.canAccess(snippet), true))
}

func (h *Handler) ListAdminSnippets(w http.ResponseWriter, r *http.Request) {
	snippets, err := h.snippets.List(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list snippets"})
		return
	}

	writeJSON(w, http.StatusOK, snippets)
}

func (h *Handler) GetAdminSnippet(w http.ResponseWriter, r *http.Request) {
	snippet, err := h.snippets.GetByID(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to fetch snippet"})
		return
	}

	writeJSON(w, http.StatusOK, snippet)
}

func (h *Handler) CreateSnippet(w http.ResponseWriter, r *http.Request) {
	payload, ok := decodeSnippetPayload(w, r)
	if !ok {
		return
	}

	snippet, err := h.snippets.Create(r.Context(), payload)
	if err != nil {
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, snippet)
}

func (h *Handler) UpdateSnippet(w http.ResponseWriter, r *http.Request) {
	payload, ok := decodeSnippetPayload(w, r)
	if !ok {
		return
	}

	snippet, err := h.snippets.Update(r.Context(), chi.URLParam(r, "id"), payload)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
			return
		}
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, snippet)
}

func (h *Handler) PublishSnippet(w http.ResponseWriter, r *http.Request) {
	snippet, err := h.snippets.Publish(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
			return
		}
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, snippet)
}

func (h *Handler) UnpublishSnippet(w http.ResponseWriter, r *http.Request) {
	snippet, err := h.snippets.Unpublish(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
			return
		}
		writeRepositoryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, snippet)
}

func (h *Handler) DeleteSnippet(w http.ResponseWriter, r *http.Request) {
	if err := h.snippets.Delete(r.Context(), chi.URLParam(r, "id")); err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "snippet not found"})
			return
		}
		writeRepositoryError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ServeUpload(w http.ResponseWriter, r *http.Request) {
	objectKey := strings.TrimSpace(chi.URLParam(r, "*"))
	if objectKey == "" {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "asset not found"})
		return
	}

	storedObject, err := h.assets.Get(r.Context(), objectKey)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "asset not found"})
		return
	}
	defer storedObject.Body.Close()

	if storedObject.ContentType != "" {
		w.Header().Set("Content-Type", storedObject.ContentType)
	}
	if storedObject.Size > 0 {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", storedObject.Size))
	}
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	if _, err := io.Copy(w, storedObject.Body); err != nil {
		log.Printf("stream uploaded asset: %v", err)
	}
}

func (h *Handler) UploadCoverImage(w http.ResponseWriter, r *http.Request) {
	file, _, ok := parseMultipartUpload(w, r, maxCoverUploadBytes, "cover image must be 25 MB or smaller", "cover image file is required")
	if !ok {
		return
	}
	defer file.Close()

	stored, err := h.storeCoverImage(r.Context(), file)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{
		"url":      stored.URL,
		"mimeType": stored.ContentType,
	})
}

func (h *Handler) UploadContentImage(w http.ResponseWriter, r *http.Request) {
	file, header, ok := parseMultipartUpload(w, r, maxContentImageBytes, "content image must be 18 MB or smaller", "image file is required")
	if !ok {
		return
	}
	defer file.Close()

	stored, err := h.storeContentImage(r.Context(), file, header)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{
		"url":      stored.URL,
		"mimeType": stored.ContentType,
	})
}

func (h *Handler) UploadContentVideo(w http.ResponseWriter, r *http.Request) {
	file, header, ok := parseMultipartUpload(w, r, maxContentVideoBytes, "content video must be 250 MB or smaller", "video file is required")
	if !ok {
		return
	}
	defer file.Close()

	stored, err := h.storeContentVideo(r.Context(), file, header)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{
		"url":      stored.URL,
		"mimeType": stored.ContentType,
	})
}

func (h *Handler) AdminLogin(w http.ResponseWriter, r *http.Request) {
	var payload adminLoginRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json payload"})
		return
	}

	if !h.auth.authenticate(payload.Email, payload.Password) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}

	now := time.Now().UTC()
	expiresAt := now.Add(adminSessionDuration)
	sessionPayload := adminSessionPayload{
		Email:     strings.ToLower(strings.TrimSpace(payload.Email)),
		IssuedAt:  now.Format(time.RFC3339),
		ExpiresAt: expiresAt.Format(time.RFC3339),
	}

	token, err := h.auth.signSession(sessionPayload)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create session"})
		return
	}

	http.SetCookie(w, h.auth.sessionCookie(token, expiresAt))
	writeJSON(w, http.StatusOK, sessionResponseFromPayload(sessionPayload))
}

func (h *Handler) AdminLogout(w http.ResponseWriter, r *http.Request) {
	clearAdminSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) AdminSession(w http.ResponseWriter, r *http.Request) {
	session, ok := h.readAdminSession(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	writeJSON(w, http.StatusOK, sessionResponseFromPayload(*session))
}

func (h *Handler) MemberSignup(w http.ResponseWriter, r *http.Request) {
	payload, ok := decodeMemberAuthRequest(w, r)
	if !ok {
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create account"})
		return
	}

	user, err := h.members.CreateUser(r.Context(), payload.Email, string(passwordHash))
	if err != nil {
		if errors.Is(err, repo.ErrDuplicateEmail) {
			writeJSON(w, http.StatusConflict, map[string]string{"error": "email already in use"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create account"})
		return
	}

	h.writeMemberSession(w, user, nil, http.StatusCreated)
}

func (h *Handler) MemberLogin(w http.ResponseWriter, r *http.Request) {
	payload, ok := decodeMemberAuthRequest(w, r)
	if !ok {
		return
	}

	user, err := h.members.GetUserByEmail(r.Context(), payload.Email)
	if err != nil {
		if errors.Is(err, repo.ErrMemberNotFound) {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to log in"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(payload.Password)); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}

	subscription, err := h.members.GetSubscriptionByUserID(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load session"})
		return
	}

	h.writeMemberSession(w, user, subscription, http.StatusOK)
}

func (h *Handler) MemberLogout(w http.ResponseWriter, r *http.Request) {
	clearMemberSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) MemberSession(w http.ResponseWriter, r *http.Request) {
	session, ok := h.readMemberSession(r)
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	user, err := h.members.GetUserByID(r.Context(), session.UserID)
	if err != nil {
		clearMemberSessionCookie(w)
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	subscription, err := h.members.GetSubscriptionByUserID(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load session"})
		return
	}

	writeJSON(w, http.StatusOK, memberSessionResponse(user, subscription))
}

func (h *Handler) CreateCheckoutSession(w http.ResponseWriter, r *http.Request) {
	session, ok := memberSessionFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	user, err := h.members.GetUserByID(r.Context(), session.UserID)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	subscription, err := h.members.GetSubscriptionByUserID(r.Context(), user.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load subscription"})
		return
	}
	if subscription != nil && domain.IsEntitledSubscription(subscription.Status, subscription.CurrentPeriodEnd, time.Now()) {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "subscription already active"})
		return
	}

	customerID := ""
	if subscription != nil {
		customerID = subscription.StripeCustomerID
	}

	url, err := h.billing.CreateCheckoutSession(r.Context(), CheckoutSessionParams{
		UserID:     user.ID,
		Email:      user.Email,
		CustomerID: customerID,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create checkout session"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"url": url})
}

func (h *Handler) CreateBillingPortalSession(w http.ResponseWriter, r *http.Request) {
	session, ok := memberSessionFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	subscription, err := h.members.GetSubscriptionByUserID(r.Context(), session.UserID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load subscription"})
		return
	}
	if subscription == nil || strings.TrimSpace(subscription.StripeCustomerID) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "no billing account found"})
		return
	}

	url, err := h.billing.CreateBillingPortalSession(r.Context(), subscription.StripeCustomerID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create billing portal session"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"url": url})
}

func (h *Handler) StripeWebhook(w http.ResponseWriter, r *http.Request) {
	payload, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid webhook payload"})
		return
	}

	event, err := h.billing.ParseWebhook(payload, r.Header.Get("Stripe-Signature"))
	if err != nil {
		log.Printf(
			"stripe webhook parse failed signature_present=%t payload_bytes=%d error=%v",
			strings.TrimSpace(r.Header.Get("Stripe-Signature")) != "",
			len(payload),
			err,
		)
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid webhook signature"})
		return
	}

	switch {
	case event.CheckoutCompleted != nil:
		log.Printf(
			"stripe webhook received type=%s subscription_id=%s customer_id=%s user_id=%s",
			event.Type,
			strings.TrimSpace(event.CheckoutCompleted.SubscriptionID),
			strings.TrimSpace(event.CheckoutCompleted.CustomerID),
			strings.TrimSpace(event.CheckoutCompleted.UserID),
		)
		err = h.applyCheckoutCompleted(r.Context(), *event.CheckoutCompleted)
	case event.SubscriptionState != nil:
		log.Printf(
			"stripe webhook received type=%s subscription_id=%s customer_id=%s user_id=%s status=%s",
			event.Type,
			strings.TrimSpace(event.SubscriptionState.SubscriptionID),
			strings.TrimSpace(event.SubscriptionState.CustomerID),
			strings.TrimSpace(event.SubscriptionState.UserID),
			strings.TrimSpace(event.SubscriptionState.Status),
		)
		err = h.applySubscriptionState(r.Context(), *event.SubscriptionState)
	}
	if err != nil {
		log.Printf("stripe webhook failed type=%s error=%v", event.Type, err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to process webhook"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"received": true})
}

func decodeSnippetPayload(w http.ResponseWriter, r *http.Request) (domain.SnippetPayload, bool) {
	var payload domain.SnippetPayload
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": describeDecodeError(err)})
		return domain.SnippetPayload{}, false
	}

	payload = payload.Normalize()
	enHasTitle := strings.TrimSpace(payload.Locales.EN.Title) != ""
	enHasSlug := strings.TrimSpace(payload.Locales.EN.Slug) != ""
	zhHasTitle := strings.TrimSpace(payload.Locales.ZH.Title) != ""
	zhHasSlug := strings.TrimSpace(payload.Locales.ZH.Slug) != ""

	if enHasTitle != enHasSlug || zhHasTitle != zhHasSlug {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "localized title and slug must be paired"})
		return domain.SnippetPayload{}, false
	}

	if !enHasTitle && !zhHasTitle {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "at least one localized title and slug are required"})
		return domain.SnippetPayload{}, false
	}
	if !domain.IsValidStatus(payload.Status) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid status"})
		return domain.SnippetPayload{}, false
	}

	return payload, true
}

func decodeMemberAuthRequest(w http.ResponseWriter, r *http.Request) (memberAuthRequest, bool) {
	var payload memberAuthRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json payload"})
		return memberAuthRequest{}, false
	}

	payload.Email = strings.ToLower(strings.TrimSpace(payload.Email))
	payload.Password = strings.TrimSpace(payload.Password)

	if !isValidEmail(payload.Email) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid email"})
		return memberAuthRequest{}, false
	}
	if len(payload.Password) < 6 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "password must be at least 6 characters"})
		return memberAuthRequest{}, false
	}

	return payload, true
}

func describeDecodeError(err error) string {
	message := strings.ToLower(err.Error())
	if strings.Contains(message, "publishedat") || strings.Contains(message, "time") {
		return "invalid publishedAt"
	}

	return "invalid json payload"
}

func writeRepositoryError(w http.ResponseWriter, err error) {
	if strings.Contains(strings.ToLower(err.Error()), "duplicate key") {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "slug already exists"})
		return
	}

	writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "request failed"})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

type viewerAccess struct {
	IsAdminPreview bool
	IsEntitled     bool
}

func (h *Handler) resolveViewerAccess(r *http.Request) (viewerAccess, error) {
	viewer := viewerAccess{
		IsAdminPreview: h.isAdminPreview(r),
	}

	session, ok := h.readMemberSession(r)
	if !ok {
		return viewer, nil
	}

	user, err := h.members.GetUserByID(r.Context(), session.UserID)
	if err != nil {
		if errors.Is(err, repo.ErrMemberNotFound) {
			return viewer, nil
		}
		return viewer, err
	}

	subscription, err := h.members.GetSubscriptionByUserID(r.Context(), user.ID)
	if err != nil {
		return viewer, err
	}

	viewer.IsEntitled = subscription != nil && domain.IsEntitledSubscription(subscription.Status, subscription.CurrentPeriodEnd, time.Now())
	return viewer, nil
}

func (v viewerAccess) canAccess(snippet domain.Snippet) bool {
	return v.IsAdminPreview || !snippet.RequiresSubscription || v.IsEntitled
}

func (h *Handler) isAdminPreview(r *http.Request) bool {
	if r.URL.Query().Get("preview") != "admin" {
		return false
	}

	_, ok := h.readAdminSession(r)
	return ok
}

func publicSnippetResponse(snippet domain.Snippet, canAccess bool, includeProtectedContent bool) domain.Snippet {
	response := snippet
	response.AvailableLocales = domain.AvailableLocalesFor(response.Locales)
	response.ViewerCanAccess = canAccess
	response.Locked = response.RequiresSubscription && !canAccess
	if response.Locked {
		response.AccessLevel = domain.AccessLevelTeaser
	} else {
		response.AccessLevel = domain.AccessLevelFull
	}

	if !includeProtectedContent || response.Locked {
		response.Code = ""
		response.Locales.EN.Content = ""
		response.Locales.EN.Prompts = ""
		response.Locales.ZH.Content = ""
		response.Locales.ZH.Prompts = ""
	}

	return response
}

func (h *Handler) writeMemberSession(w http.ResponseWriter, user domain.MemberUser, subscription *domain.MemberSubscription, status int) {
	now := time.Now().UTC()
	expiresAt := now.Add(memberSessionDuration)
	payload := memberSessionPayload{
		UserID:    user.ID,
		Email:     user.Email,
		IssuedAt:  now.Format(time.RFC3339),
		ExpiresAt: expiresAt.Format(time.RFC3339),
	}

	token, err := h.memberAuth.signSession(payload)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create session"})
		return
	}

	http.SetCookie(w, h.memberAuth.sessionCookie(token, expiresAt))
	writeJSON(w, status, memberSessionResponse(user, subscription))
}

func memberSessionResponse(user domain.MemberUser, subscription *domain.MemberSubscription) domain.MemberSession {
	response := domain.MemberSession{
		Email:              user.Email,
		IsAuthenticated:    true,
		SubscriptionStatus: domain.SubscriptionStatusInactive,
		IsEntitled:         false,
		CurrentPeriodEnd:   nil,
		CancelAtPeriodEnd:  false,
		HasBillingPortal:   false,
	}
	if subscription == nil {
		return response
	}

	response.SubscriptionStatus = subscription.Status
	response.IsEntitled = domain.IsEntitledSubscription(subscription.Status, subscription.CurrentPeriodEnd, time.Now())
	response.CurrentPeriodEnd = subscription.CurrentPeriodEnd
	response.CancelAtPeriodEnd = subscription.CancelAtPeriodEnd
	response.HasBillingPortal = strings.TrimSpace(subscription.StripeCustomerID) != ""
	return response
}

func (h *Handler) applyCheckoutCompleted(ctx context.Context, completed BillingCheckoutCompleted) error {
	if strings.TrimSpace(completed.UserID) == "" {
		return errors.New("checkout session missing user id")
	}
	if _, err := h.members.GetUserByID(ctx, completed.UserID); err != nil {
		return err
	}

	existing, err := h.members.GetSubscriptionByUserID(ctx, completed.UserID)
	if err != nil {
		return err
	}

	subscription := domain.MemberSubscription{
		UserID:               completed.UserID,
		Status:               domain.SubscriptionStatusInactive,
		StripeCustomerID:     completed.CustomerID,
		StripeSubscriptionID: completed.SubscriptionID,
		PriceID:              completed.PriceID,
	}
	if existing != nil {
		subscription = *existing
	}

	if strings.TrimSpace(completed.SubscriptionID) != "" {
		state, stateErr := h.billing.GetSubscriptionState(ctx, completed.SubscriptionID)
		if stateErr == nil {
			state.UserID = completed.UserID
			if state.CustomerID == "" {
				state.CustomerID = completed.CustomerID
			}
			if state.SubscriptionID == "" {
				state.SubscriptionID = completed.SubscriptionID
			}
			if state.PriceID == "" {
				state.PriceID = completed.PriceID
			}

			upserted, err := h.upsertResolvedSubscription(ctx, existing, state)
			if err != nil {
				return err
			}

			log.Printf(
				"stripe checkout synced type=checkout.session.completed subscription_id=%s customer_id=%s user_id=%s status=%s",
				upserted.StripeSubscriptionID,
				upserted.StripeCustomerID,
				upserted.UserID,
				upserted.Status,
			)
			return nil
		}

		log.Printf(
			"stripe checkout fetch failed type=checkout.session.completed subscription_id=%s customer_id=%s user_id=%s error=%v",
			strings.TrimSpace(completed.SubscriptionID),
			strings.TrimSpace(completed.CustomerID),
			strings.TrimSpace(completed.UserID),
			stateErr,
		)
	}

	subscription = mergeCheckoutFallbackSubscription(existing, completed)
	upserted, err := h.members.UpsertSubscription(ctx, subscription)
	if err != nil {
		return err
	}

	log.Printf(
		"stripe checkout synced via fallback type=checkout.session.completed subscription_id=%s customer_id=%s user_id=%s status=%s",
		upserted.StripeSubscriptionID,
		upserted.StripeCustomerID,
		upserted.UserID,
		upserted.Status,
	)
	return err
}

func (h *Handler) applySubscriptionState(ctx context.Context, state BillingSubscriptionState) error {
	var (
		existing *domain.MemberSubscription
		err      error
	)

	if state.SubscriptionID != "" {
		existing, err = h.members.GetSubscriptionByStripeSubscriptionID(ctx, state.SubscriptionID)
		if err != nil {
			return err
		}
	}
	if existing == nil && state.CustomerID != "" {
		existing, err = h.members.GetSubscriptionByStripeCustomerID(ctx, state.CustomerID)
		if err != nil {
			return err
		}
	}

	userID := strings.TrimSpace(state.UserID)
	if userID == "" && existing != nil {
		userID = existing.UserID
	}
	if userID == "" {
		log.Printf(
			"stripe subscription event ignored type=customer.subscription.* subscription_id=%s customer_id=%s reason=missing_user_id",
			strings.TrimSpace(state.SubscriptionID),
			strings.TrimSpace(state.CustomerID),
		)
		return nil
	}
	if _, err := h.members.GetUserByID(ctx, userID); err != nil {
		return err
	}

	state.UserID = userID
	upserted, err := h.upsertResolvedSubscription(ctx, existing, state)
	if err != nil {
		return err
	}

	log.Printf(
		"stripe subscription synced type=customer.subscription.* subscription_id=%s customer_id=%s user_id=%s status=%s",
		upserted.StripeSubscriptionID,
		upserted.StripeCustomerID,
		upserted.UserID,
		upserted.Status,
	)
	return nil
}

func (h *Handler) upsertResolvedSubscription(ctx context.Context, existing *domain.MemberSubscription, state BillingSubscriptionState) (domain.MemberSubscription, error) {
	subscription := domain.MemberSubscription{
		UserID:               state.UserID,
		StripeCustomerID:     state.CustomerID,
		StripeSubscriptionID: state.SubscriptionID,
		Status:               domain.NormalizeSubscriptionStatus(state.Status),
		CurrentPeriodEnd:     state.CurrentPeriodEnd,
		CancelAtPeriodEnd:    state.CancelAtPeriodEnd,
		PriceID:              state.PriceID,
	}
	if existing != nil {
		subscription = *existing
		subscription.UserID = state.UserID
		if state.CustomerID != "" {
			subscription.StripeCustomerID = state.CustomerID
		}
		if state.SubscriptionID != "" {
			subscription.StripeSubscriptionID = state.SubscriptionID
		}
		subscription.Status = domain.NormalizeSubscriptionStatus(state.Status)
		subscription.CurrentPeriodEnd = state.CurrentPeriodEnd
		subscription.CancelAtPeriodEnd = state.CancelAtPeriodEnd
		if state.PriceID != "" {
			subscription.PriceID = state.PriceID
		}
	}

	return h.members.UpsertSubscription(ctx, subscription)
}

func mergeCheckoutFallbackSubscription(existing *domain.MemberSubscription, completed BillingCheckoutCompleted) domain.MemberSubscription {
	subscription := domain.MemberSubscription{
		UserID:               completed.UserID,
		Status:               domain.SubscriptionStatusInactive,
		StripeCustomerID:     completed.CustomerID,
		StripeSubscriptionID: completed.SubscriptionID,
		PriceID:              completed.PriceID,
	}
	if existing == nil {
		return subscription
	}

	subscription = *existing
	subscription.UserID = completed.UserID
	if completed.CustomerID != "" {
		subscription.StripeCustomerID = completed.CustomerID
	}
	if completed.SubscriptionID != "" {
		subscription.StripeSubscriptionID = completed.SubscriptionID
	}
	if completed.PriceID != "" {
		subscription.PriceID = completed.PriceID
	}
	return subscription
}

func isValidEmail(value string) bool {
	if strings.TrimSpace(value) == "" {
		return false
	}

	_, err := mail.ParseAddress(value)
	return err == nil
}

func parseMultipartUpload(
	w http.ResponseWriter,
	r *http.Request,
	maxBytes int64,
	tooLargeMessage string,
	missingFileMessage string,
) (multipart.File, *multipart.FileHeader, bool) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
	if err := r.ParseMultipartForm(maxBytes); err != nil {
		var maxBytesError *http.MaxBytesError
		if errors.As(err, &maxBytesError) {
			writeJSON(w, http.StatusRequestEntityTooLarge, map[string]string{"error": tooLargeMessage})
			return nil, nil, false
		}

		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid multipart upload payload"})
		return nil, nil, false
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": missingFileMessage})
		return nil, nil, false
	}

	return file, header, true
}

func sniffContentType(file multipart.File) (string, error) {
	sniffBuffer := make([]byte, 512)
	bytesRead, err := file.Read(sniffBuffer)
	if err != nil && !errors.Is(err, io.EOF) {
		return "", errors.New("failed to read upload")
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", errors.New("failed to reset upload")
	}

	return strings.TrimSpace(http.DetectContentType(sniffBuffer[:bytesRead])), nil
}

func (h *Handler) storeCoverImage(ctx context.Context, file multipart.File) (storedAsset, error) {
	contentType, err := sniffContentType(file)
	if err != nil {
		return storedAsset{}, err
	}
	if !isAllowedCoverContentType(contentType) {
		return storedAsset{}, errors.New("cover image must be PNG, JPEG, WEBP, or GIF")
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return storedAsset{}, errors.New("failed to reset cover image")
	}

	decodedImage, _, err := image.Decode(file)
	if err != nil {
		return storedAsset{}, errors.New("failed to decode cover image")
	}

	optimizedImage := optimizeCoverImage(decodedImage)
	buffer := &bytes.Buffer{}
	if err := webp.Encode(buffer, optimizedImage, &webp.Options{
		Lossy:   true,
		Quality: float32(coverImageWebPQuality),
	}); err != nil {
		return storedAsset{}, errors.New("failed to compress cover image")
	}

	randomName, err := randomUploadName()
	if err != nil {
		return storedAsset{}, errors.New("failed to create upload name")
	}

	return h.assets.Put(ctx, path.Join("covers", randomName+".webp"), "image/webp", bytes.NewReader(buffer.Bytes()), int64(buffer.Len()))
}

func (h *Handler) storeContentImage(ctx context.Context, file multipart.File, header *multipart.FileHeader) (storedAsset, error) {
	contentType, err := sniffContentType(file)
	if err != nil {
		return storedAsset{}, err
	}
	contentType = normalizeUploadedContentType(contentType, header.Filename)
	if !isAllowedContentImageContentType(contentType) {
		return storedAsset{}, errors.New("content image must be PNG, JPEG, WEBP, GIF, SVG, or AVIF")
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return storedAsset{}, errors.New("failed to reset content image")
	}

	randomName, err := randomUploadName()
	if err != nil {
		return storedAsset{}, errors.New("failed to create upload name")
	}

	return h.assets.Put(
		ctx,
		path.Join("content-images", randomName+extensionForContentType(contentType, header.Filename)),
		contentType,
		file,
		header.Size,
	)
}

func (h *Handler) storeContentVideo(ctx context.Context, file multipart.File, header *multipart.FileHeader) (storedAsset, error) {
	contentType, err := sniffContentType(file)
	if err != nil {
		return storedAsset{}, err
	}
	contentType = normalizeUploadedContentType(contentType, header.Filename)
	if !isAllowedContentVideoContentType(contentType) {
		return storedAsset{}, errors.New("content video must be MP4, WEBM, or MOV")
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return storedAsset{}, errors.New("failed to reset content video")
	}

	randomName, err := randomUploadName()
	if err != nil {
		return storedAsset{}, errors.New("failed to create upload name")
	}

	return h.assets.Put(
		ctx,
		path.Join("content-videos", randomName+extensionForContentType(contentType, header.Filename)),
		contentType,
		file,
		header.Size,
	)
}

func isAllowedCoverContentType(contentType string) bool {
	switch contentType {
	case "image/png":
		return true
	case "image/jpeg":
		return true
	case "image/webp":
		return true
	case "image/gif":
		return true
	default:
		return false
	}
}

func isAllowedContentImageContentType(contentType string) bool {
	switch contentType {
	case "image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/avif":
		return true
	default:
		return false
	}
}

func isAllowedContentVideoContentType(contentType string) bool {
	switch contentType {
	case "video/mp4", "video/webm", "video/quicktime":
		return true
	default:
		return false
	}
}

func extensionForContentType(contentType, fileName string) string {
	switch contentType {
	case "image/png":
		return ".png"
	case "image/jpeg":
		return ".jpg"
	case "image/webp":
		return ".webp"
	case "image/gif":
		return ".gif"
	case "image/svg+xml":
		return ".svg"
	case "image/avif":
		return ".avif"
	case "video/mp4":
		return ".mp4"
	case "video/webm":
		return ".webm"
	case "video/quicktime":
		return ".mov"
	default:
		if extension := strings.TrimSpace(path.Ext(fileName)); extension != "" {
			return extension
		}
	}

	return ""
}

func normalizeUploadedContentType(contentType, fileName string) string {
	if strings.TrimSpace(contentType) != "" && contentType != "application/octet-stream" {
		return contentType
	}

	switch strings.ToLower(strings.TrimSpace(path.Ext(fileName))) {
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".webp":
		return "image/webp"
	case ".gif":
		return "image/gif"
	case ".svg":
		return "image/svg+xml"
	case ".avif":
		return "image/avif"
	case ".mp4":
		return "video/mp4"
	case ".webm":
		return "video/webm"
	case ".mov":
		return "video/quicktime"
	default:
		return strings.TrimSpace(contentType)
	}
}

func optimizeCoverImage(src image.Image) image.Image {
	bounds := src.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()
	if width <= 0 || height <= 0 {
		return src
	}

	if width <= maxCoverImageDimension && height <= maxCoverImageDimension {
		return cloneToNRGBA(src)
	}

	scale := math.Min(
		float64(maxCoverImageDimension)/float64(width),
		float64(maxCoverImageDimension)/float64(height),
	)
	targetWidth := max(1, int(math.Round(float64(width)*scale)))
	targetHeight := max(1, int(math.Round(float64(height)*scale)))

	destination := image.NewNRGBA(image.Rect(0, 0, targetWidth, targetHeight))
	draw.CatmullRom.Scale(destination, destination.Bounds(), src, bounds, draw.Over, nil)
	return destination
}

func cloneToNRGBA(src image.Image) image.Image {
	bounds := src.Bounds()
	destination := image.NewNRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	draw.Draw(destination, destination.Bounds(), src, bounds.Min, draw.Src)
	return destination
}

func randomUploadName() (string, error) {
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}

	return fmt.Sprintf("%x", randomBytes), nil
}
