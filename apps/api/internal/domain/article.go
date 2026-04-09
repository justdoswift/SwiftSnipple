package domain

import "time"

type ArticleStatus string

const (
	StatusDraft     ArticleStatus = "Draft"
	StatusInReview  ArticleStatus = "In Review"
	StatusScheduled ArticleStatus = "Scheduled"
	StatusPublished ArticleStatus = "Published"
)

type Article struct {
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
	Status         ArticleStatus `json:"status"`
	UpdatedAt      time.Time     `json:"updatedAt"`
	PublishedAt    *time.Time    `json:"publishedAt"`
}

type ArticlePayload struct {
	Title          string        `json:"title"`
	Slug           string        `json:"slug"`
	Excerpt        string        `json:"excerpt"`
	Category       string        `json:"category"`
	Tags           []string      `json:"tags"`
	CoverImage     string        `json:"coverImage"`
	Content        string        `json:"content"`
	SEOTitle       string        `json:"seoTitle"`
	SEODescription string        `json:"seoDescription"`
	Status         ArticleStatus `json:"status"`
	PublishedAt    *time.Time    `json:"publishedAt"`
}

func (p ArticlePayload) Normalize() ArticlePayload {
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
