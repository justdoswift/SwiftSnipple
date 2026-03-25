package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/justdoswift/SwiftSnipple/apps/api/internal/cache"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/config"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/discovery"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/publish"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/ratelimit"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/storage"
	"github.com/justdoswift/SwiftSnipple/apps/api/internal/version"
)

type metadataResponse struct {
	Service      string `json:"service"`
	Version      string `json:"version"`
	Phase        string `json:"phase"`
	Environment  string `json:"environment"`
	DatabaseURL  string `json:"databaseUrl"`
	AIConfigured bool   `json:"aiConfigured"`
}

type errorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type uploadURLRequest struct {
	SnippetID     string `json:"snippetID"`
	Version       string `json:"version"`
	AssetKind     string `json:"assetKind"`
	ContentType   string `json:"contentType"`
	ContentLength int64  `json:"contentLength"`
	ContentHash   string `json:"contentHash"`
}

type publishVersionRequest struct {
	Version string `json:"version"`
}

type adminSessionRequest struct {
	Password string `json:"password"`
}

type serverDeps struct {
	discoveryService *discovery.Service
	presigner        interface {
		Presign(req storage.PresignRequest) (storage.PresignResponse, error)
	}
	publishService interface {
		MoveToReview(ctx context.Context, snippetID string) (publish.StateRecord, error)
		PublishVersion(ctx context.Context, snippetID string, version string) (publish.StateRecord, error)
	}
	publishRepository interface {
		GetSnippet(ctx context.Context, snippetID string) (publish.SnippetRecord, error)
		EnsureVersion(ctx context.Context, snippetID string, version string) (publish.VersionRecord, error)
	}
	assetRepository interface {
		ListAssets(ctx context.Context, snippetID string, version string) ([]publish.AssetRecord, error)
	}
	validator interface {
		ValidateReady(ctx context.Context, snippetID string, version string) (publish.ValidationResult, error)
	}
	artifactCompiler interface {
		Compile(ctx context.Context, snippet publish.SnippetRecord, version publish.VersionRecord, assets []publish.AssetRecord, publishedAt time.Time) (publish.ArtifactResult, error)
	}
	adminStore               *publish.AdminStore
	uploadLimiterMiddleware  func(http.HandlerFunc) http.HandlerFunc
	publishLimiterMiddleware func(http.HandlerFunc) http.HandlerFunc
}

func NewServer(cfg config.Config) *http.Server {
	repo := discovery.NewRepository(cfg)
	discoveryService := discovery.NewService(repo, cache.NewMemory(), cfg.DiscoveryCacheTTL)
	presigner := storage.NewPresigner(cfg.StorageUploadBaseURL, cfg.StorageSigningSecret, cfg.StoragePresignTTL)
	publishRepo := publish.NewRepository(cfg.DatabaseURL)
	publishService := publish.NewService(publishRepo)
	validator := publish.NewValidator(publishRepo, publishRepo, cfg.SnippetSourceRoot, "")
	artifactCompiler := publish.NewArtifactCompiler(
		cfg.PublishedIndexPath,
		cfg.VisibilityIndexPath,
		cfg.SearchDocumentsPath,
		cfg.SnippetSourceRoot,
	)
	uploadLimiter := ratelimit.New(cfg.UploadRateLimitBurst, cfg.UploadRateLimitWindow)
	publishLimiter := ratelimit.New(cfg.PublishRateLimitBurst, cfg.PublishRateLimitWindow)
	adminStore := publish.NewAdminStore(
		publishRepo,
		cfg.SnippetSourceRoot,
		cfg.VisibilityIndexPath,
		cfg.PublishedIndexPath,
	)

	return newServerWithDeps(cfg, serverDeps{
		discoveryService:         discoveryService,
		presigner:                presigner,
		publishRepository:        publishRepo,
		assetRepository:          publishRepo,
		publishService:           publishService,
		validator:                validator,
		artifactCompiler:         artifactCompiler,
		adminStore:               adminStore,
		uploadLimiterMiddleware:  ratelimit.Middleware(uploadLimiter, rateLimitKey, nil),
		publishLimiterMiddleware: ratelimit.Middleware(publishLimiter, rateLimitKey, nil),
	})
}

