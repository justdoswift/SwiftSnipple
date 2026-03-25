package publish

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

type AdminSessionResponse struct {
	Authenticated bool   `json:"authenticated"`
	Username      string `json:"username"`
}

type AdminSnippetListItem struct {
	ID               string `json:"id"`
	Title            string `json:"title"`
	Summary          string `json:"summary"`
	CategoryPrimary  string `json:"categoryPrimary"`
	Difficulty       string `json:"difficulty"`
	Version          string `json:"version"`
	State            string `json:"state"`
	PublishedVersion string `json:"publishedVersion,omitempty"`
	HasCover         bool   `json:"hasCover"`
	HasDemo          bool   `json:"hasDemo"`
	UpdatedAt        string `json:"updatedAt"`
}

type AdminEditableFile struct {
	Path    string `json:"path"`
	Label   string `json:"label"`
	Kind    string `json:"kind,omitempty"`
	Content string `json:"content"`
}

type AdminSnippetEditorPayload struct {
	ID              string              `json:"id"`
	Title           string              `json:"title"`
	Summary         string              `json:"summary"`
	CategoryPrimary string              `json:"categoryPrimary"`
	Difficulty      string              `json:"difficulty"`
	Version         string              `json:"version"`
	State           string              `json:"state"`
	SourceRevision  string              `json:"sourceRevision"`
	Tags            []string            `json:"tags"`
	Platforms       []adminPlatform     `json:"platforms"`
	Assets          adminAssets         `json:"assets"`
	License         adminLicense        `json:"license"`
	CodeFiles       []AdminEditableFile `json:"codeFiles"`
	PromptFiles     []AdminEditableFile `json:"promptFiles"`
}

type AdminValidationResponse struct {
	ValidationResult
}

type AdminCreateSnippetRequest struct {
	ID              string `json:"id"`
	Title           string `json:"title"`
	Summary         string `json:"summary"`
	CategoryPrimary string `json:"categoryPrimary"`
	Difficulty      string `json:"difficulty"`
	Version         string `json:"version"`
}

type adminPlatform struct {
	OS         string `json:"os" yaml:"os"`
	MinVersion string `json:"minVersion" yaml:"min_version"`
}

type adminAssets struct {
	Cover           string `json:"cover" yaml:"cover"`
	Demo            string `json:"demo,omitempty" yaml:"demo,omitempty"`
	CoverPreviewURL string `json:"coverPreviewUrl,omitempty"`
	DemoPreviewURL  string `json:"demoPreviewUrl,omitempty"`
}

type adminLicense struct {
	Code             string `json:"code" yaml:"code"`
	Media            string `json:"media" yaml:"media"`
	ThirdPartyNotice string `json:"thirdPartyNotice" yaml:"third_party_notice"`
	ThirdPartyText   string `json:"thirdPartyText,omitempty"`
}

type adminVisibilityEnvelope struct {
	Items []struct {
		ID         string `json:"id"`
		Visibility string `json:"visibility"`
	} `json:"items"`
}

type adminPublishedSnippetEnvelope struct {
	Items []struct {
		Visibility string `json:"visibility"`
		Card       struct {
			ID          string `json:"id"`
			PublishedAt string `json:"publishedAt"`
		} `json:"card"`
	} `json:"items"`
}

type AdminStore struct {
	repo               AdminRepository
	snippetRoot        string
	visibilityIndex    string
	publishedIndexPath string
	now                func() time.Time
}

func NewAdminStore(repo AdminRepository, snippetRoot string, visibilityIndexPath string, publishedIndexPath string) *AdminStore {
	resolvedSnippetRoot, err := resolveProjectPath(snippetRoot)
	if err != nil {
		resolvedSnippetRoot = snippetRoot
	}
	resolvedVisibility := visibilityIndexPath
	if resolved, err := resolveProjectPath(visibilityIndexPath); err == nil {
		resolvedVisibility = resolved
	}
	resolvedPublished := publishedIndexPath
	if resolved, err := resolveProjectPath(publishedIndexPath); err == nil {
		resolvedPublished = resolved
	}

	return &AdminStore{
		repo:               repo,
		snippetRoot:        resolvedSnippetRoot,
		visibilityIndex:    resolvedVisibility,
		publishedIndexPath: resolvedPublished,
		now:                time.Now,
	}
}

