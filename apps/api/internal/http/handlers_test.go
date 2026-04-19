package http

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"swiftsnipple/api/internal/domain"
	"swiftsnipple/api/internal/repo"

	_ "golang.org/x/image/webp"
)

var testAdminAuthConfig = AdminAuthConfig{
	Email:         "creator@justdoswift.com",
	Password:      "secret12",
	SessionSecret: "test-admin-session-secret",
}

var testMemberAuthConfig = MemberAuthConfig{
	SessionSecret: "test-member-session-secret",
}

type fakePinger struct {
	err error
}

func (f fakePinger) Ping(context.Context) error {
	return f.err
}

type fakeSnippetStore struct {
	snippets       map[string]domain.Snippet
	snippetsBySlug map[string]string
	duplicateSlug  string
}

func newFakeSnippetStore(items ...domain.Snippet) *fakeSnippetStore {
	store := &fakeSnippetStore{
		snippets:       map[string]domain.Snippet{},
		snippetsBySlug: map[string]string{},
	}

	for _, snippet := range items {
		store.storeSnippet(snippet)
	}

	return store
}

func (f *fakeSnippetStore) storeSnippet(snippet domain.Snippet) {
	f.snippets[snippet.ID] = snippet
	f.snippetsBySlug[snippet.Locales.EN.Slug] = snippet.ID
	f.snippetsBySlug[snippet.Locales.ZH.Slug] = snippet.ID
}

func (f *fakeSnippetStore) removeSnippet(snippet domain.Snippet) {
	delete(f.snippetsBySlug, snippet.Locales.EN.Slug)
	delete(f.snippetsBySlug, snippet.Locales.ZH.Slug)
	delete(f.snippets, snippet.ID)
}

func (f *fakeSnippetStore) List(context.Context) ([]domain.Snippet, error) {
	snippets := make([]domain.Snippet, 0, len(f.snippets))
	for _, snippet := range f.snippets {
		snippets = append(snippets, snippet)
	}
	return snippets, nil
}

func (f *fakeSnippetStore) GetByID(_ context.Context, id string) (domain.Snippet, error) {
	snippet, ok := f.snippets[id]
	if !ok {
		return domain.Snippet{}, repo.ErrNotFound
	}
	return snippet, nil
}

func (f *fakeSnippetStore) GetBySlug(_ context.Context, slug string) (domain.Snippet, error) {
	id, ok := f.snippetsBySlug[slug]
	if !ok {
		return domain.Snippet{}, repo.ErrNotFound
	}
	return f.snippets[id], nil
}

func (f *fakeSnippetStore) Create(_ context.Context, payload domain.SnippetPayload) (domain.Snippet, error) {
	normalized := payload.Normalize()
	if normalized.Locales.EN.Slug == f.duplicateSlug || normalized.Locales.ZH.Slug == f.duplicateSlug {
		return domain.Snippet{}, errors.New("duplicate key value violates unique constraint")
	}

	snippet := domain.Snippet{
		ID:                   "new-id",
		CoverImage:           normalized.CoverImage,
		Code:                 normalized.Code,
		Status:               normalized.Status,
		UpdatedAt:            time.Now().UTC(),
		PublishedAt:          normalized.PublishedAt,
		RequiresSubscription: normalized.RequiresSubscription,
		Locales:              normalized.Locales,
	}

	f.storeSnippet(snippet)
	return snippet, nil
}

func (f *fakeSnippetStore) Update(_ context.Context, id string, payload domain.SnippetPayload) (domain.Snippet, error) {
	snippet, ok := f.snippets[id]
	if !ok {
		return domain.Snippet{}, repo.ErrNotFound
	}

	normalized := payload.Normalize()
	if (normalized.Locales.EN.Slug == f.duplicateSlug && normalized.Locales.EN.Slug != snippet.Locales.EN.Slug) ||
		(normalized.Locales.ZH.Slug == f.duplicateSlug && normalized.Locales.ZH.Slug != snippet.Locales.ZH.Slug) {
		return domain.Snippet{}, errors.New("duplicate key value violates unique constraint")
	}

	f.removeSnippet(snippet)

	snippet.CoverImage = normalized.CoverImage
	snippet.Code = normalized.Code
	snippet.Status = normalized.Status
	snippet.PublishedAt = normalized.PublishedAt
	snippet.RequiresSubscription = normalized.RequiresSubscription
	snippet.UpdatedAt = time.Now().UTC()
	snippet.Locales = normalized.Locales

	f.storeSnippet(snippet)
	return snippet, nil
}

func (f *fakeSnippetStore) Publish(_ context.Context, id string) (domain.Snippet, error) {
	snippet, ok := f.snippets[id]
	if !ok {
		return domain.Snippet{}, repo.ErrNotFound
	}
	now := time.Now().UTC()
	snippet.Status = domain.StatusPublished
	snippet.PublishedAt = &now
	f.storeSnippet(snippet)
	return snippet, nil
}

