package discovery

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/justdoswift/SwiftSnipple/apps/api/internal/config"
)

var ErrNotFound = errors.New("snippet not found")

const (
	defaultPublishedIndexPath  = "content/published/snippets.json"
	defaultVisibilityIndexPath = "content/published/visibility.json"
)

type Repository struct {
	cfg  config.Config
	once sync.Once

	loadErr    error
	feed       []FeedItem
	details    map[string]DetailResponse
	searchDocs []searchDocument
	visibility map[string]string
}

type publishedEnvelope struct {
	Items []publishedRecord `json:"items"`
}

type publishedRecord struct {
	Visibility string          `json:"visibility"`
	Card       publishedCard   `json:"card"`
	Detail     publishedDetail `json:"detail"`
	Search     publishedSearch `json:"search"`
}

type publishedCard struct {
	ID              string     `json:"id"`
	Title           string     `json:"title"`
	Summary         string     `json:"summary"`
	CategoryPrimary string     `json:"categoryPrimary"`
	Difficulty      string     `json:"difficulty"`
	Platforms       []Platform `json:"platforms"`
	Tags            []string   `json:"tags"`
	Media           Media      `json:"media"`
	HasDemo         bool       `json:"hasDemo"`
	HasPrompt       bool       `json:"hasPrompt"`
	FeaturedRank    int        `json:"featuredRank"`
	PublishedAt     string     `json:"publishedAt"`
}

type publishedDetail struct {
	publishedCard
	CodeBlocks   []publishedCodeBlock   `json:"codeBlocks"`
	PromptBlocks []publishedPromptBlock `json:"promptBlocks"`
	License      publishedLicense       `json:"license"`
	Dependencies []publishedDependency  `json:"dependencies"`
}

type publishedSearch struct {
	ID              string     `json:"id"`
	Title           string     `json:"title"`
	Summary         string     `json:"summary"`
	CategoryPrimary string     `json:"categoryPrimary"`
	Difficulty      string     `json:"difficulty"`
	Platforms       []Platform `json:"platforms"`
	Tags            []string   `json:"tags"`
	HasDemo         bool       `json:"hasDemo"`
	HasPrompt       bool       `json:"hasPrompt"`
	FeaturedRank    int        `json:"featuredRank"`
	PublishedAt     string     `json:"publishedAt"`
}

type publishedCodeBlock struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Language string `json:"language"`
	Content  string `json:"content"`
}

type publishedPromptBlock struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

type publishedLicense struct {
	Code                 string `json:"code"`
	Media                string `json:"media"`
	ThirdPartyNoticePath string `json:"thirdPartyNoticePath"`
}

type publishedDependency struct {
	Name string `json:"name"`
}

type visibilityEnvelope struct {
	Items []visibilityRecord `json:"items"`
}

type visibilityRecord struct {
	ID         string `json:"id"`
	Visibility string `json:"visibility"`
}

type searchDocument struct {
	FeedItem
	TitleText   string
	SummaryText string
	TagText     []string
}

func NewRepository(cfg config.Config) *Repository {
	return &Repository{cfg: cfg}
}

func (r *Repository) LoadFeed(ctx context.Context) ([]FeedItem, error) {
	if err := r.ensureLoaded(ctx); err != nil {
		return nil, err
	}

	items := make([]FeedItem, len(r.feed))
	copy(items, r.feed)
	return items, nil
}