func (s *AdminStore) ListSnippets(ctx context.Context) ([]AdminSnippetListItem, error) {
	entries, err := os.ReadDir(s.snippetRoot)
	if err != nil {
		return nil, fmt.Errorf("list snippets: %w", err)
	}

	visibilityMap, publishedAtMap := s.loadVisibilityHints()
	items := make([]AdminSnippetListItem, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		manifest, manifestPath, err := s.loadManifest(entry.Name())
		if err != nil {
			continue
		}

		state, err := s.ensureDatabaseState(ctx, manifest, visibilityMap[manifest.ID], publishedAtMap[manifest.ID])
		if err != nil {
			return nil, err
		}

		info, err := os.Stat(manifestPath)
		if err != nil {
			return nil, err
		}

		items = append(items, AdminSnippetListItem{
			ID:               manifest.ID,
			Title:            manifest.Title,
			Summary:          manifest.Summary,
			CategoryPrimary:  manifest.CategoryPrimary,
			Difficulty:       manifest.Difficulty,
			Version:          manifest.Version,
			State:            state.State,
			PublishedVersion: state.PublishedVersion,
			HasCover:         s.assetExists(manifest.ID, manifest.Assets.Cover),
			HasDemo:          s.assetExists(manifest.ID, manifest.Assets.Demo),
			UpdatedAt:        info.ModTime().UTC().Format(time.RFC3339),
		})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].ID < items[j].ID
	})

	return items, nil
}

func (s *AdminStore) GetSnippet(ctx context.Context, snippetID string) (AdminSnippetEditorPayload, error) {
	visibilityMap, publishedAtMap := s.loadVisibilityHints()
	manifest, _, err := s.loadManifest(snippetID)
	if err != nil {
		return AdminSnippetEditorPayload{}, err
	}

	state, err := s.ensureDatabaseState(ctx, manifest, visibilityMap[manifest.ID], publishedAtMap[manifest.ID])
	if err != nil {
		return AdminSnippetEditorPayload{}, err
	}

	codeFiles, err := s.readEditableFiles(filepath.Join(s.snippetRoot, snippetID, manifest.Code.SwiftUIRoot), "")
	if err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	promptFiles, err := s.readEditableFiles(filepath.Join(s.snippetRoot, snippetID, manifest.Code.PromptRoot), "prompt")
	if err != nil {
		return AdminSnippetEditorPayload{}, err
	}

	thirdPartyPath := filepath.Join(s.snippetRoot, snippetID, manifest.License.ThirdPartyNotice)
	thirdPartyText, _ := os.ReadFile(thirdPartyPath)

	payload := AdminSnippetEditorPayload{
		ID:              manifest.ID,
		Title:           manifest.Title,
		Summary:         manifest.Summary,
		CategoryPrimary: manifest.CategoryPrimary,
		Difficulty:      manifest.Difficulty,
		Version:         manifest.Version,
		State:           state.State,
		SourceRevision:  manifest.SourceRevision,
		Tags:            append([]string(nil), manifest.Tags...),
		Platforms:       make([]adminPlatform, 0, len(manifest.Platforms)),
		Assets: adminAssets{
			Cover: manifest.Assets.Cover,
			Demo:  manifest.Assets.Demo,
		},
		License: adminLicense{
			Code:             manifest.License.Code,
			Media:            manifest.License.Media,
			ThirdPartyNotice: manifest.License.ThirdPartyNotice,
			ThirdPartyText:   string(thirdPartyText),
		},
		CodeFiles:   codeFiles,
		PromptFiles: promptFiles,
	}

	for _, platform := range manifest.Platforms {
		payload.Platforms = append(payload.Platforms, adminPlatform{
			OS:         platform.OS,
			MinVersion: platform.MinVersion,
		})
	}

	if s.assetExists(snippetID, manifest.Assets.Cover) {
		payload.Assets.CoverPreviewURL = fmt.Sprintf("/api/v1/admin/snippets/%s/assets/cover", snippetID)
	}
	if s.assetExists(snippetID, manifest.Assets.Demo) {
		payload.Assets.DemoPreviewURL = fmt.Sprintf("/api/v1/admin/snippets/%s/assets/demo", snippetID)
	}

	return payload, nil
}

