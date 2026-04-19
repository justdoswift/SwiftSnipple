package http

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

const (
	adminSessionCookieName = "just_do_swift_admin_session"
	adminSessionDuration   = 7 * 24 * time.Hour
)

type AdminAuthConfig struct {
	Email         string
	Password      string
	SessionSecret string
}

type adminAuth struct {
	email         string
	password      string
	sessionSecret []byte
}

type adminSessionPayload struct {
	Email     string `json:"email"`
	IssuedAt  string `json:"issuedAt"`
	ExpiresAt string `json:"expiresAt"`
}

type adminSessionResponse struct {
	Email     string `json:"email"`
	Provider  string `json:"provider"`
	CreatedAt string `json:"createdAt"`
}

type adminLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type adminSessionContextKey struct{}

func newAdminAuth(cfg AdminAuthConfig) adminAuth {
	return adminAuth{
		email:         strings.ToLower(strings.TrimSpace(cfg.Email)),
		password:      cfg.Password,
		sessionSecret: []byte(cfg.SessionSecret),
	}
}

func (a adminAuth) authenticate(email, password string) bool {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))

	return subtle.ConstantTimeCompare([]byte(normalizedEmail), []byte(a.email)) == 1 &&
		subtle.ConstantTimeCompare([]byte(password), []byte(a.password)) == 1
}

func (a adminAuth) signSession(payload adminSessionPayload) (string, error) {
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	payloadPart := base64.RawURLEncoding.EncodeToString(payloadJSON)
	mac := hmac.New(sha256.New, a.sessionSecret)
	_, _ = mac.Write([]byte(payloadPart))
	signaturePart := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return payloadPart + "." + signaturePart, nil
}

func (a adminAuth) parseSession(token string) (*adminSessionPayload, bool) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return nil, false
	}

	mac := hmac.New(sha256.New, a.sessionSecret)
	_, _ = mac.Write([]byte(parts[0]))
	expectedSignature := mac.Sum(nil)

	providedSignature, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil || !hmac.Equal(expectedSignature, providedSignature) {
		return nil, false
	}

	payloadJSON, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, false
	}

	var payload adminSessionPayload
	if err := json.Unmarshal(payloadJSON, &payload); err != nil {
		return nil, false
	}

	expiresAt, err := time.Parse(time.RFC3339, payload.ExpiresAt)
	if err != nil || time.Now().UTC().After(expiresAt) {
		return nil, false
	}

	if subtle.ConstantTimeCompare([]byte(strings.ToLower(strings.TrimSpace(payload.Email))), []byte(a.email)) != 1 {
		return nil, false
	}

	return &payload, true
}

func (a adminAuth) sessionCookie(token string, expiresAt time.Time) *http.Cookie {
	return &http.Cookie{
		Name:     adminSessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(adminSessionDuration.Seconds()),
		Expires:  expiresAt.UTC(),
	}
}

func clearAdminSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     adminSessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0).UTC(),
	})
}

func (h *Handler) readAdminSession(r *http.Request) (*adminSessionPayload, bool) {
	cookie, err := r.Cookie(adminSessionCookieName)
	if err != nil || strings.TrimSpace(cookie.Value) == "" {
		return nil, false
	}

	return h.auth.parseSession(cookie.Value)
}

func (h *Handler) requireAdminSession(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		session, ok := h.readAdminSession(r)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
			return
		}

		ctx := context.WithValue(r.Context(), adminSessionContextKey{}, *session)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func adminSessionFromContext(ctx context.Context) (adminSessionPayload, bool) {
	session, ok := ctx.Value(adminSessionContextKey{}).(adminSessionPayload)
	return session, ok
}

func sessionResponseFromPayload(payload adminSessionPayload) adminSessionResponse {
	return adminSessionResponse{
		Email:     payload.Email,
		Provider:  "email",
		CreatedAt: payload.IssuedAt,
	}
}
