package discovery

type Platform struct {
	OS         string `json:"os"`
	MinVersion string `json:"minVersion"`
}

type Media struct {
	CoverURL string `json:"coverUrl"`
	DemoURL  string `json:"demoUrl,omitempty"`
}

type CodeBlock struct {
	ID       string `json:"id"`
	Filename string `json:"filename"`
	Language string `json:"language"`
	Content  string `json:"content"`
}

type PromptBlock struct {
	ID      string `json:"id"`
	Kind    string `json:"kind"`
	Content string `json:"content"`
}

type License struct {
	Code             string `json:"code"`
	Media            string `json:"media"`
	ThirdPartyNotice string `json:"thirdPartyNotice"`
}

type FeedItem struct {
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

type FeedResponse struct {
	Items []FeedItem `json:"items"`
}

type FacetCounts struct {
	Category   map[string]int `json:"category"`
	Difficulty map[string]int `json:"difficulty"`
	Platform   map[string]int `json:"platform"`
	HasDemo    map[string]int `json:"hasDemo"`
	HasPrompt  map[string]int `json:"hasPrompt"`
}

type SearchQuery struct {
	Q          string `json:"q"`
	Category   string `json:"category"`
	Difficulty string `json:"difficulty"`
	Platform   string `json:"platform"`
	HasDemo    *bool  `json:"hasDemo,omitempty"`
	HasPrompt  *bool  `json:"hasPrompt,omitempty"`
}

type SearchResult struct {
	FeedItem
	Score int `json:"score"`
}

type SearchResponse struct {
	Query    SearchQuery    `json:"query"`
	Total    int            `json:"total"`
	Items    []SearchResult `json:"items"`
	Fallback []FeedItem     `json:"fallback,omitempty"`
	Facets   FacetCounts    `json:"facets"`
}

type DetailResponse struct {
	ID              string        `json:"id"`
	Title           string        `json:"title"`
	Summary         string        `json:"summary"`
	CategoryPrimary string        `json:"categoryPrimary"`
	Difficulty      string        `json:"difficulty"`
	Platforms       []Platform    `json:"platforms"`
	Tags            []string      `json:"tags"`
	Media           Media         `json:"media"`
	HasDemo         bool          `json:"hasDemo"`
	HasPrompt       bool          `json:"hasPrompt"`
	FeaturedRank    int           `json:"featuredRank"`
	PublishedAt     string        `json:"publishedAt"`
	CodeBlocks      []CodeBlock   `json:"codeBlocks"`
	PromptBlocks    []PromptBlock `json:"promptBlocks"`
	License         License       `json:"license"`
	Dependencies    []string      `json:"dependencies"`
}

type NotPublicError struct {
	ID string
}

func (e NotPublicError) Error() string {
	return "snippet is not public: " + e.ID
}