func (s *AdminStore) CreateSnippet(ctx context.Context, input AdminCreateSnippetRequest) (AdminSnippetEditorPayload, error) {
	id := strings.TrimSpace(input.ID)
	if id == "" {
		return AdminSnippetEditorPayload{}, fmt.Errorf("snippet id is required")
	}
	if !isValidSnippetID(id) {
		return AdminSnippetEditorPayload{}, fmt.Errorf("snippet id must be a slug")
	}

	snippetDir := filepath.Join(s.snippetRoot, id)
	if _, err := os.Stat(snippetDir); err == nil {
		return AdminSnippetEditorPayload{}, fmt.Errorf("snippet already exists")
	}

	manifest := snippetManifest{
		ID:              id,
		Title:           strings.TrimSpace(input.Title),
		Summary:         strings.TrimSpace(input.Summary),
		CategoryPrimary: defaultString(input.CategoryPrimary, "layout"),
		Version:         defaultString(input.Version, "1.0.0"),
		Tags:            []string{},
		Difficulty:      defaultString(input.Difficulty, "easy"),
		Platforms: []struct {
			OS         string `yaml:"os"`
			MinVersion string `yaml:"min_version"`
		}{
			{OS: "iOS", MinVersion: "17.0"},
		},
		SourceRevision: id + "-rev-001",
	}
	manifest.Status = "draft"
	manifest.Assets.Cover = "Media/cover.png"
	manifest.Code.SwiftUIRoot = "Code/SwiftUI"
	manifest.Code.PromptRoot = "Code/Vibe"
	manifest.Code.TestsRoot = "Tests"
	manifest.License.Code = "MIT"
	manifest.License.Media = "CC-BY-4.0"
	manifest.License.ThirdPartyNotice = "LICENSES/THIRD_PARTY.md"
	manifest.Facets = []string{"platform:iOS", "difficulty:" + manifest.Difficulty}

	if manifest.Title == "" {
		manifest.Title = id
	}
	if manifest.Summary == "" {
		manifest.Summary = "待补充摘要。"
	}

	if err := os.MkdirAll(filepath.Join(snippetDir, "Code", "SwiftUI", "Sources"), 0o755); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := os.MkdirAll(filepath.Join(snippetDir, "Code", "SwiftUI", "Demo"), 0o755); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := os.MkdirAll(filepath.Join(snippetDir, "Code", "Vibe"), 0o755); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := os.MkdirAll(filepath.Join(snippetDir, "Media"), 0o755); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := os.MkdirAll(filepath.Join(snippetDir, "LICENSES"), 0o755); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := os.MkdirAll(filepath.Join(snippetDir, "Tests"), 0o755); err != nil {
		return AdminSnippetEditorPayload{}, err
	}

	pascalName := slugToPascal(id)
	if err := os.WriteFile(filepath.Join(snippetDir, "Code", "SwiftUI", "Sources", pascalName+".swift"), []byte("import SwiftUI\n\n"), 0o644); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := os.WriteFile(filepath.Join(snippetDir, "Code", "SwiftUI", "README.md"), []byte("# "+manifest.Title+"\n"), 0o644); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := os.WriteFile(filepath.Join(snippetDir, "Code", "Vibe", "prompt.md"), []byte("# 目标\n"), 0o644); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := os.WriteFile(filepath.Join(snippetDir, "Code", "Vibe", "acceptance.md"), []byte("- [ ] 待补充验收标准\n"), 0o644); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := os.WriteFile(filepath.Join(snippetDir, "Code", "Vibe", "prompt.yaml"), []byte("name: default\n"), 0o644); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := os.WriteFile(filepath.Join(snippetDir, "LICENSES", "THIRD_PARTY.md"), []byte("无第三方声明。\n"), 0o644); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := os.WriteFile(filepath.Join(snippetDir, "Tests", ".gitkeep"), []byte(""), 0o644); err != nil {
		return AdminSnippetEditorPayload{}, err
	}

	if err := s.writeManifest(snippetDir, manifest); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if _, err := s.ensureDatabaseState(ctx, manifest, "", ""); err != nil {
		return AdminSnippetEditorPayload{}, err
	}

	return s.GetSnippet(ctx, id)
}

