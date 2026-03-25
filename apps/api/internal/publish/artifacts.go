package publish

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

type publishedPlatform struct {
	OS         string `json:"os"`
	MinVersion string `json:"minVersion"`
}

type publishedMedia struct {
	CoverURL string `json:"coverUrl"`
	DemoURL  string `json:"demoUrl,omitempty"`
}

type publishedCodeBlock struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Language string `json:"language"`
	Path     string `json:"path"`
	Content  string `json:"content"`
}

type publishedPromptBlock struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Format  string `json:"format"`
	Path    string `json:"path"`
	Content string `json:"content"`
}

type publishedDependency struct {
	Name string `json:"name"`
	Kind string `json:"kind"`
	Note string `json:"note,omitempty"`
}

type publishedLicense struct {
	Code                 string   `json:"code"`
	Media                string   `json:"media"`
	ThirdPartyNoticePath string   `json:"thirdPartyNoticePath"`
	Disclosures          []string `json:"disclosures"`
}

type publishedCard struct {
	ID              string              `json:"id"`
	Title           string              `json:"title"`
	Summary         string              `json:"summary"`
	CategoryPrimary string              `json:"categoryPrimary"`
	Difficulty      string              `json:"difficulty"`
	Platforms       []publishedPlatform `json:"platforms"`
	Tags            []string            `json:"tags"`
	Media           publishedMedia      `json:"media"`
	HasDemo         bool                `json:"hasDemo"`
	HasPrompt       bool                `json:"hasPrompt"`
	FeaturedRank    int                 `json:"featuredRank"`
	PublishedAt     string              `json:"publishedAt"`
}

type publishedDetail struct {
	publishedCard
	CodeBlocks   []publishedCodeBlock   `json:"codeBlocks"`
	PromptBlocks []publishedPromptBlock `json:"promptBlocks"`
	License      publishedLicense       `json:"license"`
	Dependencies []publishedDependency  `json:"dependencies"`
}

type publishedSearchDocument struct {
	ID              string              `json:"id"`
	Title           string              `json:"title"`
	Summary         string              `json:"summary"`
	CategoryPrimary string              `json:"categoryPrimary"`
	Difficulty      string              `json:"difficulty"`
	Platforms       []publishedPlatform `json:"platforms"`
	Tags            []string            `json:"tags"`
	HasDemo         bool                `json:"hasDemo"`
	HasPrompt       bool                `json:"hasPrompt"`
	FeaturedRank    int                 `json:"featuredRank"`
	PublishedAt     string              `json:"publishedAt"`
}

type publishedRecord struct {
	Visibility string                  `json:"visibility"`
	Card       publishedCard           `json:"card"`
	Detail     publishedDetail         `json:"detail"`
	Search     publishedSearchDocument `json:"search"`
}

type publishedEnvelope struct {
	GeneratedAt string            `json:"generatedAt"`
	Items       []publishedRecord `json:"items"`
}

type visibilityRecord struct {
	ID         string `json:"id"`
	Visibility string `json:"visibility"`
}

type visibilityEnvelope struct {
	GeneratedAt string             `json:"generatedAt"`
	Items       []visibilityRecord `json:"items"`
}

type searchDocumentsEnvelope struct {
	GeneratedAt string                    `json:"generatedAt"`
	Items       []publishedSearchDocument `json:"items"`
}

type ArtifactCompiler struct {
	publishedIndexPath  string
	visibilityIndexPath string
	searchDocumentsPath string
	snippetRoot         string
	now                 func() time.Time
}

type ArtifactResult struct {
	SnippetsPath        string   `json:"snippetsPath"`
	VisibilityPath      string   `json:"visibilityPath"`
	SearchDocumentsPath string   `json:"searchDocumentsPath"`
	UpdatedFiles        []string `json:"updatedFiles"`
}

var launchFeaturedRanks = map[string]int{
	"stacked-hero-card":                1,
	"masonry-grid":                     2,
	"basic-card-feed":                  3,
	"skeleton-shimmer":                 4,
	"like-button-bounce":               5,
	"universal-card-container":         6,
	"tag-chips-wrap":                   7,
	"bookmark-long-press":              8,
	"search-page-skeleton":             9,
	"loadable-view-states":             10,
	"review-only-meter":                11,
	"component-generation-prompt-pack": 12,
}