func (r *Repository) Search(ctx context.Context, query SearchQuery) ([]SearchResult, FacetCounts, error) {
	if err := r.ensureLoaded(ctx); err != nil {
		return nil, FacetCounts{}, err
	}

	results := make([]SearchResult, 0, len(r.searchDocs))
	facets := FacetCounts{
		Category:   map[string]int{},
		Difficulty: map[string]int{},
		Platform:   map[string]int{},
		HasDemo:    map[string]int{},
		HasPrompt:  map[string]int{},
	}

	for _, doc := range r.searchDocs {
		if !matchesQuery(doc.FeedItem, query) {
			continue
		}

		facets.Category[doc.CategoryPrimary]++
		facets.Difficulty[doc.Difficulty]++
		for _, platform := range doc.Platforms {
			facets.Platform[platform.OS]++
		}
		facets.HasDemo[boolKey(doc.HasDemo)]++
		facets.HasPrompt[boolKey(doc.HasPrompt)]++

		results = append(results, SearchResult{
			FeedItem: doc.FeedItem,
			Score:    searchScore(doc, query.Q),
		})
	}

	return results, facets, nil
}

func (r *Repository) LoadDetail(ctx context.Context, id string) (DetailResponse, error) {
	if err := r.ensureLoaded(ctx); err != nil {
		return DetailResponse{}, err
	}

	detail, ok := r.details[id]
	if !ok {
		return DetailResponse{}, ErrNotFound
	}

	return detail, nil
}

func (r *Repository) CheckVisibility(ctx context.Context, id string) (string, error) {
	if err := r.ensureLoaded(ctx); err != nil {
		return "", err
	}

	visibility, ok := r.visibility[id]
	if !ok {
		return "", ErrNotFound
	}

	return visibility, nil
}

func (r *Repository) ensureLoaded(ctx context.Context) error {
	r.once.Do(func() {
		r.loadErr = r.load(ctx)
	})
	return r.loadErr
}

func (r *Repository) Invalidate() {
	r.once = sync.Once{}
	r.loadErr = nil
	r.feed = nil
	r.details = nil
	r.searchDocs = nil
	r.visibility = nil
}

func (r *Repository) load(ctx context.Context) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	snippetPath, err := resolveProjectPath(firstNonEmpty(r.cfg.PublishedIndexPath, defaultPublishedIndexPath))
	if err != nil {
		return err
	}

	visibilityPath, err := resolveProjectPath(firstNonEmpty(r.cfg.VisibilityIndexPath, defaultVisibilityIndexPath))
	if err != nil {
		return err
	}

	snippetBytes, err := os.ReadFile(snippetPath)
	if err != nil {
		return fmt.Errorf("read published index: %w", err)
	}

	visibilityBytes, err := os.ReadFile(visibilityPath)
	if err != nil {
		return fmt.Errorf("read visibility index: %w", err)
	}

	var snippetEnvelope publishedEnvelope
	if err := json.Unmarshal(snippetBytes, &snippetEnvelope); err != nil {
		return fmt.Errorf("parse published index: %w", err)
	}

	var visibilityEnvelope visibilityEnvelope
	if err := json.Unmarshal(visibilityBytes, &visibilityEnvelope); err != nil {
		return fmt.Errorf("parse visibility index: %w", err)
	}

	r.feed = make([]FeedItem, 0, len(snippetEnvelope.Items))
	r.details = make(map[string]DetailResponse, len(snippetEnvelope.Items))
	r.searchDocs = make([]searchDocument, 0, len(snippetEnvelope.Items))
	r.visibility = make(map[string]string, len(visibilityEnvelope.Items))

	for _, record := range visibilityEnvelope.Items {
		r.visibility[record.ID] = record.Visibility
	}

	for _, record := range snippetEnvelope.Items {
		if record.Visibility != "published" {
			continue
		}

		item := FeedItem{
			ID:              record.Card.ID,
			Title:           record.Card.Title,
			Summary:         record.Card.Summary,
			CategoryPrimary: record.Card.CategoryPrimary,
			Difficulty:      record.Card.Difficulty,
			Platforms:       record.Card.Platforms,
			Tags:            record.Card.Tags,
			Media:           record.Card.Media,
			HasDemo:         record.Card.HasDemo,
			HasPrompt:       record.Card.HasPrompt,
			FeaturedRank:    record.Card.FeaturedRank,
			PublishedAt:     record.Card.PublishedAt,
		}
		r.feed = append(r.feed, item)
		r.searchDocs = append(r.searchDocs, searchDocument{
			FeedItem:    item,
			TitleText:   record.Search.Title,
			SummaryText: record.Search.Summary,
			TagText:     record.Search.Tags,
		})

		detail := DetailResponse{
			ID:              record.Detail.ID,
			Title:           record.Detail.Title,
			Summary:         record.Detail.Summary,
			CategoryPrimary: record.Detail.CategoryPrimary,
			Difficulty:      record.Detail.Difficulty,
			Platforms:       record.Detail.Platforms,
			Tags:            record.Detail.Tags,
			Media:           record.Detail.Media,
			HasDemo:         record.Detail.HasDemo,
			HasPrompt:       record.Detail.HasPrompt,
			FeaturedRank:    record.Detail.FeaturedRank,
			PublishedAt:     record.Detail.PublishedAt,
			CodeBlocks:      make([]CodeBlock, 0, len(record.Detail.CodeBlocks)),
			PromptBlocks:    make([]PromptBlock, 0, len(record.Detail.PromptBlocks)),
			License: License{
				Code:             record.Detail.License.Code,
				Media:            record.Detail.License.Media,
				ThirdPartyNotice: record.Detail.License.ThirdPartyNoticePath,
			},
			Dependencies: make([]string, 0, len(record.Detail.Dependencies)),
		}

		for _, block := range record.Detail.CodeBlocks {
			detail.CodeBlocks = append(detail.CodeBlocks, CodeBlock{
				ID:       block.ID,
				Filename: block.Title,
				Language: block.Language,
				Content:  block.Content,
			})
		}

		for _, block := range record.Detail.PromptBlocks {
			kind := "prompt"
			if strings.Contains(strings.ToLower(block.Title), "acceptance") {
				kind = "acceptance"
			}
			detail.PromptBlocks = append(detail.PromptBlocks, PromptBlock{
				ID:      block.ID,
				Kind:    kind,
				Content: block.Content,
			})
		}

		for _, dependency := range record.Detail.Dependencies {
			detail.Dependencies = append(detail.Dependencies, dependency.Name)
		}

		r.details[detail.ID] = detail
	}

	return nil
}