func newServerWithDeps(cfg config.Config, deps serverDeps) *http.Server {
	mux := http.NewServeMux()
	service := deps.discoveryService
	if service == nil {
		repo := discovery.NewRepository(cfg)
		service = discovery.NewService(repo, cache.NewMemory(), cfg.DiscoveryCacheTTL)
	}
	if deps.uploadLimiterMiddleware == nil {
		deps.uploadLimiterMiddleware = func(next http.HandlerFunc) http.HandlerFunc { return next }
	}
	if deps.publishLimiterMiddleware == nil {
		deps.publishLimiterMiddleware = func(next http.HandlerFunc) http.HandlerFunc { return next }
	}
	sessionManager := newAdminSessionManager(cfg)

	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{
			"status":  "ok",
			"service": version.ServiceName,
		})
	})

	mux.HandleFunc("/meta", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, metadataResponse{
			Service:      version.ServiceName,
			Version:      version.Version,
			Phase:        version.Phase,
			Environment:  cfg.Environment,
			DatabaseURL:  cfg.DatabaseURL,
			AIConfigured: true,
		})
	})

	mux.HandleFunc("/api/v1/discovery/feed", func(w http.ResponseWriter, r *http.Request) {
		response, err := service.Feed(r.Context())
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"code":    "internal_error",
				"message": "无法加载内容流",
			})
			return
		}

		writeJSON(w, http.StatusOK, response)
	})

	mux.HandleFunc("/api/v1/discovery/search", func(w http.ResponseWriter, r *http.Request) {
		response, err := service.Search(r.Context(), parseSearchQuery(r))
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"code":    "internal_error",
				"message": "无法搜索内容",
			})
			return
		}

		writeJSON(w, http.StatusOK, response)
	})

	mux.HandleFunc("/api/v1/discovery/snippets/", func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/api/v1/discovery/snippets/")
		if id == "" {
			writeJSON(w, http.StatusNotFound, map[string]string{"code": "not_found"})
			return
		}

		response, err := service.Detail(r.Context(), id)
		if err != nil {
			var notPublicErr discovery.NotPublicError
			switch {
			case errors.As(err, &notPublicErr):
				writeJSON(w, http.StatusForbidden, map[string]string{
					"code":    "not_public",
					"message": "内容未公开",
				})
			case errors.Is(err, discovery.ErrNotFound):
				writeJSON(w, http.StatusNotFound, map[string]string{"code": "not_found"})
			default:
				writeJSON(w, http.StatusInternalServerError, map[string]string{
					"code":    "internal_error",
					"message": "无法加载内容详情",
				})
			}
			return
		}

		writeJSON(w, http.StatusOK, response)
	})

	mux.HandleFunc("/api/v1/admin/session", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			if !sessionManager.authenticated(r) {
				writeJSON(w, http.StatusUnauthorized, errorResponse{
					Code:    "unauthorized",
					Message: "请先登录后台",
				})
				return
			}
			writeJSON(w, http.StatusOK, publish.AdminSessionResponse{
				Authenticated: true,
				Username:      "admin",
			})
		case http.MethodPost:
			var request adminSessionRequest
			if err := decodeJSON(r, &request); err != nil {
				writeJSON(w, http.StatusBadRequest, errorResponse{
					Code:    "invalid_request",
					Message: "请求体不是合法 JSON",
				})
				return
			}
			if !sessionManager.login(strings.TrimSpace(request.Password)) {
				writeJSON(w, http.StatusUnauthorized, errorResponse{
					Code:    "invalid_credentials",
					Message: "后台密码不正确",
				})
				return
			}
			_ = sessionManager.setCookie(w)
			writeJSON(w, http.StatusOK, publish.AdminSessionResponse{
				Authenticated: true,
				Username:      "admin",
			})
		case http.MethodDelete:
			sessionManager.clearCookie(w)
			writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
		default:
			writeJSON(w, http.StatusMethodNotAllowed, errorResponse{
				Code:    "method_not_allowed",
				Message: "仅支持 GET / POST / DELETE",
			})
		}
	})

	mux.HandleFunc("/api/v1/admin/snippets", sessionManager.middleware(func(w http.ResponseWriter, r *http.Request) {
		if deps.adminStore == nil {
			writeJSON(w, http.StatusInternalServerError, errorResponse{
				Code:    "internal_error",
				Message: "后台内容服务不可用",
			})
			return
		}

		switch r.Method {
		case http.MethodGet:
			items, err := deps.adminStore.ListSnippets(r.Context())
			if err != nil {
				writeJSON(w, http.StatusInternalServerError, errorResponse{
					Code:    "internal_error",
					Message: err.Error(),
				})
				return
			}
			writeJSON(w, http.StatusOK, map[string]any{"items": items})
		case http.MethodPost:
			var request publish.AdminCreateSnippetRequest
			if err := decodeJSON(r, &request); err != nil {
				writeJSON(w, http.StatusBadRequest, errorResponse{
					Code:    "invalid_request",
					Message: "请求体不是合法 JSON",
				})
				return
			}
			payload, err := deps.adminStore.CreateSnippet(r.Context(), request)
			if err != nil {
				writeJSON(w, http.StatusBadRequest, errorResponse{
					Code:    "create_failed",
					Message: err.Error(),
				})
				return
			}
			writeJSON(w, http.StatusCreated, payload)
		default:
			writeJSON(w, http.StatusMethodNotAllowed, errorResponse{
				Code:    "method_not_allowed",
				Message: "仅支持 GET / POST",
			})
		}
	}))

	mux.HandleFunc("/api/v1/admin/snippets/", sessionManager.middleware(func(w http.ResponseWriter, r *http.Request) {
		if deps.adminStore == nil {
			writeJSON(w, http.StatusInternalServerError, errorResponse{
				Code:    "internal_error",
				Message: "后台内容服务不可用",
			})
			return
		}

		snippetID, action, ok := parseAdminSnippetAction(r.URL.Path)
		if !ok {
			writeJSON(w, http.StatusNotFound, errorResponse{
				Code:    "not_found",
				Message: "未找到后台内容路由",
			})
			return
		}

		switch {
		case action == "" && r.Method == http.MethodGet:
			payload, err := deps.adminStore.GetSnippet(r.Context(), snippetID)
			if err != nil {
				writeJSON(w, http.StatusNotFound, errorResponse{
					Code:    "not_found",
					Message: err.Error(),
				})
				return
			}
			writeJSON(w, http.StatusOK, payload)
		case action == "" && r.Method == http.MethodPut:
			var payload publish.AdminSnippetEditorPayload
			if err := decodeJSON(r, &payload); err != nil {
				writeJSON(w, http.StatusBadRequest, errorResponse{
					Code:    "invalid_request",
					Message: "请求体不是合法 JSON",
				})
				return
			}
			saved, err := deps.adminStore.SaveSnippet(r.Context(), snippetID, payload)
			if err != nil {
				writeJSON(w, http.StatusBadRequest, errorResponse{
					Code:    "save_failed",
					Message: err.Error(),
				})
				return
			}
			writeJSON(w, http.StatusOK, saved)
		case action == "validate" && r.Method == http.MethodPost:
			if deps.validator == nil {
				writeJSON(w, http.StatusInternalServerError, errorResponse{
					Code:    "internal_error",
					Message: "校验服务不可用",
				})
				return
			}
			result, err := deps.adminStore.ValidateSnippet(r.Context(), deps.validator, snippetID)
			if err != nil {
				writeJSON(w, http.StatusBadRequest, errorResponse{
					Code:    "validate_failed",
					Message: err.Error(),
				})
				return
			}
			writeJSON(w, http.StatusOK, result)
		case strings.HasPrefix(action, "assets/") && r.Method == http.MethodGet:
			kind := strings.TrimPrefix(action, "assets/")
			content, contentType, err := deps.adminStore.OpenAsset(snippetID, kind)
			if err != nil {
				writeJSON(w, http.StatusNotFound, errorResponse{
					Code:    "not_found",
					Message: "资源不存在",
				})
				return
			}
			w.Header().Set("Content-Type", contentType)
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(content)
		case strings.HasPrefix(action, "assets/") && r.Method == http.MethodPost:
			kind := strings.TrimPrefix(action, "assets/")
			file, header, err := r.FormFile("file")
			if err != nil {
				writeJSON(w, http.StatusBadRequest, errorResponse{
					Code:    "invalid_request",
					Message: "缺少上传文件",
				})
				return
			}
			defer file.Close()
			if err := deps.adminStore.UploadAsset(r.Context(), snippetID, kind, header.Header.Get("Content-Type"), header.Filename, file); err != nil {
				writeJSON(w, http.StatusBadRequest, errorResponse{
					Code:    "upload_failed",
					Message: err.Error(),
				})
				return
			}
			writeJSON(w, http.StatusOK, map[string]any{
				"ok":         true,
				"previewUrl": fmt.Sprintf("/api/v1/admin/snippets/%s/assets/%s", snippetID, kind),
			})
		default:
			writeJSON(w, http.StatusMethodNotAllowed, errorResponse{
				Code:    "method_not_allowed",
				Message: "后台内容动作不支持当前方法",
			})
		}
	}))

	mux.HandleFunc("/api/v1/media/upload-url", sessionManager.middleware(deps.uploadLimiterMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, errorResponse{
				Code:    "method_not_allowed",
				Message: "仅支持 POST",
			})
			return
		}
		if deps.presigner == nil {
			writeJSON(w, http.StatusInternalServerError, errorResponse{
				Code:    "internal_error",
				Message: "上传服务不可用",
			})
			return
		}

		var request uploadURLRequest
		if err := decodeJSON(r, &request); err != nil {
			writeJSON(w, http.StatusBadRequest, errorResponse{
				Code:    "invalid_request",
				Message: "请求体不是合法 JSON",
			})
			return
		}

		response, err := deps.presigner.Presign(storage.PresignRequest{
			SnippetID:     strings.TrimSpace(request.SnippetID),
			Version:       strings.TrimSpace(request.Version),
			AssetKind:     strings.TrimSpace(request.AssetKind),
			ContentType:   strings.TrimSpace(request.ContentType),
			ContentLength: request.ContentLength,
			ContentHash:   strings.TrimSpace(request.ContentHash),
		})
		if err != nil {
			if errors.Is(err, storage.ErrInvalidRequest) {
				writeJSON(w, http.StatusBadRequest, errorResponse{
					Code:    "invalid_request",
					Message: err.Error(),
				})
				return
			}

			writeJSON(w, http.StatusInternalServerError, errorResponse{
				Code:    "internal_error",
				Message: "无法签发上传地址",
			})
			return
		}

		writeJSON(w, http.StatusOK, response)
	})))

	mux.HandleFunc("/api/v1/publish/snippets/", sessionManager.middleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, errorResponse{
				Code:    "method_not_allowed",
				Message: "仅支持 POST",
			})
			return
		}
		if deps.publishService == nil {
			writeJSON(w, http.StatusInternalServerError, errorResponse{
				Code:    "internal_error",
				Message: "发布服务不可用",
			})
			return
		}

		snippetID, action, ok := parsePublishAction(r.URL.Path)
		if !ok {
			writeJSON(w, http.StatusNotFound, errorResponse{
				Code:    "not_found",
				Message: "未找到发布路由",
			})
			return
		}

		handler := deps.publishLimiterMiddleware(func(w http.ResponseWriter, r *http.Request) {
			switch action {
			case "review":
				record, err := deps.publishService.MoveToReview(r.Context(), snippetID)
				if err != nil {
					writePublishError(w, err)
					return
				}

				writeJSON(w, http.StatusOK, map[string]any{
					"snippetID":  snippetID,
					"state":      record.State,
					"reviewedAt": record.ReviewedAt,
				})
			case "publish":
				var request publishVersionRequest
				if err := decodeJSON(r, &request); err != nil {
					writeJSON(w, http.StatusBadRequest, errorResponse{
						Code:    "invalid_request",
						Message: "请求体不是合法 JSON",
					})
					return
				}
				if strings.TrimSpace(request.Version) == "" {
					writeJSON(w, http.StatusBadRequest, errorResponse{
						Code:    "invalid_request",
						Message: "version 是必填字段",
					})
					return
				}

				if deps.validator != nil {
					validation, err := deps.validator.ValidateReady(r.Context(), snippetID, strings.TrimSpace(request.Version))
					if err != nil {
						writePublishError(w, err)
						return
					}
					if !validation.OK {
						writeJSON(w, http.StatusUnprocessableEntity, map[string]any{
							"code":    "publish_validation_failed",
							"message": "发布准备度校验失败",
							"issues":  validation.Issues,
						})
						return
					}
				}

				record, err := deps.publishService.PublishVersion(r.Context(), snippetID, strings.TrimSpace(request.Version))
				if err != nil {
					writePublishError(w, err)
					return
				}

				var artifactResult publish.ArtifactResult
				if deps.publishRepository != nil && deps.assetRepository != nil && deps.artifactCompiler != nil {
					snippetRecord, err := deps.publishRepository.GetSnippet(r.Context(), snippetID)
					if err != nil {
						writePublishError(w, err)
						return
					}
					versionRecord, err := deps.publishRepository.EnsureVersion(r.Context(), snippetID, strings.TrimSpace(request.Version))
					if err != nil {
						writePublishError(w, err)
						return
					}
					assets, err := deps.assetRepository.ListAssets(r.Context(), snippetID, strings.TrimSpace(request.Version))
					if err != nil {
						writePublishError(w, err)
						return
					}
					publishedAt := time.Now().UTC()
					if record.PublishedAt != nil {
						publishedAt = record.PublishedAt.UTC()
					}
					artifactResult, err = deps.artifactCompiler.Compile(r.Context(), snippetRecord, versionRecord, assets, publishedAt)
					if err != nil {
						writePublishError(w, err)
						return
					}
					if deps.discoveryService != nil {
						deps.discoveryService.Invalidate()
					}
				}

				writeJSON(w, http.StatusOK, map[string]any{
					"snippetID":        snippetID,
					"state":            record.State,
					"publishedVersion": record.PublishedVersion,
					"publishedAt":      record.PublishedAt,
					"artifacts":        artifactResult,
				})
			default:
				writeJSON(w, http.StatusNotFound, errorResponse{
					Code:    "not_found",
					Message: "未找到发布动作",
				})
			}
		})

		handler(w, r)
	}))

	return &http.Server{
		Addr:              cfg.Address,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func decodeJSON(r *http.Request, target any) error {
	defer r.Body.Close()
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}

func parseSearchQuery(r *http.Request) discovery.SearchQuery {
	query := discovery.SearchQuery{
		Q:          strings.TrimSpace(r.URL.Query().Get("q")),
		Category:   strings.TrimSpace(r.URL.Query().Get("category")),
		Difficulty: strings.TrimSpace(r.URL.Query().Get("difficulty")),
		Platform:   strings.TrimSpace(r.URL.Query().Get("platform")),
	}

	if raw := strings.TrimSpace(r.URL.Query().Get("hasDemo")); raw != "" {
		if value, err := strconv.ParseBool(raw); err == nil {
			query.HasDemo = &value
		}
	}

	if raw := strings.TrimSpace(r.URL.Query().Get("hasPrompt")); raw != "" {
		if value, err := strconv.ParseBool(raw); err == nil {
			query.HasPrompt = &value
		}
	}

	return query
}

func parsePublishAction(requestPath string) (snippetID string, action string, ok bool) {
	trimmed := strings.TrimPrefix(requestPath, "/api/v1/publish/snippets/")
	parts := strings.Split(strings.Trim(trimmed, "/"), "/")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", "", false
	}
	return parts[0], parts[1], true
}

