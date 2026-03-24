package discovery

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/justdoswift/SwiftSnipple/apps/api/internal/cache"
)

type repository interface {
	LoadFeed(ctx context.Context) ([]FeedItem, error)
	Search(ctx context.Context, query SearchQuery) ([]SearchResult, FacetCounts, error)
	LoadDetail(ctx context.Context, id string) (DetailResponse, error)
	CheckVisibility(ctx context.Context, id string) (string, error)
}

type responseCache interface {
	Get(key string) (any, bool)
	Set(key string, value any, ttl time.Duration)
}

type Service struct {
	repo  repository
	cache responseCache
	ttl   time.Duration
}

const feedSortSignal = "featuredRank ASC, publishedAt DESC"

func NewService(repo repository, responseCache responseCache, ttl time.Duration) *Service {
	if responseCache == nil {
		responseCache = cache.NewMemory()
	}
	return &Service{
		repo:  repo,
		cache: responseCache,
		ttl:   ttl,
	}
}

func (s *Service) Feed(ctx context.Context) (FeedResponse, error) {
	cacheKey := "feed"
	if cached, ok := s.cache.Get(cacheKey); ok {
		if response, ok := cached.(FeedResponse); ok {
			return response, nil
		}
	}

	items, err := s.repo.LoadFeed(ctx)
	if err != nil {
		return FeedResponse{}, err
	}

	sortFeed(items)
	response := FeedResponse{Items: cloneFeedItems(items)}
	s.cache.Set(cacheKey, response, s.ttl)
	return response, nil
}

func (s *Service) Search(ctx context.Context, query SearchQuery) (SearchResponse, error) {
	cacheKey := "search:" + searchCacheSuffix(query)
	if cached, ok := s.cache.Get(cacheKey); ok {
		if response, ok := cached.(SearchResponse); ok {
			return response, nil
		}
	}

	results, facets, err := s.repo.Search(ctx, query)
	if err != nil {
		return SearchResponse{}, err
	}

	if keyword := strings.TrimSpace(query.Q); keyword != "" {
		filtered := results[:0]
		for _, result := range results {
			if result.Score > 0 {
				filtered = append(filtered, result)
			}
		}
		results = filtered
	}

	sortSearch(results)
	response := SearchResponse{
		Query:  query,
		Total:  len(results),
		Items:  cloneSearchResults(results),
		Facets: cloneFacets(facets),
	}

	if len(results) == 0 {
		feed, err := s.repo.LoadFeed(ctx)
		if err != nil {
			return SearchResponse{}, err
		}
		sortFeed(feed)
		response.Fallback = firstN(feed, 3) // <= 3 fallback cards for zero-result recovery.
	}

	s.cache.Set(cacheKey, response, s.ttl)
	return response, nil
}

func (s *Service) Detail(ctx context.Context, id string) (DetailResponse, error) {
	cacheKey := "detail:" + id
	if cached, ok := s.cache.Get(cacheKey); ok {
		if response, ok := cached.(DetailResponse); ok {
			return response, nil
		}
	}

	visibility, err := s.repo.CheckVisibility(ctx, id)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return DetailResponse{}, ErrNotFound
		}
		return DetailResponse{}, err
	}

	if visibility == "not_public" {
		return DetailResponse{}, NotPublicError{ID: id}
	}

	detail, err := s.repo.LoadDetail(ctx, id)
	if err != nil {
		return DetailResponse{}, err
	}

	s.cache.Set(cacheKey, detail, s.ttl)
	return detail, nil
}

func sortFeed(items []FeedItem) {
	sort.Slice(items, func(i, j int) bool {
		if items[i].FeaturedRank != items[j].FeaturedRank {
			return items[i].FeaturedRank < items[j].FeaturedRank
		}
		return publishedAtUnix(items[i].PublishedAt) > publishedAtUnix(items[j].PublishedAt)
	})
}

func sortSearch(items []SearchResult) {
	sort.Slice(items, func(i, j int) bool {
		if items[i].Score != items[j].Score {
			return items[i].Score > items[j].Score
		}
		if items[i].FeaturedRank != items[j].FeaturedRank {
			return items[i].FeaturedRank < items[j].FeaturedRank
		}
		return publishedAtUnix(items[i].PublishedAt) > publishedAtUnix(items[j].PublishedAt)
	})
}

func publishedAtUnix(value string) int64 {
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return 0
	}
	return parsed.Unix()
}

func firstN(items []FeedItem, limit int) []FeedItem {
	if limit > len(items) {
		limit = len(items)
	}

	cloned := make([]FeedItem, limit)
	copy(cloned, items[:limit])
	return cloned
}

func searchCacheSuffix(query SearchQuery) string {
	values := url.Values{}
	if query.Q != "" {
		values.Set("q", query.Q)
	}
	if query.Category != "" {
		values.Set("category", query.Category)
	}
	if query.Difficulty != "" {
		values.Set("difficulty", query.Difficulty)
	}
	if query.Platform != "" {
		values.Set("platform", query.Platform)
	}
	if query.HasDemo != nil {
		values.Set("hasDemo", fmt.Sprintf("%t", *query.HasDemo))
	}
	if query.HasPrompt != nil {
		values.Set("hasPrompt", fmt.Sprintf("%t", *query.HasPrompt))
	}
	return values.Encode()
}

func cloneFeedItems(items []FeedItem) []FeedItem {
	cloned := make([]FeedItem, len(items))
	copy(cloned, items)
	return cloned
}

func cloneSearchResults(items []SearchResult) []SearchResult {
	cloned := make([]SearchResult, len(items))
	copy(cloned, items)
	return cloned
}

func cloneFacets(facets FacetCounts) FacetCounts {
	return FacetCounts{
		Category:   cloneFacetMap(facets.Category),
		Difficulty: cloneFacetMap(facets.Difficulty),
		Platform:   cloneFacetMap(facets.Platform),
		HasDemo:    cloneFacetMap(facets.HasDemo),
		HasPrompt:  cloneFacetMap(facets.HasPrompt),
	}
}

func cloneFacetMap(input map[string]int) map[string]int {
	output := make(map[string]int, len(input))
	for key, value := range input {
		output[key] = value
	}
	return output
}