func matchesQuery(item FeedItem, query SearchQuery) bool {
	if query.Category != "" && item.CategoryPrimary != query.Category {
		return false
	}
	if query.Difficulty != "" && item.Difficulty != query.Difficulty {
		return false
	}
	if query.Platform != "" && !hasPlatform(item.Platforms, query.Platform) {
		return false
	}
	if query.HasDemo != nil && item.HasDemo != *query.HasDemo {
		return false
	}
	if query.HasPrompt != nil && item.HasPrompt != *query.HasPrompt {
		return false
	}
	return true
}

func hasPlatform(platforms []Platform, platform string) bool {
	for _, value := range platforms {
		if strings.EqualFold(value.OS, platform) {
			return true
		}
	}
	return false
}

func searchScore(doc searchDocument, keyword string) int {
	keyword = strings.TrimSpace(strings.ToLower(keyword))
	if keyword == "" {
		return 0
	}

	score := 0
	score += 3 * strings.Count(strings.ToLower(doc.TitleText), keyword)
	score += strings.Count(strings.ToLower(doc.SummaryText), keyword)
	for _, tag := range doc.TagText {
		score += 2 * strings.Count(strings.ToLower(tag), keyword)
	}
	return score
}

func boolKey(value bool) string {
	if value {
		return "true"
	}
	return "false"
}

func resolveProjectPath(path string) (string, error) {
	if filepath.IsAbs(path) {
		return path, nil
	}

	wd, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("resolve %s: %w", path, err)
	}

	current := wd
	for {
		candidate := filepath.Join(current, path)
		if _, err := os.Stat(candidate); err == nil {
			return candidate, nil
		}

		parent := filepath.Dir(current)
		if parent == current {
			break
		}
		current = parent
	}

	return "", fmt.Errorf("resolve %s: file not found", path)
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
