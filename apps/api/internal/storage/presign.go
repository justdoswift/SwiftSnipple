package storage

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"path"
	"regexp"
	"strings"
	"time"
)

var (
	ErrInvalidRequest = errors.New("invalid presign request")
	snippetIDPattern  = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
	versionPattern    = regexp.MustCompile(`^[A-Za-z0-9._-]+$`)
	allowedAssetKinds = map[string]struct{}{"cover": {}, "demo": {}}
)

type PresignRequest struct {
	SnippetID     string
	Version       string
	AssetKind     string
	ContentType   string
	ContentLength int64
	ContentHash   string
}

type PresignResponse struct {
	ObjectKey string            `json:"objectKey"`
	Method    string            `json:"method"`
	UploadURL string            `json:"uploadUrl"`
	Headers   map[string]string `json:"headers"`
	ExpiresAt string            `json:"expiresAt"`
}

type Presigner struct {
	baseUploadURL string
	signingSecret string
	ttl           time.Duration
	now           func() time.Time
}

func NewPresigner(baseUploadURL string, signingSecret string, ttl time.Duration) *Presigner {
	return &Presigner{
		baseUploadURL: strings.TrimRight(baseUploadURL, "/"),
		signingSecret: signingSecret,
		ttl:           ttl,
		now:           time.Now,
	}
}

func (p *Presigner) Presign(req PresignRequest) (PresignResponse, error) {
	if err := validatePresignRequest(req); err != nil {
		return PresignResponse{}, err
	}

	objectKey := path.Join(req.SnippetID, req.Version, req.AssetKind)
	expiresAt := p.now().UTC().Add(p.ttl)
	signature := p.sign(req, objectKey, expiresAt)

	uploadURL, err := url.Parse(p.baseUploadURL)
	if err != nil {
		return PresignResponse{}, fmt.Errorf("parse upload base url: %w", err)
	}

	query := uploadURL.Query()
	query.Set("objectKey", objectKey)
	query.Set("expiresAt", expiresAt.Format(time.RFC3339))
	query.Set("signature", signature)
	uploadURL.RawQuery = query.Encode()

	headers := map[string]string{
		"Content-Type":   req.ContentType,
		"X-Object-Key":   objectKey,
		"X-Upload-Token": signature,
	}
	if req.ContentHash != "" {
		headers["X-Content-SHA256"] = req.ContentHash
	}

	return PresignResponse{
		ObjectKey: objectKey,
		Method:    "PUT",
		UploadURL: uploadURL.String(),
		Headers:   headers,
		ExpiresAt: expiresAt.Format(time.RFC3339),
	}, nil
}

func validatePresignRequest(req PresignRequest) error {
	switch {
	case !snippetIDPattern.MatchString(req.SnippetID):
		return fmt.Errorf("%w: snippetID must be a slug", ErrInvalidRequest)
	case !versionPattern.MatchString(req.Version):
		return fmt.Errorf("%w: version must be present", ErrInvalidRequest)
	case req.ContentType == "":
		return fmt.Errorf("%w: contentType is required", ErrInvalidRequest)
	case req.ContentLength <= 0:
		return fmt.Errorf("%w: contentLength must be positive", ErrInvalidRequest)
	}

	if _, ok := allowedAssetKinds[req.AssetKind]; !ok {
		return fmt.Errorf("%w: unsupported assetKind %q", ErrInvalidRequest, req.AssetKind)
	}

	return nil
}

func (p *Presigner) sign(req PresignRequest, objectKey string, expiresAt time.Time) string {
	payload := strings.Join([]string{
		objectKey,
		req.AssetKind,
		req.ContentType,
		fmt.Sprintf("%d", req.ContentLength),
		req.ContentHash,
		expiresAt.Format(time.RFC3339),
	}, "\n")

	mac := hmac.New(sha256.New, []byte(p.signingSecret))
	_, _ = mac.Write([]byte(payload))
	return hex.EncodeToString(mac.Sum(nil))
}