func (f *fakeSnippetStore) Unpublish(_ context.Context, id string) (domain.Snippet, error) {
	snippet, ok := f.snippets[id]
	if !ok {
		return domain.Snippet{}, repo.ErrNotFound
	}
	snippet.Status = domain.StatusDraft
	snippet.PublishedAt = nil
	f.storeSnippet(snippet)
	return snippet, nil
}

func (f *fakeSnippetStore) Delete(_ context.Context, id string) error {
	snippet, ok := f.snippets[id]
	if !ok {
		return repo.ErrNotFound
	}
	f.removeSnippet(snippet)
	return nil
}

func localizedFields(title, slug, category string) domain.SnippetLocalizedFields {
	return domain.SnippetLocalizedFields{
		Title:          title,
		Slug:           slug,
		Excerpt:        title + " excerpt",
		Category:       category,
		Tags:           []string{"SwiftUI"},
		Content:        "# " + title,
		Prompts:        "Build " + title,
		SEOTitle:       title,
		SEODescription: title + " SEO",
	}
}

func snippetPayloadJSON(t *testing.T, payload domain.SnippetPayload) string {
	t.Helper()

	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}

	return string(body)
}

func loginCookie(t *testing.T, router http.Handler) *http.Cookie {
	t.Helper()

	req := httptest.NewRequest(
		http.MethodPost,
		"/api/admin/login",
		strings.NewReader(`{"email":"creator@justdoswift.com","password":"secret12"}`),
	)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected login status 200, got %d", rec.Code)
	}

	cookies := rec.Result().Cookies()
	if len(cookies) == 0 {
		t.Fatal("expected login to set a session cookie")
	}

	return cookies[0]
}

func memberSignupCookie(t *testing.T, router http.Handler, email, password string) *http.Cookie {
	t.Helper()

	req := httptest.NewRequest(
		http.MethodPost,
		"/api/member/signup",
		strings.NewReader(fmt.Sprintf(`{"email":%q,"password":%q}`, email, password)),
	)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected signup status 201, got %d with body %q", rec.Code, rec.Body.String())
	}

	cookies := rec.Result().Cookies()
	if len(cookies) == 0 {
		t.Fatal("expected signup to set a member session cookie")
	}

	return cookies[0]
}

func memberLoginCookie(t *testing.T, router http.Handler, email, password string) *http.Cookie {
	t.Helper()

	req := httptest.NewRequest(
		http.MethodPost,
		"/api/member/login",
		strings.NewReader(fmt.Sprintf(`{"email":%q,"password":%q}`, email, password)),
	)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected member login status 200, got %d with body %q", rec.Code, rec.Body.String())
	}

	cookies := rec.Result().Cookies()
	if len(cookies) == 0 {
		t.Fatal("expected login to set a member session cookie")
	}

	return cookies[0]
}

func decodeResponse[T any](t *testing.T, reader io.Reader) T {
	t.Helper()

	var value T
	if err := json.NewDecoder(reader).Decode(&value); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	return value
}

type fakeMemberStore struct {
	users            map[string]domain.MemberUser
	userIDsByEmail   map[string]string
	subscriptions    map[string]domain.MemberSubscription
}

func newFakeMemberStore(users ...domain.MemberUser) *fakeMemberStore {
	store := &fakeMemberStore{
		users:          map[string]domain.MemberUser{},
		userIDsByEmail: map[string]string{},
		subscriptions:  map[string]domain.MemberSubscription{},
	}

	for _, user := range users {
		store.users[user.ID] = user
		store.userIDsByEmail[user.Email] = user.ID
	}

	return store
}

func (f *fakeMemberStore) CreateUser(_ context.Context, email, passwordHash string) (domain.MemberUser, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if _, exists := f.userIDsByEmail[email]; exists {
		return domain.MemberUser{}, repo.ErrDuplicateEmail
	}

	user := domain.MemberUser{
		ID:           fmt.Sprintf("member-%d", len(f.users)+1),
		Email:        email,
		PasswordHash: passwordHash,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}
	f.users[user.ID] = user
	f.userIDsByEmail[user.Email] = user.ID
	return user, nil
}

func (f *fakeMemberStore) GetUserByEmail(_ context.Context, email string) (domain.MemberUser, error) {
	id, ok := f.userIDsByEmail[strings.ToLower(strings.TrimSpace(email))]
	if !ok {
		return domain.MemberUser{}, repo.ErrMemberNotFound
	}

	return f.users[id], nil
}

func (f *fakeMemberStore) GetUserByID(_ context.Context, id string) (domain.MemberUser, error) {
	user, ok := f.users[id]
	if !ok {
		return domain.MemberUser{}, repo.ErrMemberNotFound
	}

	return user, nil
}