func (s *AdminStore) SaveSnippet(ctx context.Context, snippetID string, payload AdminSnippetEditorPayload) (AdminSnippetEditorPayload, error) {
	if payload.ID != snippetID {
		return AdminSnippetEditorPayload{}, fmt.Errorf("payload id mismatch")
	}

	manifest, _, err := s.loadManifest(snippetID)
	if err != nil {
		return AdminSnippetEditorPayload{}, err
	}

	manifest.Title = strings.TrimSpace(payload.Title)
	manifest.Summary = strings.TrimSpace(payload.Summary)
	manifest.CategoryPrimary = strings.TrimSpace(payload.CategoryPrimary)
	manifest.Difficulty = strings.TrimSpace(payload.Difficulty)
	manifest.Version = strings.TrimSpace(payload.Version)
	manifest.SourceRevision = strings.TrimSpace(payload.SourceRevision)
	manifest.Tags = trimNonEmpty(payload.Tags)
	manifest.Facets = []string{
		"platform:" + defaultPlatformFacet(payload.Platforms),
		"difficulty:" + manifest.Difficulty,
	}
	manifest.Platforms = make([]struct {
		OS         string `yaml:"os"`
		MinVersion string `yaml:"min_version"`
	}, 0, len(payload.Platforms))
	for _, platform := range payload.Platforms {
		if strings.TrimSpace(platform.OS) == "" || strings.TrimSpace(platform.MinVersion) == "" {
			continue
		}
		manifest.Platforms = append(manifest.Platforms, struct {
			OS         string `yaml:"os"`
			MinVersion string `yaml:"min_version"`
		}{
			OS:         strings.TrimSpace(platform.OS),
			MinVersion: strings.TrimSpace(platform.MinVersion),
		})
	}
	if len(manifest.Platforms) == 0 {
		manifest.Platforms = []struct {
			OS         string `yaml:"os"`
			MinVersion string `yaml:"min_version"`
		}{
			{OS: "iOS", MinVersion: "17.0"},
		}
	}

	manifest.Assets.Cover = defaultString(strings.TrimSpace(payload.Assets.Cover), "Media/cover.png")
	manifest.Assets.Demo = strings.TrimSpace(payload.Assets.Demo)
	manifest.License.Code = strings.TrimSpace(payload.License.Code)
	manifest.License.Media = strings.TrimSpace(payload.License.Media)
	manifest.License.ThirdPartyNotice = defaultString(strings.TrimSpace(payload.License.ThirdPartyNotice), "LICENSES/THIRD_PARTY.md")

	snippetDir := filepath.Join(s.snippetRoot, snippetID)
	if err := s.writeEditableFiles(filepath.Join(snippetDir, manifest.Code.SwiftUIRoot), payload.CodeFiles); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := s.writeEditableFiles(filepath.Join(snippetDir, manifest.Code.PromptRoot), payload.PromptFiles); err != nil {
		return AdminSnippetEditorPayload{}, err
	}

	if err := os.MkdirAll(filepath.Dir(filepath.Join(snippetDir, manifest.License.ThirdPartyNotice)), 0o755); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := os.WriteFile(filepath.Join(snippetDir, manifest.License.ThirdPartyNotice), []byte(payload.License.ThirdPartyText), 0o644); err != nil {
		return AdminSnippetEditorPayload{}, err
	}
	if err := s.writeManifest(snippetDir, manifest); err != nil {
		return AdminSnippetEditorPayload{}, err
	}

	visibilityMap, publishedAtMap := s.loadVisibilityHints()
	if _, err := s.ensureDatabaseState(ctx, manifest, visibilityMap[manifest.ID], publishedAtMap[manifest.ID]); err != nil {
		return AdminSnippetEditorPayload{}, err
	}

	return s.GetSnippet(ctx, snippetID)
}

