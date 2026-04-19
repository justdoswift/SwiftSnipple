package domain

import (
	"strings"
	"time"
)

type AppLocale string
type SnippetStatus string
type SnippetAccessLevel string

const (
	LocaleEN AppLocale = "en"
	LocaleZH AppLocale = "zh"

	StatusDraft     SnippetStatus = "Draft"
	StatusPublished SnippetStatus = "Published"

	AccessLevelTeaser SnippetAccessLevel = "teaser"
	AccessLevelFull   SnippetAccessLevel = "full"
)

type SnippetLocalizedFields struct {
	Title          string   `json:"title"`
	Slug           string   `json:"slug"`
	Excerpt        string   `json:"excerpt"`
	Category       string   `json:"category"`
	Tags           []string `json:"tags"`
	Content        string   `json:"content"`
	Prompts        string   `json:"prompts"`
	SEOTitle       string   `json:"seoTitle"`
	SEODescription string   `json:"seoDescription"`
}

type SnippetLocales struct {
	EN SnippetLocalizedFields `json:"en"`
	ZH SnippetLocalizedFields `json:"zh"`
}

type Snippet struct {
	ID                   string             `json:"id"`
	CoverImage           string             `json:"coverImage"`
	Code                 string             `json:"code"`
	Status               SnippetStatus      `json:"status"`
	UpdatedAt            time.Time          `json:"updatedAt"`
	PublishedAt          *time.Time         `json:"publishedAt"`
	RequiresSubscription bool               `json:"requiresSubscription"`
	ViewerCanAccess      bool               `json:"viewerCanAccess"`
	Locked               bool               `json:"locked"`
	AccessLevel          SnippetAccessLevel `json:"accessLevel"`
	Locales              SnippetLocales     `json:"locales"`
}

type SnippetPayload struct {
	CoverImage           string         `json:"coverImage"`
	Code                 string         `json:"code"`
	Status               SnippetStatus  `json:"status"`
	PublishedAt          *time.Time     `json:"publishedAt"`
	RequiresSubscription bool           `json:"requiresSubscription"`
	Locales              SnippetLocales `json:"locales"`
}

func (p SnippetPayload) Normalize() SnippetPayload {
	if p.Status == "" {
		p.Status = StatusDraft
	}

	p.Locales.EN = normalizeLocalizedFields(p.Locales.EN)
	p.Locales.ZH = normalizeLocalizedFields(p.Locales.ZH)

	if !hasLocalizedValue(p.Locales.EN) && hasLocalizedValue(p.Locales.ZH) {
		p.Locales.EN = p.Locales.ZH
	}
	if !hasLocalizedValue(p.Locales.ZH) && hasLocalizedValue(p.Locales.EN) {
		p.Locales.ZH = p.Locales.EN
	}

	p.Locales.EN = normalizeLocalizedFields(p.Locales.EN)
	p.Locales.ZH = normalizeLocalizedFields(p.Locales.ZH)

	return p
}

func normalizeLocalizedFields(fields SnippetLocalizedFields) SnippetLocalizedFields {
	if fields.Category == "" {
		fields.Category = "Workflow"
	}
	fields.Tags = sanitizeTags(fields.Tags)
	return fields
}

func hasLocalizedValue(fields SnippetLocalizedFields) bool {
	return strings.TrimSpace(fields.Title) != "" ||
		strings.TrimSpace(fields.Slug) != "" ||
		strings.TrimSpace(fields.Excerpt) != "" ||
		strings.TrimSpace(fields.Content) != "" ||
		strings.TrimSpace(fields.Prompts) != "" ||
		len(fields.Tags) > 0
}

func (l SnippetLocales) ForLocale(locale AppLocale) SnippetLocalizedFields {
	if locale == LocaleZH {
		return l.ZH
	}
	return l.EN
}

func IsValidStatus(status SnippetStatus) bool {
	switch status {
	case StatusDraft, StatusPublished:
		return true
	default:
		return false
	}
}

func NormalizeStoredStatus(status SnippetStatus) SnippetStatus {
	switch status {
	case StatusPublished:
		return StatusPublished
	default:
		return StatusDraft
	}
}

func sanitizeTags(tags []string) []string {
	if len(tags) == 0 {
		return []string{}
	}

	cleaned := make([]string, 0, len(tags))
	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}
		cleaned = append(cleaned, tag)
	}

	return cleaned
}