func (f *fakeMemberStore) GetSubscriptionByUserID(_ context.Context, userID string) (*domain.MemberSubscription, error) {
	subscription, ok := f.subscriptions[userID]
	if !ok {
		return nil, nil
	}

	copy := subscription
	return &copy, nil
}

func (f *fakeMemberStore) GetSubscriptionByStripeCustomerID(_ context.Context, customerID string) (*domain.MemberSubscription, error) {
	for _, subscription := range f.subscriptions {
		if subscription.StripeCustomerID == customerID {
			copy := subscription
			return &copy, nil
		}
	}

	return nil, nil
}

func (f *fakeMemberStore) GetSubscriptionByStripeSubscriptionID(_ context.Context, subscriptionID string) (*domain.MemberSubscription, error) {
	for _, subscription := range f.subscriptions {
		if subscription.StripeSubscriptionID == subscriptionID {
			copy := subscription
			return &copy, nil
		}
	}

	return nil, nil
}

func (f *fakeMemberStore) UpsertSubscription(_ context.Context, subscription domain.MemberSubscription) (domain.MemberSubscription, error) {
	if subscription.Status == "" {
		subscription.Status = domain.SubscriptionStatusInactive
	}
	if subscription.CreatedAt.IsZero() {
		subscription.CreatedAt = time.Now().UTC()
	}
	subscription.UpdatedAt = time.Now().UTC()
	f.subscriptions[subscription.UserID] = subscription
	return subscription, nil
}

type fakeBillingProvider struct {
	checkoutURL        string
	portalURL          string
	lastCheckoutParams CheckoutSessionParams
	lastPortalCustomer string
	webhookEvent       BillingWebhookEvent
	webhookErr         error
}

func (f *fakeBillingProvider) CreateCheckoutSession(_ context.Context, params CheckoutSessionParams) (string, error) {
	f.lastCheckoutParams = params
	return f.checkoutURL, nil
}

func (f *fakeBillingProvider) CreateBillingPortalSession(_ context.Context, customerID string) (string, error) {
	f.lastPortalCustomer = customerID
	return f.portalURL, nil
}

func (f *fakeBillingProvider) ParseWebhook(_ []byte, _ string) (BillingWebhookEvent, error) {
	if f.webhookErr != nil {
		return BillingWebhookEvent{}, f.webhookErr
	}
	return f.webhookEvent, nil
}

func newTestRouter(t *testing.T, snippets *fakeSnippetStore, members *fakeMemberStore, billing *fakeBillingProvider) http.Handler {
	t.Helper()

	if snippets == nil {
		snippets = newFakeSnippetStore()
	}
	if members == nil {
		members = newFakeMemberStore()
	}
	if billing == nil {
		billing = &fakeBillingProvider{
			checkoutURL: "https://stripe.test/checkout",
			portalURL:   "https://stripe.test/portal",
		}
	}

	return NewRouter(
		fakePinger{},
		snippets,
		members,
		testAdminAuthConfig,
		testMemberAuthConfig,
		billing,
		t.TempDir(),
	)
}

func TestSnippetRoutesSuccess(t *testing.T) {
	now := time.Now().UTC()
	store := newFakeSnippetStore(domain.Snippet{
		ID:          "snippet-1",
		CoverImage:  "https://example.com/cover.jpg",
		Code:        "Text(\"Hello\")",
		Status:      domain.StatusPublished,
		UpdatedAt:   now,
		PublishedAt: &now,
		Locales: domain.SnippetLocales{
			EN: localizedFields("Glass Drawer Navigation", "glass-drawer-navigation", "Navigation"),
			ZH: localizedFields("玻璃抽屉导航", "bo-li-chou-ti-dao-hang", "Navigation"),
		},
	})
	router := newTestRouter(t, store, nil, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/snippets", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected list status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/snippets/snippet-1", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected get-by-id status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/snippets/slug/glass-drawer-navigation", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected get-by-slug EN status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/snippets/slug/bo-li-chou-ti-dao-hang", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected get-by-slug ZH status 200, got %d", rec.Code)
	}
}