func (s *AdminStore) ValidateSnippet(ctx context.Context, validator interface {
	ValidateReady(ctx context.Context, snippetID string, version string) (ValidationResult, error)
}, snippetID string) (AdminValidationResponse, error) {
	manifest, _, err := s.loadManifest(snippetID)
	if err != nil {
		return AdminValidationResponse{}, err
	}
	visibilityMap, publishedAtMap := s.loadVisibilityHints()
	if _, err := s.ensureDatabaseState(ctx, manifest, visibilityMap[manifest.ID], publishedAtMap[manifest.ID]); err != nil {
		return AdminValidationResponse{}, err
	}

	result, err := validator.ValidateReady(ctx, snippetID, manifest.Version)
	if err != nil {
		return AdminValidationResponse{}, err
	}

	return AdminValidationResponse{ValidationResult: result}, nil
}

func (s *AdminStore) UploadAsset(ctx context.Context, snippetID string, kind string, contentType string, filename string, body io.Reader) error {
	manifest, _, err := s.loadManifest(snippetID)
	if err != nil {
		return err
	}
	if kind != "cover" && kind != "demo" {
		return fmt.Errorf("unsupported asset kind")
	}

	var relativePath string
	switch kind {
	case "cover":
		relativePath = defaultString(manifest.Assets.Cover, "Media/cover"+defaultAssetExtension(contentType, filename, ".png"))
		manifest.Assets.Cover = relativePath
	case "demo":
		relativePath = defaultString(manifest.Assets.Demo, "Media/demo"+defaultAssetExtension(contentType, filename, ".mp4"))
		manifest.Assets.Demo = relativePath
	}

	fullPath := filepath.Join(s.snippetRoot, snippetID, filepath.FromSlash(relativePath))
	if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
		return err
	}
	content, err := io.ReadAll(body)
	if err != nil {
		return err
	}
	if err := os.WriteFile(fullPath, content, 0o644); err != nil {
		return err
	}
	if err := s.writeManifest(filepath.Join(s.snippetRoot, snippetID), manifest); err != nil {
		return err
	}

	visibilityMap, publishedAtMap := s.loadVisibilityHints()
	if _, err := s.ensureDatabaseState(ctx, manifest, visibilityMap[manifest.ID], publishedAtMap[manifest.ID]); err != nil {
		return err
	}

	return nil
}

func (s *AdminStore) OpenAsset(snippetID string, kind string) ([]byte, string, error) {
	manifest, _, err := s.loadManifest(snippetID)
	if err != nil {
		return nil, "", err
	}

	var relativePath string
	switch kind {
	case "cover":
		relativePath = manifest.Assets.Cover
	case "demo":
		relativePath = manifest.Assets.Demo
	default:
		return nil, "", fmt.Errorf("unsupported asset kind")
	}
	if strings.TrimSpace(relativePath) == "" {
		return nil, "", os.ErrNotExist
	}

	fullPath := filepath.Join(s.snippetRoot, snippetID, filepath.FromSlash(relativePath))
	content, err := os.ReadFile(fullPath)
	if err != nil {
		return nil, "", err
	}

	contentType := mime.TypeByExtension(filepath.Ext(fullPath))
	if contentType == "" {
		contentType = http.DetectContentType(content)
	}
	return content, contentType, nil
}

