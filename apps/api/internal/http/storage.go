package http

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const defaultUploadPublicBasePath = "/api/uploads"

type AssetStorageConfig struct {
	Provider       string
	LocalDir       string
	PublicBasePath string
	MinIOEndpoint  string
	MinIOAccessKey string
	MinIOSecretKey string
	MinIOBucket    string
	MinIORegion    string
	MinIOUseSSL    bool
}

type assetStore interface {
	Put(ctx context.Context, objectKey, contentType string, body io.Reader, size int64) (storedAsset, error)
	Get(ctx context.Context, objectKey string) (storedObject, error)
}

type storedAsset struct {
	Key         string
	URL         string
	ContentType string
}

type storedObject struct {
	Body        io.ReadCloser
	ContentType string
	Size        int64
}

type localAssetStore struct {
	dir            string
	publicBasePath string
}

type minioAssetStore struct {
	client         *minio.Client
	bucket         string
	publicBasePath string
}

func NewAssetStore(ctx context.Context, cfg AssetStorageConfig) (assetStore, error) {
	provider := strings.ToLower(strings.TrimSpace(cfg.Provider))
	switch provider {
	case "", "local":
		return newLocalAssetStore(cfg.LocalDir, cfg.PublicBasePath), nil
	case "minio":
		return newMinIOAssetStore(ctx, cfg)
	default:
		return nil, fmt.Errorf("unsupported storage provider %q", cfg.Provider)
	}
}

func newLocalAssetStore(dir, publicBasePath string) localAssetStore {
	cleanDir := strings.TrimSpace(dir)
	if cleanDir == "" {
		cleanDir = "uploads"
	}

	return localAssetStore{
		dir:            filepath.Clean(cleanDir),
		publicBasePath: normalizePublicBasePath(publicBasePath),
	}
}

func newMinIOAssetStore(ctx context.Context, cfg AssetStorageConfig) (*minioAssetStore, error) {
	endpoint := strings.TrimSpace(cfg.MinIOEndpoint)
	accessKey := strings.TrimSpace(cfg.MinIOAccessKey)
	secretKey := strings.TrimSpace(cfg.MinIOSecretKey)
	bucket := strings.TrimSpace(cfg.MinIOBucket)
	if endpoint == "" || accessKey == "" || secretKey == "" || bucket == "" {
		return nil, errors.New("minio storage requires endpoint, access key, secret key, and bucket")
	}

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: cfg.MinIOUseSSL,
		Region: strings.TrimSpace(cfg.MinIORegion),
	})
	if err != nil {
		return nil, fmt.Errorf("create minio client: %w", err)
	}

	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, fmt.Errorf("check minio bucket: %w", err)
	}
	if !exists {
		if err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{Region: strings.TrimSpace(cfg.MinIORegion)}); err != nil {
			return nil, fmt.Errorf("create minio bucket: %w", err)
		}
	}

	return &minioAssetStore{
		client:         client,
		bucket:         bucket,
		publicBasePath: normalizePublicBasePath(cfg.PublicBasePath),
	}, nil
}

func (s localAssetStore) Put(_ context.Context, objectKey, contentType string, body io.Reader, _ int64) (storedAsset, error) {
	safeKey, err := sanitizeObjectKey(objectKey)
	if err != nil {
		return storedAsset{}, err
	}

	if err := os.MkdirAll(filepath.Join(s.dir, filepath.Dir(filepath.FromSlash(safeKey))), 0o755); err != nil {
		return storedAsset{}, fmt.Errorf("prepare upload directory: %w", err)
	}

	destinationPath := filepath.Join(s.dir, filepath.FromSlash(safeKey))
	destinationFile, err := os.Create(destinationPath)
	if err != nil {
		return storedAsset{}, fmt.Errorf("create upload file: %w", err)
	}
	defer destinationFile.Close()

	if _, err := io.Copy(destinationFile, body); err != nil {
		return storedAsset{}, fmt.Errorf("store upload file: %w", err)
	}

	return storedAsset{
		Key:         safeKey,
		URL:         assetURLForKey(s.publicBasePath, safeKey),
		ContentType: strings.TrimSpace(contentType),
	}, nil
}

