package domain

import "time"

type SnippetStatus string

const (
	StatusDraft     SnippetStatus = "Draft"
	StatusInReview  SnippetStatus = "In Review"
	StatusScheduled SnippetStatus = "Scheduled"
	StatusPublished SnippetStatus = "Published"
)

type Snippet struct {
	ID             string        `json:"id"`
	Title          string        `json:"title"`
	Slug           string        `json:"slug"`
	Excerpt        string        `json:"excerpt"`
	Category       string        `json:"category"`
	Tags           []string      `json:"tags"`
	CoverImage     string        `json:"coverImage"`
	Content        string        `json:"content"`
	SEOTitle       string        `json:"seoTitle"`
	SEODescription string        `json:"seoDescription"`
	Status         SnippetStatus `json:"status"`
	UpdatedAt      time.Time     `json:"updatedAt"`
	PublishedAt    *time.Time    `json:"publishedAt"`
}

type SnippetPayload struct {
	Title          string        `json:"title"`
	Slug           string        `json:"slug"`
	Excerpt        string        `json:"excerpt"`
	Category       string        `json:"category"`
	Tags           []string      `json:"tags"`
	CoverImage     string        `json:"coverImage"`
	Content        string        `json:"content"`
	SEOTitle       string        `json:"seoTitle"`
	SEODescription string        `json:"seoDescription"`
	Status         SnippetStatus `json:"status"`
	PublishedAt    *time.Time    `json:"publishedAt"`
}

func (p SnippetPayload) Normalize() SnippetPayload {
	if p.Category == "" {
		p.Category = "Workflow"
	}
	if p.Status == "" {
		p.Status = StatusDraft
	}
	if p.Tags == nil {
		p.Tags = []string{}
	}

	return p
}

func IsValidStatus(status SnippetStatus) bool {
	switch status {
	case StatusDraft, StatusInReview, StatusScheduled, StatusPublished:
		return true
	default:
		return false
	}
}