func (s *AdminStore) ensureDatabaseState(ctx context.Context, manifest snippetManifest, visibility string, publishedAt string) (StateRecord, error) {
	record := SnippetRecord{
		ID:              manifest.ID,
		Title:           manifest.Title,
		Summary:         manifest.Summary,
		CategoryPrimary: manifest.CategoryPrimary,
		Difficulty:      manifest.Difficulty,
		Status:          defaultString(manifest.Status, "draft"),
	}
	if err := s.repo.UpsertSnippet(ctx, record); err != nil {
		return StateRecord{}, err
	}

	versionRecord, err := s.repo.UpsertVersion(ctx, VersionRecord{
		SnippetID:      manifest.ID,
		Version:        manifest.Version,
		SourceRevision: defaultString(manifest.SourceRevision, manifest.ID+"-rev-001"),
		Changelog:      "Managed by studio",
	})
	if err != nil {
		return StateRecord{}, err
	}

	if s.assetExists(manifest.ID, manifest.Assets.Cover) {
		if err := s.repo.UpsertAsset(ctx, AssetRecord{
			SnippetID:  manifest.ID,
			Version:    versionRecord.Version,
			AssetKind:  "cover",
			Path:       manifest.Assets.Cover,
			MIMEType:   mimeForPath(manifest.Assets.Cover),
			IsRequired: true,
		}); err != nil {
			return StateRecord{}, err
		}
	}
	if s.assetExists(manifest.ID, manifest.Assets.Demo) {
		if err := s.repo.UpsertAsset(ctx, AssetRecord{
			SnippetID:  manifest.ID,
			Version:    versionRecord.Version,
			AssetKind:  "demo",
			Path:       manifest.Assets.Demo,
			MIMEType:   mimeForPath(manifest.Assets.Demo),
			IsRequired: false,
		}); err != nil {
			return StateRecord{}, err
		}
	}

	state, err := s.repo.GetState(ctx, manifest.ID)
	if err == nil {
		if visibility == "published" && state.State != "published" {
			state.State = "published"
			state.PublishedVersion = manifest.Version
			if publishedAt != "" {
				if parsed, parseErr := time.Parse(time.RFC3339Nano, publishedAt); parseErr == nil {
					utc := parsed.UTC()
					state.PublishedAt = &utc
				}
			}
			if saveErr := s.repo.SaveState(ctx, state); saveErr != nil {
				return StateRecord{}, saveErr
			}
		}
		return state, nil
	}
	if err != ErrSnippetNotFound {
		return StateRecord{}, err
	}

	state = StateRecord{
		SnippetID: manifest.ID,
		State:     defaultString(manifest.Status, "draft"),
	}
	if visibility == "published" {
		state.State = "published"
		state.PublishedVersion = manifest.Version
		if publishedAt != "" {
			if parsed, parseErr := time.Parse(time.RFC3339Nano, publishedAt); parseErr == nil {
				utc := parsed.UTC()
				state.PublishedAt = &utc
			}
		}
	} else if manifest.Status == "review" {
		now := s.now().UTC()
		state.ReviewedAt = &now
	}

	if err := s.repo.SaveState(ctx, state); err != nil {
		return StateRecord{}, err
	}

	return state, nil
}

func (s *AdminStore) loadManifest(snippetID string) (snippetManifest, string, error) {
	manifestPath := filepath.Join(s.snippetRoot, snippetID, "snippet.yaml")
	bytes, err := os.ReadFile(manifestPath)
	if err != nil {
		return snippetManifest{}, "", err
	}
	var manifest snippetManifest
	if err := yaml.Unmarshal(bytes, &manifest); err != nil {
		return snippetManifest{}, "", err
	}
	return manifest, manifestPath, nil
}

func (s *AdminStore) writeManifest(snippetDir string, manifest snippetManifest) error {
	encoded, err := yaml.Marshal(manifest)
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(snippetDir, "snippet.yaml"), encoded, 0o644)
}

func (s *AdminStore) readEditableFiles(root string, kind string) ([]AdminEditableFile, error) {
	files := make([]AdminEditableFile, 0)
	if _, err := os.Stat(root); err != nil {
		return files, nil
	}

	err := filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		relative, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		files = append(files, AdminEditableFile{
			Path:    filepath.ToSlash(relative),
			Label:   filepath.Base(path),
			Kind:    derivedFileKind(filepath.Base(path), kind),
			Content: string(content),
		})
		return nil
	})
	if err != nil {
		return nil, err
	}

	sort.Slice(files, func(i, j int) bool { return files[i].Path < files[j].Path })
	return files, nil
}