func TestCreateValidationAndDuplicateErrors(t *testing.T) {
	store := newFakeSnippetStore()
	store.duplicateSlug = "taken-slug"
	router := newTestRouter(t, store, nil, nil)
	adminCookie := loginCookie(t, router)

	testCases := []struct {
		name       string
		payload    domain.SnippetPayload
		statusCode int
		errorText  string
	}{
		{
			name: "empty localized title",
			payload: domain.SnippetPayload{
				Status: domain.StatusDraft,
				Locales: domain.SnippetLocales{
					EN: localizedFields("", "valid-slug", "Workflow"),
					ZH: localizedFields("标题", "valid-zh-slug", "Workflow"),
				},
			},
			statusCode: http.StatusBadRequest,
			errorText:  "localized title and slug are required",
		},
		{
			name: "invalid status",
			payload: domain.SnippetPayload{
				Status: "Archived",
				Locales: domain.SnippetLocales{
					EN: localizedFields("A", "valid-slug", "Workflow"),
					ZH: localizedFields("A 中文", "valid-zh-slug", "Workflow"),
				},
			},
			statusCode: http.StatusBadRequest,
			errorText:  "invalid status",
		},
		{
			name: "duplicate slug",
			payload: domain.SnippetPayload{
				Status: domain.StatusDraft,
				Locales: domain.SnippetLocales{
					EN: localizedFields("A", "taken-slug", "Workflow"),
					ZH: localizedFields("A 中文", "zh-slug", "Workflow"),
				},
			},
			statusCode: http.StatusBadRequest,
			errorText:  "slug already exists",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/admin/snippets", strings.NewReader(snippetPayloadJSON(t, tc.payload)))
			req.Header.Set("Content-Type", "application/json")
			req.AddCookie(adminCookie)
			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, req)

			if rec.Code != tc.statusCode {
				t.Fatalf("expected status %d, got %d", tc.statusCode, rec.Code)
			}
			if !strings.Contains(rec.Body.String(), tc.errorText) {
				t.Fatalf("expected response to contain %q, got %q", tc.errorText, rec.Body.String())
			}
		})
	}

	req := httptest.NewRequest(
		http.MethodPost,
		"/api/admin/snippets",
		strings.NewReader(`{"status":"Draft","publishedAt":"tomorrowish","locales":{"en":{"title":"A","slug":"valid-slug"},"zh":{"title":"中文","slug":"valid-zh-slug"}}}`),
	)
	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(adminCookie)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected malformed publishedAt status 400, got %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "invalid publishedAt") {
		t.Fatalf("expected publishedAt validation error, got %q", rec.Body.String())
	}
}

func TestPublishUnpublishDeleteAndMissingRoutes(t *testing.T) {
	now := time.Now().UTC()
	store := newFakeSnippetStore(domain.Snippet{
		ID:          "snippet-1",
		CoverImage:  "https://example.com/cover.jpg",
		Code:        "Text(\"Hello\")",
		Status:      domain.StatusDraft,
		UpdatedAt:   now,
		PublishedAt: &now,
		Locales: domain.SnippetLocales{
			EN: localizedFields("Prompt Driven Layout", "prompt-driven-layout", "Workflow"),
			ZH: localizedFields("提示驱动布局", "ti-shi-qu-dong-bu-ju", "Workflow"),
		},
	})
	router := newTestRouter(t, store, nil, nil)
	adminCookie := loginCookie(t, router)

	req := httptest.NewRequest(http.MethodPost, "/api/admin/snippets/snippet-1/publish", nil)
	req.AddCookie(adminCookie)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected publish status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodPost, "/api/admin/snippets/snippet-1/unpublish", nil)
	req.AddCookie(adminCookie)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected unpublish status 200, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodDelete, "/api/admin/snippets/snippet-1", nil)
	req.AddCookie(adminCookie)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected delete status 204, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/snippets/snippet-1", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected missing get status 404, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodDelete, "/api/admin/snippets/missing", nil)
	req.AddCookie(adminCookie)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected missing delete status 404, got %d", rec.Code)
	}
}

func TestHealthz(t *testing.T) {
	router := newTestRouter(t, newFakeSnippetStore(), nil, nil)
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected healthz status 200, got %d", rec.Code)
	}

	var body map[string]string
	if err := json.NewDecoder(bytes.NewReader(rec.Body.Bytes())).Decode(&body); err != nil {
		t.Fatalf("decode healthz body: %v", err)
	}
	if body["status"] != "ok" {
		t.Fatalf("expected status ok, got %#v", body)
	}
}

func TestAdminLoginSessionAndLogout(t *testing.T) {
	router := newTestRouter(t, newFakeSnippetStore(), nil, nil)

	adminCookie := loginCookie(t, router)

	sessionReq := httptest.NewRequest(http.MethodGet, "/api/admin/session", nil)
	sessionReq.AddCookie(adminCookie)
	sessionRec := httptest.NewRecorder()
	router.ServeHTTP(sessionRec, sessionReq)
	if sessionRec.Code != http.StatusOK {
		t.Fatalf("expected session status 200, got %d", sessionRec.Code)
	}
	if !strings.Contains(sessionRec.Body.String(), "creator@justdoswift.com") {
		t.Fatalf("expected session body to include admin email, got %q", sessionRec.Body.String())
	}

	logoutReq := httptest.NewRequest(http.MethodPost, "/api/admin/logout", nil)
	logoutReq.AddCookie(adminCookie)
	logoutRec := httptest.NewRecorder()
	router.ServeHTTP(logoutRec, logoutReq)
	if logoutRec.Code != http.StatusNoContent {
		t.Fatalf("expected logout status 204, got %d", logoutRec.Code)
	}
}