func NewArtifactCompiler(publishedIndexPath string, visibilityIndexPath string, searchDocumentsPath string, snippetRoot string) *ArtifactCompiler {
	return &ArtifactCompiler{
		publishedIndexPath:  publishedIndexPath,
		visibilityIndexPath: visibilityIndexPath,
		searchDocumentsPath: searchDocumentsPath,
		snippetRoot:         snippetRoot,
		now:                 time.Now,
	}
}

func (c *ArtifactCompiler) Compile(ctx context.Context, snippet SnippetRecord, version VersionRecord, assets []AssetRecord, publishedAt time.Time) (ArtifactResult, error) {
	select {
	case <-ctx.Done():
		return ArtifactResult{}, ctx.Err()
	default:
	}

	snippetDir, err := resolveProjectPath(filepath.Join(c.snippetRoot, snippet.ID))
	if err != nil {
		return ArtifactResult{}, err
	}

	manifestBytes, err := os.ReadFile(filepath.Join(snippetDir, "snippet.yaml"))
	if err != nil {
		return ArtifactResult{}, fmt.Errorf("read snippet manifest for artifacts: %w", err)
	}

	var manifest snippetManifest
	if err := yaml.Unmarshal(manifestBytes, &manifest); err != nil {
		return ArtifactResult{}, fmt.Errorf("parse snippet manifest for artifacts: %w", err)
	}

	record, err := c.buildPublishedRecord(snippetDir, manifest, snippet, version, assets, publishedAt.UTC())
	if err != nil {
		return ArtifactResult{}, err
	}

	publishedPath, err := resolveProjectPath(c.publishedIndexPath)
	if err != nil {
		return ArtifactResult{}, err
	}
	visibilityPath, err := resolveProjectPath(c.visibilityIndexPath)
	if err != nil {
		return ArtifactResult{}, err
	}
	searchPath, err := resolveProjectPath(c.searchDocumentsPath)
	if err != nil {
		return ArtifactResult{}, err
	}

	published, err := loadPublishedEnvelope(publishedPath)
	if err != nil {
		return ArtifactResult{}, err
	}
	visibility, err := loadVisibilityEnvelope(visibilityPath)
	if err != nil {
		return ArtifactResult{}, err
	}

	generatedAt := c.now().UTC().Format(time.RFC3339Nano)
	published.GeneratedAt = generatedAt
	visibility.GeneratedAt = generatedAt

	upsertPublishedRecord(&published, record)
	upsertVisibilityRecord(&visibility, visibilityRecord{ID: snippet.ID, Visibility: "published"})

	searchDocuments := searchDocumentsEnvelope{
		GeneratedAt: generatedAt,
		Items:       extractSearchDocuments(published.Items),
	}

	if err := writeJSONFile(publishedPath, published); err != nil {
		return ArtifactResult{}, err
	}
	if err := writeJSONFile(visibilityPath, visibility); err != nil {
		return ArtifactResult{}, err
	}
	if err := writeJSONFile(searchPath, searchDocuments); err != nil {
		return ArtifactResult{}, err
	}

	return ArtifactResult{
		SnippetsPath:        publishedPath,
		VisibilityPath:      visibilityPath,
		SearchDocumentsPath: searchPath,
		UpdatedFiles:        []string{publishedPath, visibilityPath, searchPath},
	}, nil
}

