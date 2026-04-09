package repo

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"swiftsnipple/api/internal/domain"
)

var ErrNotFound = errors.New("article not found")

type ArticleRepository struct {
	pool *pgxpool.Pool
}

func NewArticleRepository(pool *pgxpool.Pool) *ArticleRepository {
	return &ArticleRepository{pool: pool}
}

func (r *ArticleRepository) List(ctx context.Context) ([]domain.Article, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, title, slug, excerpt, category, tags, cover_image, content, seo_title, seo_description, status, updated_at, published_at
		FROM articles
		ORDER BY updated_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("query articles: %w", err)
	}
	defer rows.Close()

	var articles []domain.Article
	for rows.Next() {
		article, err := scanArticle(rows)
		if err != nil {
			return nil, err
		}
		articles = append(articles, article)
	}

	return articles, rows.Err()
}

func (r *ArticleRepository) GetByID(ctx context.Context, id string) (domain.Article, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, title, slug, excerpt, category, tags, cover_image, content, seo_title, seo_description, status, updated_at, published_at
		FROM articles
		WHERE id = $1
	`, id)

	article, err := scanArticle(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Article{}, ErrNotFound
		}
		return domain.Article{}, err
	}

	return article, nil
}

func (r *ArticleRepository) Create(ctx context.Context, payload domain.ArticlePayload) (domain.Article, error) {
	payload = payload.Normalize()
	id := uuid.NewString()

	row := r.pool.QueryRow(ctx, `
		INSERT INTO articles (
			id, title, slug, excerpt, category, tags, cover_image, content, seo_title, seo_description, status, published_at, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
		)
		RETURNING id, title, slug, excerpt, category, tags, cover_image, content, seo_title, seo_description, status, updated_at, published_at
	`,
		id,
		payload.Title,
		payload.Slug,
		payload.Excerpt,
		payload.Category,
		payload.Tags,
		payload.CoverImage,
		payload.Content,
		payload.SEOTitle,
		payload.SEODescription,
		payload.Status,
		payload.PublishedAt,
	)

	return scanArticle(row)
}

func (r *ArticleRepository) Update(ctx context.Context, id string, payload domain.ArticlePayload) (domain.Article, error) {
	payload = payload.Normalize()

	row := r.pool.QueryRow(ctx, `
		UPDATE articles
		SET
			title = $2,
			slug = $3,
			excerpt = $4,
			category = $5,
			tags = $6,
			cover_image = $7,
			content = $8,
			seo_title = $9,
			seo_description = $10,
			status = $11,
			published_at = $12,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, title, slug, excerpt, category, tags, cover_image, content, seo_title, seo_description, status, updated_at, published_at
	`,
		id,
		payload.Title,
		payload.Slug,
		payload.Excerpt,
		payload.Category,
		payload.Tags,
		payload.CoverImage,
		payload.Content,
		payload.SEOTitle,
		payload.SEODescription,
		payload.Status,
		payload.PublishedAt,
	)

	article, err := scanArticle(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Article{}, ErrNotFound
		}
		return domain.Article{}, err
	}

	return article, nil
}

func (r *ArticleRepository) Publish(ctx context.Context, id string) (domain.Article, error) {
	now := time.Now().UTC()
	row := r.pool.QueryRow(ctx, `
		UPDATE articles
		SET
			status = 'Published',
			published_at = $2,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, title, slug, excerpt, category, tags, cover_image, content, seo_title, seo_description, status, updated_at, published_at
	`, id, now)

	article, err := scanArticle(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Article{}, ErrNotFound
		}
		return domain.Article{}, err
	}

	return article, nil
}

func scanArticle(row interface {
	Scan(dest ...any) error
}) (domain.Article, error) {
	var article domain.Article
	if err := row.Scan(
		&article.ID,
		&article.Title,
		&article.Slug,
		&article.Excerpt,
		&article.Category,
		&article.Tags,
		&article.CoverImage,
		&article.Content,
		&article.SEOTitle,
		&article.SEODescription,
		&article.Status,
		&article.UpdatedAt,
		&article.PublishedAt,
	); err != nil {
		return domain.Article{}, err
	}

	article.Tags = sanitizeTags(article.Tags)
	return article, nil
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