func TestAdminUnauthorizedAndProtectedRoutes(t *testing.T) {
	now := time.Now().UTC()
	store := newFakeSnippetStore(domain.Snippet{
		ID:          "snippet-1",
		CoverImage:  "https://example.com/cover.jpg",
		Code:        "Text(\"Hello\")",
		Status:      domain.StatusDraft,
		UpdatedAt:   now,
		PublishedAt: nil,
		Locales: domain.SnippetLocales{
			EN: localizedFields("Admin Auth", "admin-auth", "Workflow"),
			ZH: localizedFields("后台鉴权", "hou-tai-jian-quan", "Workflow"),
		},
	})
	router := newTestRouter(t, store, nil, nil)

	req := httptest.NewRequest(http.MethodPost, "/api/admin/login", strings.NewReader(`{"email":"creator@justdoswift.com","password":"wrong"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected invalid login status 401, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/api/admin/session", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected anonymous session status 401, got %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodPost, "/api/admin/snippets/snippet-1/publish", nil)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected protected publish status 401, got %d", rec.Code)
	}

	adminCookie := loginCookie(t, router)

	protectedReq := httptest.NewRequest(http.MethodPost, "/api/admin/snippets/snippet-1/publish", nil)
	protectedReq.AddCookie(adminCookie)
	protectedRec := httptest.NewRecorder()
	router.ServeHTTP(protectedRec, protectedReq)
	if protectedRec.Code != http.StatusOK {
		t.Fatalf("expected protected publish status 200, got %d", protectedRec.Code)
	}

	invalidCookieReq := httptest.NewRequest(http.MethodGet, "/api/admin/session", nil)
	invalidCookieReq.AddCookie(&http.Cookie{Name: adminSessionCookieName, Value: "invalid"})
	invalidCookieRec := httptest.NewRecorder()
	router.ServeHTTP(invalidCookieRec, invalidCookieReq)
	if invalidCookieRec.Code != http.StatusUnauthorized {
		t.Fatalf("expected invalid cookie session status 401, got %d", invalidCookieRec.Code)
	}
}

func TestMemberSignupLoginSessionAndLogout(t *testing.T) {
	members := newFakeMemberStore()
	router := newTestRouter(t, nil, members, nil)

	signupReq := httptest.NewRequest(
		http.MethodPost,
		"/api/member/signup",
		strings.NewReader(`{"email":"Builder@Example.com","password":"secret12"}`),
	)
	signupReq.Header.Set("Content-Type", "application/json")
	signupRec := httptest.NewRecorder()
	router.ServeHTTP(signupRec, signupReq)

	if signupRec.Code != http.StatusCreated {
		t.Fatalf("expected signup status 201, got %d", signupRec.Code)
	}

	signupSession := decodeResponse[domain.MemberSession](t, signupRec.Body)
	if signupSession.Email != "builder@example.com" {
		t.Fatalf("expected normalized member email, got %q", signupSession.Email)
	}
	if !signupSession.IsAuthenticated {
		t.Fatal("expected signup session to be authenticated")
	}
	if signupSession.IsEntitled {
		t.Fatal("expected new signup to be inactive")
	}

	signupCookie := signupRec.Result().Cookies()[0]
	sessionReq := httptest.NewRequest(http.MethodGet, "/api/member/session", nil)
	sessionReq.AddCookie(signupCookie)
	sessionRec := httptest.NewRecorder()
	router.ServeHTTP(sessionRec, sessionReq)
	if sessionRec.Code != http.StatusOK {
		t.Fatalf("expected member session status 200, got %d", sessionRec.Code)
	}

	loginCookie := memberLoginCookie(t, router, "builder@example.com", "secret12")
	loginReq := httptest.NewRequest(http.MethodGet, "/api/member/session", nil)
	loginReq.AddCookie(loginCookie)
	loginRec := httptest.NewRecorder()
	router.ServeHTTP(loginRec, loginReq)
	if loginRec.Code != http.StatusOK {
		t.Fatalf("expected member login session status 200, got %d", loginRec.Code)
	}

	logoutReq := httptest.NewRequest(http.MethodPost, "/api/member/logout", nil)
	logoutReq.AddCookie(loginCookie)
	logoutRec := httptest.NewRecorder()
	router.ServeHTTP(logoutRec, logoutReq)
	if logoutRec.Code != http.StatusNoContent {
		t.Fatalf("expected member logout status 204, got %d", logoutRec.Code)
	}

	duplicateReq := httptest.NewRequest(
		http.MethodPost,
		"/api/member/signup",
		strings.NewReader(`{"email":"builder@example.com","password":"secret12"}`),
	)
	duplicateReq.Header.Set("Content-Type", "application/json")
	duplicateRec := httptest.NewRecorder()
	router.ServeHTTP(duplicateRec, duplicateReq)
	if duplicateRec.Code != http.StatusConflict {
		t.Fatalf("expected duplicate signup status 409, got %d", duplicateRec.Code)
	}
}

func TestPublicPaidSnippetTeaserAndEntitledDetail(t *testing.T) {
	now := time.Now().UTC()
	store := newFakeSnippetStore(domain.Snippet{
		ID:                   "snippet-1",
		CoverImage:           "https://example.com/cover.jpg",
		Code:                 "Text(\"Premium\")",
		Status:               domain.StatusPublished,
		UpdatedAt:            now,
		PublishedAt:          &now,
		RequiresSubscription: true,
		Locales: domain.SnippetLocales{
			EN: localizedFields("Premium Snippet", "premium-snippet", "Workflow"),
			ZH: localizedFields("订阅 Snippet", "ding-yue-snippet", "Workflow"),
		},
	})
	members := newFakeMemberStore()
	router := newTestRouter(t, store, members, nil)

	listReq := httptest.NewRequest(http.MethodGet, "/api/snippets", nil)
	listRec := httptest.NewRecorder()
	router.ServeHTTP(listRec, listReq)
	if listRec.Code != http.StatusOK {
		t.Fatalf("expected public list status 200, got %d", listRec.Code)
	}

	listBody := decodeResponse[[]domain.Snippet](t, listRec.Body)
	if len(listBody) != 1 {
		t.Fatalf("expected one public snippet, got %d", len(listBody))
	}
	if !listBody[0].Locked || listBody[0].AccessLevel != domain.AccessLevelTeaser {
		t.Fatalf("expected teaser response for paid snippet, got locked=%v access=%q", listBody[0].Locked, listBody[0].AccessLevel)
	}
	if listBody[0].Code != "" || listBody[0].Locales.EN.Content != "" || listBody[0].Locales.EN.Prompts != "" {
		t.Fatalf("expected public list teaser to omit protected content, got %#v", listBody[0])
	}

	detailReq := httptest.NewRequest(http.MethodGet, "/api/snippets/slug/premium-snippet", nil)
	detailRec := httptest.NewRecorder()
	router.ServeHTTP(detailRec, detailReq)
	if detailRec.Code != http.StatusOK {
		t.Fatalf("expected paid public detail status 200, got %d", detailRec.Code)
	}

	detailBody := decodeResponse[domain.Snippet](t, detailRec.Body)
	if !detailBody.Locked || detailBody.Code != "" || detailBody.Locales.EN.Content != "" {
		t.Fatalf("expected locked teaser detail, got %#v", detailBody)
	}

	memberCookie := memberSignupCookie(t, router, "builder@example.com", "secret12")
	members.subscriptions["member-1"] = domain.MemberSubscription{
		UserID:           "member-1",
		Status:           domain.SubscriptionStatusActive,
		StripeCustomerID: "cus_member_123",
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	entitledReq := httptest.NewRequest(http.MethodGet, "/api/snippets/slug/premium-snippet", nil)
	entitledReq.AddCookie(memberCookie)
	entitledRec := httptest.NewRecorder()
	router.ServeHTTP(entitledRec, entitledReq)
	if entitledRec.Code != http.StatusOK {
		t.Fatalf("expected entitled detail status 200, got %d", entitledRec.Code)
	}

	entitledBody := decodeResponse[domain.Snippet](t, entitledRec.Body)
	if entitledBody.Locked || entitledBody.AccessLevel != domain.AccessLevelFull || entitledBody.Code == "" || entitledBody.Locales.EN.Content == "" {
		t.Fatalf("expected entitled member to receive full snippet, got %#v", entitledBody)
	}
}

func TestAdminPreviewBypassesPaidDraftAccess(t *testing.T) {
	now := time.Now().UTC()
	store := newFakeSnippetStore(domain.Snippet{
		ID:                   "snippet-1",
		CoverImage:           "https://example.com/cover.jpg",
		Code:                 "Text(\"Preview\")",
		Status:               domain.StatusDraft,
		UpdatedAt:            now,
		PublishedAt:          nil,
		RequiresSubscription: true,
		Locales: domain.SnippetLocales{
			EN: localizedFields("Preview Snippet", "preview-snippet", "Workflow"),
			ZH: localizedFields("预览 Snippet", "yu-lan-snippet", "Workflow"),
		},
	})
	router := newTestRouter(t, store, nil, nil)

	anonymousReq := httptest.NewRequest(http.MethodGet, "/api/snippets/slug/preview-snippet?preview=admin", nil)
	anonymousRec := httptest.NewRecorder()
	router.ServeHTTP(anonymousRec, anonymousReq)
	if anonymousRec.Code != http.StatusNotFound {
		t.Fatalf("expected anonymous preview request to stay hidden, got %d", anonymousRec.Code)
	}

	adminCookie := loginCookie(t, router)
	previewReq := httptest.NewRequest(http.MethodGet, "/api/snippets/slug/preview-snippet?preview=admin", nil)
	previewReq.AddCookie(adminCookie)
	previewRec := httptest.NewRecorder()
	router.ServeHTTP(previewRec, previewReq)
	if previewRec.Code != http.StatusOK {
		t.Fatalf("expected admin preview status 200, got %d", previewRec.Code)
	}

	previewBody := decodeResponse[domain.Snippet](t, previewRec.Body)
	if previewBody.Locked || previewBody.AccessLevel != domain.AccessLevelFull || previewBody.Code == "" || previewBody.Locales.EN.Content == "" {
		t.Fatalf("expected admin preview to bypass paywall, got %#v", previewBody)
	}
}

func TestMemberCheckoutBillingPortalAndWebhookSync(t *testing.T) {
	members := newFakeMemberStore()
	billing := &fakeBillingProvider{
		checkoutURL: "https://stripe.test/checkout",
		portalURL:   "https://stripe.test/portal",
	}
	router := newTestRouter(t, nil, members, billing)
	memberCookie := memberSignupCookie(t, router, "builder@example.com", "secret12")

	checkoutReq := httptest.NewRequest(http.MethodPost, "/api/member/checkout", nil)
	checkoutReq.AddCookie(memberCookie)
	checkoutRec := httptest.NewRecorder()
	router.ServeHTTP(checkoutRec, checkoutReq)
	if checkoutRec.Code != http.StatusOK {
		t.Fatalf("expected checkout session status 200, got %d with body %q", checkoutRec.Code, checkoutRec.Body.String())
	}

	checkoutBody := decodeResponse[map[string]string](t, checkoutRec.Body)
	if checkoutBody["url"] != "https://stripe.test/checkout" {
		t.Fatalf("expected checkout url, got %#v", checkoutBody)
	}
	if billing.lastCheckoutParams.UserID != "member-1" || billing.lastCheckoutParams.Email != "builder@example.com" {
		t.Fatalf("expected checkout to use member identity, got %#v", billing.lastCheckoutParams)
	}

	now := time.Now().UTC()
	members.subscriptions["member-1"] = domain.MemberSubscription{
		UserID:               "member-1",
		StripeCustomerID:     "cus_member_123",
		StripeSubscriptionID: "sub_member_123",
		Status:               domain.SubscriptionStatusInactive,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	portalReq := httptest.NewRequest(http.MethodPost, "/api/member/billing-portal", nil)
	portalReq.AddCookie(memberCookie)
	portalRec := httptest.NewRecorder()
	router.ServeHTTP(portalRec, portalReq)
	if portalRec.Code != http.StatusOK {
		t.Fatalf("expected billing portal status 200, got %d with body %q", portalRec.Code, portalRec.Body.String())
	}
	if billing.lastPortalCustomer != "cus_member_123" {
		t.Fatalf("expected billing portal customer id, got %q", billing.lastPortalCustomer)
	}

	billing.webhookEvent = BillingWebhookEvent{
		CheckoutCompleted: &BillingCheckoutCompleted{
			UserID:         "member-1",
			CustomerID:     "cus_member_123",
			SubscriptionID: "sub_member_123",
			PriceID:        "price_monthly_123",
		},
	}
	webhookReq := httptest.NewRequest(http.MethodPost, "/api/stripe/webhook", strings.NewReader(`{}`))
	webhookReq.Header.Set("Stripe-Signature", "test-signature")
	webhookRec := httptest.NewRecorder()
	router.ServeHTTP(webhookRec, webhookReq)
	if webhookRec.Code != http.StatusOK {
		t.Fatalf("expected checkout webhook status 200, got %d with body %q", webhookRec.Code, webhookRec.Body.String())
	}

	periodEnd := now.Add(30 * 24 * time.Hour)
	billing.webhookEvent = BillingWebhookEvent{
		SubscriptionState: &BillingSubscriptionState{
			UserID:            "member-1",
			CustomerID:        "cus_member_123",
			SubscriptionID:    "sub_member_123",
			Status:            "active",
			CurrentPeriodEnd:  &periodEnd,
			CancelAtPeriodEnd: false,
			PriceID:           "price_monthly_123",
		},
	}
	webhookReq = httptest.NewRequest(http.MethodPost, "/api/stripe/webhook", strings.NewReader(`{}`))
	webhookReq.Header.Set("Stripe-Signature", "test-signature")
	webhookRec = httptest.NewRecorder()
	router.ServeHTTP(webhookRec, webhookReq)
	if webhookRec.Code != http.StatusOK {
		t.Fatalf("expected subscription webhook status 200, got %d with body %q", webhookRec.Code, webhookRec.Body.String())
	}

	subscription := members.subscriptions["member-1"]
	if subscription.Status != domain.SubscriptionStatusActive {
		t.Fatalf("expected active subscription after webhook, got %q", subscription.Status)
	}
	if subscription.CurrentPeriodEnd == nil || !subscription.CurrentPeriodEnd.Equal(periodEnd) {
		t.Fatalf("expected current period end to sync, got %#v", subscription.CurrentPeriodEnd)
	}
	if subscription.PriceID != "price_monthly_123" {
		t.Fatalf("expected price id to sync, got %q", subscription.PriceID)
	}
}

func TestUploadCoverImageAndServeStatic(t *testing.T) {
	uploadDir := t.TempDir()
	router := NewRouter(
		fakePinger{},
		newFakeSnippetStore(),
		newFakeMemberStore(),
		testAdminAuthConfig,
		testMemberAuthConfig,
		&fakeBillingProvider{checkoutURL: "https://stripe.test/checkout", portalURL: "https://stripe.test/portal"},
		uploadDir,
	)
	adminCookie := loginCookie(t, router)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	fileWriter, err := writer.CreateFormFile("file", "cover.png")
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	largeImage := image.NewNRGBA(image.Rect(0, 0, 2400, 1200))
	for y := 0; y < 1200; y++ {
		for x := 0; x < 2400; x++ {
			largeImage.Set(x, y, color.NRGBA{
				R: uint8(x % 255),
				G: uint8(y % 255),
				B: uint8((x + y) % 255),
				A: 255,
			})
		}
	}
	if err := png.Encode(fileWriter, largeImage); err != nil {
		t.Fatalf("encode png bytes: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/admin/uploads/cover", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.AddCookie(adminCookie)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected upload status 201, got %d", rec.Code)
	}

	var response map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&response); err != nil {
		t.Fatalf("decode upload response: %v", err)
	}

	uploadedURL := response["url"]
	if !strings.HasPrefix(uploadedURL, "/api/uploads/") || !strings.HasSuffix(uploadedURL, ".webp") {
		t.Fatalf("expected upload url to start with /api/uploads/, got %q", uploadedURL)
	}

	entries, err := os.ReadDir(uploadDir)
	if err != nil {
		t.Fatalf("read upload dir: %v", err)
	}
	if len(entries) != 1 {
		t.Fatalf("expected one uploaded file, got %d", len(entries))
	}

	staticReq := httptest.NewRequest(http.MethodGet, uploadedURL, nil)
	staticRec := httptest.NewRecorder()
	router.ServeHTTP(staticRec, staticReq)
	if staticRec.Code != http.StatusOK {
		t.Fatalf("expected static file status 200, got %d", staticRec.Code)
	}
	if !strings.HasPrefix(staticRec.Header().Get("Content-Type"), "image/webp") {
		t.Fatalf("expected static file content type image/webp, got %q", staticRec.Header().Get("Content-Type"))
	}

	decodedImage, _, err := image.Decode(bytes.NewReader(staticRec.Body.Bytes()))
	if err != nil {
		t.Fatalf("decode optimized image: %v", err)
	}
	if decodedImage.Bounds().Dx() != maxCoverImageDimension || decodedImage.Bounds().Dy() != 1100 {
		t.Fatalf("expected optimized image bounds %dx%d, got %dx%d", maxCoverImageDimension, 1100, decodedImage.Bounds().Dx(), decodedImage.Bounds().Dy())
	}
}

func TestUploadCoverImageRequiresAuthAndImage(t *testing.T) {
	router := newTestRouter(t, newFakeSnippetStore(), nil, nil)

	req := httptest.NewRequest(http.MethodPost, "/api/admin/uploads/cover", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected anonymous upload status 401, got %d", rec.Code)
	}

	adminCookie := loginCookie(t, router)
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	fileWriter, err := writer.CreateFormFile("file", "cover.txt")
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	if _, err := io.WriteString(fileWriter, "not-an-image"); err != nil {
		t.Fatalf("write text bytes: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req = httptest.NewRequest(http.MethodPost, "/api/admin/uploads/cover", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.AddCookie(adminCookie)
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid image upload status 400, got %d", rec.Code)
	}
}

func TestUploadCoverImageTooLarge(t *testing.T) {
	router := newTestRouter(t, newFakeSnippetStore(), nil, nil)
	adminCookie := loginCookie(t, router)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	fileWriter, err := writer.CreateFormFile("file", "cover.png")
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}

	// Keep the content PNG-prefixed so the failure comes from size, not MIME sniffing.
	if _, err := fileWriter.Write([]byte{
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
	}); err != nil {
		t.Fatalf("write png signature: %v", err)
	}

	oversizedPayload := bytes.Repeat([]byte{0x00}, 26<<20)
	if _, err := fileWriter.Write(oversizedPayload); err != nil {
		t.Fatalf("write oversized payload: %v", err)
	}

	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/admin/uploads/cover", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.AddCookie(adminCookie)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected oversized upload status 413, got %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "25 MB or smaller") {
		t.Fatalf("expected oversized upload error message, got %q", rec.Body.String())
	}
}