func parseAdminSnippetAction(requestPath string) (snippetID string, action string, ok bool) {
	trimmed := strings.TrimPrefix(requestPath, "/api/v1/admin/snippets/")
	parts := strings.Split(strings.Trim(trimmed, "/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		return "", "", false
	}
	if len(parts) == 1 {
		return parts[0], "", true
	}
	return parts[0], strings.Join(parts[1:], "/"), true
}

func writePublishError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, publish.ErrSnippetNotFound):
		writeJSON(w, http.StatusNotFound, errorResponse{
			Code:    "not_found",
			Message: "snippet 不存在",
		})
	case errors.Is(err, publish.ErrVersionNotFound):
		writeJSON(w, http.StatusBadRequest, errorResponse{
			Code:    "version_not_found",
			Message: "指定版本不存在",
		})
	case errors.Is(err, publish.ErrIllegalTransition):
		writeJSON(w, http.StatusConflict, errorResponse{
			Code:    "illegal_transition",
			Message: err.Error(),
		})
	default:
		writeJSON(w, http.StatusInternalServerError, errorResponse{
			Code:    "internal_error",
			Message: "发布流程执行失败",
		})
	}
}

func rateLimitKey(r *http.Request) string {
	if forwardedFor := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); forwardedFor != "" {
		return forwardedFor
	}
	return r.RemoteAddr
}