func (s localAssetStore) Get(_ context.Context, objectKey string) (storedObject, error) {
	safeKey, err := sanitizeObjectKey(objectKey)
	if err != nil {
		return storedObject{}, err
	}

	filePath := filepath.Join(s.dir, filepath.FromSlash(safeKey))
	file, err := os.Open(filePath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return storedObject{}, os.ErrNotExist
		}
		return storedObject{}, fmt.Errorf("open upload file: %w", err)
	}

	info, err := file.Stat()
	if err != nil {
		_ = file.Close()
		return storedObject{}, fmt.Errorf("stat upload file: %w", err)
	}

	contentType, err := detectReaderContentType(file, filePath)
	if err != nil {
		_ = file.Close()
		return storedObject{}, err
	}

	return storedObject{
		Body:        file,
		ContentType: contentType,
		Size:        info.Size(),
	}, nil
}

func (s *minioAssetStore) Put(ctx context.Context, objectKey, contentType string, body io.Reader, size int64) (storedAsset, error) {
	safeKey, err := sanitizeObjectKey(objectKey)
	if err != nil {
		return storedAsset{}, err
	}

	_, err = s.client.PutObject(ctx, s.bucket, safeKey, body, size, minio.PutObjectOptions{
		ContentType: strings.TrimSpace(contentType),
	})
	if err != nil {
		return storedAsset{}, fmt.Errorf("put minio object: %w", err)
	}

	return storedAsset{
		Key:         safeKey,
		URL:         assetURLForKey(s.publicBasePath, safeKey),
		ContentType: strings.TrimSpace(contentType),
	}, nil
}

func (s *minioAssetStore) Get(ctx context.Context, objectKey string) (storedObject, error) {
	safeKey, err := sanitizeObjectKey(objectKey)
	if err != nil {
		return storedObject{}, err
	}

	stat, err := s.client.StatObject(ctx, s.bucket, safeKey, minio.StatObjectOptions{})
	if err != nil {
		return storedObject{}, fmt.Errorf("stat minio object: %w", err)
	}

	object, err := s.client.GetObject(ctx, s.bucket, safeKey, minio.GetObjectOptions{})
	if err != nil {
		return storedObject{}, fmt.Errorf("get minio object: %w", err)
	}

	return storedObject{
		Body:        object,
		ContentType: strings.TrimSpace(stat.ContentType),
		Size:        stat.Size,
	}, nil
}

func sanitizeObjectKey(objectKey string) (string, error) {
	cleaned := path.Clean("/" + strings.TrimSpace(objectKey))
	cleaned = strings.TrimPrefix(cleaned, "/")
	if cleaned == "" || cleaned == "." {
		return "", errors.New("asset key is required")
	}
	if strings.Contains(cleaned, "..") {
		return "", errors.New("invalid asset key")
	}

	return cleaned, nil
}

func normalizePublicBasePath(publicBasePath string) string {
	trimmed := strings.TrimSpace(publicBasePath)
	if trimmed == "" {
		return defaultUploadPublicBasePath
	}

	if !strings.HasPrefix(trimmed, "/") {
		trimmed = "/" + trimmed
	}

	return strings.TrimRight(trimmed, "/")
}

func assetURLForKey(publicBasePath, objectKey string) string {
	return fmt.Sprintf("%s/%s", normalizePublicBasePath(publicBasePath), strings.TrimPrefix(objectKey, "/"))
}

func detectReaderContentType(reader io.ReadSeeker, filePath string) (string, error) {
	sniffBuffer := make([]byte, 512)
	bytesRead, err := reader.Read(sniffBuffer)
	if err != nil && !errors.Is(err, io.EOF) {
		return "", fmt.Errorf("read upload content: %w", err)
	}

	if _, err := reader.Seek(0, io.SeekStart); err != nil {
		return "", fmt.Errorf("reset upload content: %w", err)
	}

	contentType := strings.TrimSpace(http.DetectContentType(sniffBuffer[:bytesRead]))
	if contentType != "" && contentType != "application/octet-stream" {
		return contentType, nil
	}

	if extension := filepath.Ext(filePath); extension != "" {
		if guessed := strings.TrimSpace(mime.TypeByExtension(extension)); guessed != "" {
			return guessed, nil
		}
	}

	return "application/octet-stream", nil
}
