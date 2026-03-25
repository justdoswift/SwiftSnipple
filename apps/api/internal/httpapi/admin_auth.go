package httpapi

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/justdoswift/SwiftSnipple/apps/api/internal/config"
)

const adminSessionCookieName = "swiftsnippet_admin_session"

type adminSessionManager struct {
	password string
	secret   string
	ttl      time.Duration
	secure   bool
	now      func() time.Time
}

func newAdminSessionManager(cfg config.Config) *adminSessionManager {
	return &adminSessionManager{
		password: cfg.AdminPassword,
		secret:   cfg.AdminSessionSecret,
		ttl:      cfg.AdminSessionTTL,
		secure:   cfg.Environment != "development",
		now:      time.Now,
	}
}

func (m *adminSessionManager) login(password string) bool {
	return subtle.ConstantTimeCompare([]byte(password), []byte(m.password)) == 1
}

func (m *adminSessionManager) setCookie(w http.ResponseWriter) error {
	expiresAt := m.now().UTC().Add(m.ttl)
	payload := fmt.Sprintf("admin:%d", expiresAt.Unix())
	mac := hmac.New(sha256.New, []byte(m.secret))
	_, _ = mac.Write([]byte(payload))
	token := payload + ":" + hex.EncodeToString(mac.Sum(nil))
	encoded := base64.RawURLEncoding.EncodeToString([]byte(token))

	http.SetCookie(w, &http.Cookie{
		Name:     adminSessionCookieName,
		Value:    encoded,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   m.secure,
		Expires:  expiresAt,
		MaxAge:   int(m.ttl.Seconds()),
	})
	return nil
}

func (m *adminSessionManager) clearCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     adminSessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   m.secure,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	})
}

func (m *adminSessionManager) authenticated(r *http.Request) bool {
	cookie, err := r.Cookie(adminSessionCookieName)
	if err != nil || strings.TrimSpace(cookie.Value) == "" {
		return false
	}

	raw, err := base64.RawURLEncoding.DecodeString(cookie.Value)
	if err != nil {
		return false
	}
	parts := strings.Split(string(raw), ":")
	if len(parts) != 3 || parts[0] != "admin" {
		return false
	}

	expiry, err := parseInt64(parts[1])
	if err != nil {
		return false
	}
	if m.now().UTC().After(time.Unix(expiry, 0).UTC()) {
		return false
	}

	payload := strings.Join(parts[:2], ":")
	mac := hmac.New(sha256.New, []byte(m.secret))
	_, _ = mac.Write([]byte(payload))
	expected := hex.EncodeToString(mac.Sum(nil))
	return subtle.ConstantTimeCompare([]byte(expected), []byte(parts[2])) == 1
}

func (m *adminSessionManager) middleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !m.authenticated(r) {
			writeJSON(w, http.StatusUnauthorized, errorResponse{
				Code:    "unauthorized",
				Message: "请先登录后台",
			})
			return
		}
		next(w, r)
	}
}

func parseInt64(value string) (int64, error) {
	var parsed int64
	for _, char := range value {
		if char < '0' || char > '9' {
			return 0, fmt.Errorf("invalid int64")
		}
		parsed = parsed*10 + int64(char-'0')
	}
	return parsed, nil
}
