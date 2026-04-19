package http

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

const (
	memberSessionCookieName = "just_do_swift_member_session"
	memberSessionDuration   = 30 * 24 * time.Hour
)

type MemberAuthConfig struct {
	SessionSecret string
}

type memberAuth struct {
	sessionSecret []byte
}

type memberSessionPayload struct {
	UserID    string `json:"userId"`
	Email     string `json:"email"`
	IssuedAt  string `json:"issuedAt"`
	ExpiresAt string `json:"expiresAt"`
}

type memberAuthRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type memberSessionContextKey struct{}

func newMemberAuth(cfg MemberAuthConfig) memberAuth {
	return memberAuth{
		sessionSecret: []byte(cfg.SessionSecret),
	}
}

func (a memberAuth) signSession(payload memberSessionPayload) (string, error) {
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

func (a memberAuth) parseSession(token string) (*memberSessionPayload, bool) {
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

	var payload memberSessionPayload
	if err := json.Unmarshal(payloadJSON, &payload); err != nil {
		return nil, false
	}

	if strings.TrimSpace(payload.UserID) == "" {
		return nil, false
	}

	expiresAt, err := time.Parse(time.RFC3339, payload.ExpiresAt)
	if err != nil || time.Now().UTC().After(expiresAt) {
		return nil, false
	}

	return &payload, true
}

func (a memberAuth) sessionCookie(token string, expiresAt time.Time) *http.Cookie {
	return &http.Cookie{
		Name:     memberSessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(memberSessionDuration.Seconds()),
		Expires:  expiresAt.UTC(),
	}
}

func clearMemberSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     memberSessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0).UTC(),
	})
}

func (h *Handler) readMemberSession(r *http.Request) (*memberSessionPayload, bool) {
	cookie, err := r.Cookie(memberSessionCookieName)
	if err != nil || strings.TrimSpace(cookie.Value) == "" {
		return nil, false
	}

	return h.memberAuth.parseSession(cookie.Value)
}

func (h *Handler) requireMemberSession(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		session, ok := h.readMemberSession(r)
		if !ok {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
			return
		}

		ctx := context.WithValue(r.Context(), memberSessionContextKey{}, *session)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func memberSessionFromContext(ctx context.Context) (memberSessionPayload, bool) {
	session, ok := ctx.Value(memberSessionContextKey{}).(memberSessionPayload)
	return session, ok
}