func (s *AdminStore) writeEditableFiles(root string, files []AdminEditableFile) error {
	if err := os.MkdirAll(root, 0o755); err != nil {
		return err
	}
	for _, file := range files {
		if strings.TrimSpace(file.Path) == "" {
			continue
		}
		target, err := safeJoin(root, file.Path)
		if err != nil {
			return err
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return err
		}
		if err := os.WriteFile(target, []byte(file.Content), 0o644); err != nil {
			return err
		}
	}
	return nil
}

func (s *AdminStore) assetExists(snippetID string, relativePath string) bool {
	if strings.TrimSpace(relativePath) == "" {
		return false
	}
	_, err := os.Stat(filepath.Join(s.snippetRoot, snippetID, filepath.FromSlash(relativePath)))
	return err == nil
}

func (s *AdminStore) loadVisibilityHints() (map[string]string, map[string]string) {
	visibilityMap := map[string]string{}
	publishedAtMap := map[string]string{}

	if content, err := os.ReadFile(s.visibilityIndex); err == nil {
		var envelope adminVisibilityEnvelope
		if err := json.Unmarshal(content, &envelope); err == nil {
			for _, item := range envelope.Items {
				visibilityMap[item.ID] = item.Visibility
			}
		}
	}

	if content, err := os.ReadFile(s.publishedIndexPath); err == nil {
		var envelope adminPublishedSnippetEnvelope
		if err := json.Unmarshal(content, &envelope); err == nil {
			for _, item := range envelope.Items {
				if item.Visibility == "published" {
					publishedAtMap[item.Card.ID] = item.Card.PublishedAt
				}
			}
		}
	}

	return visibilityMap, publishedAtMap
}

func defaultString(value string, fallback string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}
	return trimmed
}

func trimNonEmpty(values []string) []string {
	out := make([]string, 0, len(values))
	for _, value := range values {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

func defaultPlatformFacet(platforms []adminPlatform) string {
	if len(platforms) == 0 || strings.TrimSpace(platforms[0].OS) == "" {
		return "iOS"
	}
	return strings.TrimSpace(platforms[0].OS)
}

func mimeForPath(path string) string {
	if detected := mime.TypeByExtension(filepath.Ext(path)); detected != "" {
		return detected
	}
	return "application/octet-stream"
}

func defaultAssetExtension(contentType string, filename string, fallback string) string {
	if ext := filepath.Ext(filename); ext != "" {
		return ext
	}
	if exts, _ := mime.ExtensionsByType(contentType); len(exts) > 0 {
		return exts[0]
	}
	return fallback
}

func safeJoin(root string, relative string) (string, error) {
	cleanRoot := filepath.Clean(root)
	candidate := filepath.Clean(filepath.Join(cleanRoot, filepath.FromSlash(relative)))
	if candidate != cleanRoot && !strings.HasPrefix(candidate, cleanRoot+string(os.PathSeparator)) {
		return "", fmt.Errorf("invalid relative path")
	}
	return candidate, nil
}

func derivedFileKind(name string, fallback string) string {
	lower := strings.ToLower(name)
	switch {
	case strings.Contains(lower, "acceptance"):
		return "acceptance"
	case strings.Contains(lower, "prompt"):
		return "prompt"
	case fallback != "":
		return fallback
	default:
		return "file"
	}
}

func slugToPascal(slug string) string {
	parts := strings.Split(slug, "-")
	for index, part := range parts {
		if part == "" {
			continue
		}
		parts[index] = strings.ToUpper(part[:1]) + part[1:]
	}
	return strings.Join(parts, "")
}

func isValidSnippetID(value string) bool {
	if value == "" {
		return false
	}
	for _, char := range value {
		if char >= 'a' && char <= 'z' {
			continue
		}
		if char >= '0' && char <= '9' {
			continue
		}
		if char == '-' {
			continue
		}
		return false
	}
	return !strings.HasPrefix(value, "-") && !strings.HasSuffix(value, "-") && !strings.Contains(value, "--")
}