func (c *ArtifactCompiler) buildPublishedRecord(snippetDir string, manifest snippetManifest, snippet SnippetRecord, version VersionRecord, assets []AssetRecord, publishedAt time.Time) (publishedRecord, error) {
	assetMap := make(map[string]AssetRecord, len(assets))
	for _, asset := range assets {
		assetMap[asset.AssetKind] = asset
	}

	platforms := make([]publishedPlatform, 0, len(manifest.Platforms))
	for _, platform := range manifest.Platforms {
		platforms = append(platforms, publishedPlatform{
			OS:         platform.OS,
			MinVersion: platform.MinVersion,
		})
	}

	codeBlocks, err := loadCodeBlocks(snippetDir)
	if err != nil {
		return publishedRecord{}, err
	}
	promptBlocks, err := loadPromptBlocks(snippetDir)
	if err != nil {
		return publishedRecord{}, err
	}
	disclosures, err := loadDisclosures(filepath.Join(snippetDir, manifest.License.ThirdPartyNotice))
	if err != nil {
		return publishedRecord{}, err
	}

	featuredRank := featuredRankForSnippet(snippet.ID)

	media := publishedMedia{
		CoverURL: assetURL(snippet.ID, assetMap["cover"], "cover.png"),
	}
	if demo, ok := assetMap["demo"]; ok {
		media.DemoURL = assetURL(snippet.ID, demo, "demo.mp4")
	}

	card := publishedCard{
		ID:              snippet.ID,
		Title:           manifest.Title,
		Summary:         manifest.Summary,
		CategoryPrimary: manifest.CategoryPrimary,
		Difficulty:      manifest.Difficulty,
		Platforms:       platforms,
		Tags:            append([]string(nil), manifest.Tags...),
		Media:           media,
		HasDemo:         media.DemoURL != "",
		HasPrompt:       len(promptBlocks) > 0,
		FeaturedRank:    featuredRank,
		PublishedAt:     publishedAt.Format(time.RFC3339Nano),
	}

	detail := publishedDetail{
		publishedCard: card,
		CodeBlocks:    codeBlocks,
		PromptBlocks:  promptBlocks,
		License: publishedLicense{
			Code:                 manifest.License.Code,
			Media:                manifest.License.Media,
			ThirdPartyNoticePath: manifest.License.ThirdPartyNotice,
			Disclosures:          disclosures,
		},
		Dependencies: []publishedDependency{
			{
				Name: "SwiftUI",
				Kind: "framework",
			},
		},
	}
	if snippet.ID == "stacked-hero-card" {
		detail.Dependencies = append(detail.Dependencies, publishedDependency{
			Name: "SF Symbols",
			Kind: "tool",
			Note: "Optional symbols for layered decorative accents.",
		})
	}

	search := publishedSearchDocument{
		ID:              card.ID,
		Title:           card.Title,
		Summary:         card.Summary,
		CategoryPrimary: card.CategoryPrimary,
		Difficulty:      card.Difficulty,
		Platforms:       card.Platforms,
		Tags:            card.Tags,
		HasDemo:         card.HasDemo,
		HasPrompt:       card.HasPrompt,
		FeaturedRank:    card.FeaturedRank,
		PublishedAt:     card.PublishedAt,
	}

	return publishedRecord{
		Visibility: "published",
		Card:       card,
		Detail:     detail,
		Search:     search,
	}, nil
}

func featuredRankForSnippet(snippetID string) int {
	if rank, ok := launchFeaturedRanks[snippetID]; ok {
		return rank
	}
	return 50
}

func loadPublishedEnvelope(path string) (publishedEnvelope, error) {
	bytes, err := os.ReadFile(path)
	if err != nil {
		return publishedEnvelope{}, fmt.Errorf("read published index: %w", err)
	}

	var envelope publishedEnvelope
	if err := json.Unmarshal(bytes, &envelope); err != nil {
		return publishedEnvelope{}, fmt.Errorf("parse published index: %w", err)
	}
	return envelope, nil
}

func loadVisibilityEnvelope(path string) (visibilityEnvelope, error) {
	bytes, err := os.ReadFile(path)
	if err != nil {
		return visibilityEnvelope{}, fmt.Errorf("read visibility index: %w", err)
	}

	var envelope visibilityEnvelope
	if err := json.Unmarshal(bytes, &envelope); err != nil {
		return visibilityEnvelope{}, fmt.Errorf("parse visibility index: %w", err)
	}
	return envelope, nil
}

func upsertPublishedRecord(envelope *publishedEnvelope, record publishedRecord) {
	for index, existing := range envelope.Items {
		if existing.Card.ID == record.Card.ID {
			envelope.Items[index] = record
			sortPublishedRecords(envelope.Items)
			return
		}
	}

	envelope.Items = append(envelope.Items, record)
	sortPublishedRecords(envelope.Items)
}

func upsertVisibilityRecord(envelope *visibilityEnvelope, record visibilityRecord) {
	for index, existing := range envelope.Items {
		if existing.ID == record.ID {
			envelope.Items[index] = record
			sortVisibilityRecords(envelope.Items)
			return
		}
	}

	envelope.Items = append(envelope.Items, record)
	sortVisibilityRecords(envelope.Items)
}

func extractSearchDocuments(items []publishedRecord) []publishedSearchDocument {
	documents := make([]publishedSearchDocument, 0, len(items))
	for _, item := range items {
		if item.Visibility != "published" {
			continue
		}
		documents = append(documents, item.Search)
	}

	sort.Slice(documents, func(i, j int) bool {
		if documents[i].FeaturedRank != documents[j].FeaturedRank {
			return documents[i].FeaturedRank < documents[j].FeaturedRank
		}
		return documents[i].ID < documents[j].ID
	})

	return documents
}

func sortPublishedRecords(items []publishedRecord) {
	sort.Slice(items, func(i, j int) bool {
		if items[i].Card.FeaturedRank != items[j].Card.FeaturedRank {
			return items[i].Card.FeaturedRank < items[j].Card.FeaturedRank
		}
		return items[i].Card.ID < items[j].Card.ID
	})
}

func sortVisibilityRecords(items []visibilityRecord) {
	sort.Slice(items, func(i, j int) bool {
		return items[i].ID < items[j].ID
	})
}

func writeJSONFile(path string, payload any) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("mkdir for %s: %w", path, err)
	}

	bytes, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal %s: %w", path, err)
	}
	bytes = append(bytes, '\n')

	if err := os.WriteFile(path, bytes, 0o644); err != nil {
		return fmt.Errorf("write %s: %w", path, err)
	}

	return nil
}

func loadCodeBlocks(snippetDir string) ([]publishedCodeBlock, error) {
	root := filepath.Join(snippetDir, "Code", "SwiftUI", "Sources")
	entries, err := os.ReadDir(root)
	if err != nil {
		return nil, fmt.Errorf("read code sources: %w", err)
	}

	blocks := make([]publishedCodeBlock, 0)
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".swift") {
			continue
		}

		fullPath := filepath.Join(root, entry.Name())
		content, err := os.ReadFile(fullPath)
		if err != nil {
			return nil, fmt.Errorf("read code block %s: %w", entry.Name(), err)
		}

		base := strings.TrimSuffix(strings.ToLower(entry.Name()), filepath.Ext(entry.Name()))
		blocks = append(blocks, publishedCodeBlock{
			ID:       sanitizeBlockID(base),
			Title:    entry.Name(),
			Language: "swift",
			Path:     filepath.ToSlash(filepath.Join("Code", "SwiftUI", "Sources", entry.Name())),
			Content:  string(content),
		})
	}

	sort.Slice(blocks, func(i, j int) bool {
		return blocks[i].Title < blocks[j].Title
	})
	return blocks, nil
}

func loadPromptBlocks(snippetDir string) ([]publishedPromptBlock, error) {
	root := filepath.Join(snippetDir, "Code", "Vibe")
	paths := []struct {
		filename string
		title    string
		format   string
	}{
		{filename: "prompt.md", title: "提示词模板", format: "markdown"},
		{filename: "prompt.yaml", title: "提示词配置", format: "yaml"},
		{filename: "acceptance.md", title: "验收清单", format: "markdown"},
	}

	blocks := make([]publishedPromptBlock, 0, len(paths))
	for _, item := range paths {
		fullPath := filepath.Join(root, item.filename)
		content, err := os.ReadFile(fullPath)
		if err != nil {
			if os.IsNotExist(err) {
				continue
			}
			return nil, fmt.Errorf("read prompt block %s: %w", item.filename, err)
		}

		base := strings.TrimSuffix(strings.ToLower(item.filename), filepath.Ext(item.filename))
		blocks = append(blocks, publishedPromptBlock{
			ID:      sanitizeBlockID(base),
			Title:   item.title,
			Format:  item.format,
			Path:    filepath.ToSlash(filepath.Join("Code", "Vibe", item.filename)),
			Content: string(content),
		})
	}

	return blocks, nil
}

func loadDisclosures(path string) ([]string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read disclosures: %w", err)
	}

	lines := strings.Split(string(content), "\n")
	disclosures := make([]string, 0)
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		disclosures = append(disclosures, line)
	}

	if len(disclosures) == 0 {
		disclosures = append(disclosures, "此片段未声明第三方依赖。")
	}
	return disclosures, nil
}

func assetURL(snippetID string, asset AssetRecord, fallbackName string) string {
	if asset.Path != "" {
		return "/published/" + strings.TrimLeft(asset.Path, "/")
	}
	return filepath.ToSlash(filepath.Join("/published", snippetID, fallbackName))
}

func sanitizeBlockID(value string) string {
	value = strings.ToLower(value)
	value = strings.ReplaceAll(value, "_", "-")
	value = strings.ReplaceAll(value, ".", "-")
	return value
}
