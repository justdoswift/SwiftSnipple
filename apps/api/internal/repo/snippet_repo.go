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

var ErrNotFound = errors.New("snippet not found")

type SnippetRepository struct {
	pool *pgxpool.Pool
}

func NewSnippetRepository(pool *pgxpool.Pool) *SnippetRepository {
	return &SnippetRepository{pool: pool}
}

func (r *SnippetRepository) List(ctx context.Context) ([]domain.Snippet, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, title, slug, excerpt, category, tags, cover_image, content, code, prompts, seo_title, seo_description, status, updated_at, published_at
		FROM snippets
		ORDER BY updated_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("query snippets: %w", err)
	}
	defer rows.Close()

	var snippets []domain.Snippet
	for rows.Next() {
		snippet, err := scanSnippet(rows)
		if err != nil {
			return nil, err
		}
		snippets = append(snippets, snippet)
	}

	return snippets, rows.Err()
}

func (r *SnippetRepository) GetByID(ctx context.Context, id string) (domain.Snippet, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, title, slug, excerpt, category, tags, cover_image, content, code, prompts, seo_title, seo_description, status, updated_at, published_at
		FROM snippets
		WHERE id = $1
	`, id)

	snippet, err := scanSnippet(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Snippet{}, ErrNotFound
		}
		return domain.Snippet{}, err
	}

	return snippet, nil
}

func (r *SnippetRepository) GetBySlug(ctx context.Context, slug string) (domain.Snippet, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, title, slug, excerpt, category, tags, cover_image, content, code, prompts, seo_title, seo_description, status, updated_at, published_at
		FROM snippets
		WHERE slug = $1
	`, slug)

	snippet, err := scanSnippet(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Snippet{}, ErrNotFound
		}
		return domain.Snippet{}, err
	}

	return snippet, nil
}

func (r *SnippetRepository) Create(ctx context.Context, payload domain.SnippetPayload) (domain.Snippet, error) {
	payload = payload.Normalize()
	id := uuid.NewString()

	row := r.pool.QueryRow(ctx, `
		INSERT INTO snippets (
			id, title, slug, excerpt, category, tags, cover_image, content, code, prompts, seo_title, seo_description, status, published_at, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
		)
		RETURNING id, title, slug, excerpt, category, tags, cover_image, content, code, prompts, seo_title, seo_description, status, updated_at, published_at
	`,
		id,
		payload.Title,
		payload.Slug,
		payload.Excerpt,
		payload.Category,
		payload.Tags,
		payload.CoverImage,
		payload.Content,
		payload.Code,
		payload.Prompts,
		payload.SEOTitle,
		payload.SEODescription,
		payload.Status,
		payload.PublishedAt,
	)

	return scanSnippet(row)
}

func (r *SnippetRepository) Update(ctx context.Context, id string, payload domain.SnippetPayload) (domain.Snippet, error) {
	payload = payload.Normalize()

	row := r.pool.QueryRow(ctx, `
		UPDATE snippets
		SET
			title = $2,
			slug = $3,
			excerpt = $4,
			category = $5,
			tags = $6,
			cover_image = $7,
			content = $8,
			code = $9,
			prompts = $10,
			seo_title = $11,
			seo_description = $12,
			status = $13,
			published_at = $14,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, title, slug, excerpt, category, tags, cover_image, content, code, prompts, seo_title, seo_description, status, updated_at, published_at
	`,
		id,
		payload.Title,
		payload.Slug,
		payload.Excerpt,
		payload.Category,
		payload.Tags,
		payload.CoverImage,
		payload.Content,
		payload.Code,
		payload.Prompts,
		payload.SEOTitle,
		payload.SEODescription,
		payload.Status,
		payload.PublishedAt,
	)

	snippet, err := scanSnippet(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Snippet{}, ErrNotFound
		}
		return domain.Snippet{}, err
	}

	return snippet, nil
}

func (r *SnippetRepository) Publish(ctx context.Context, id string) (domain.Snippet, error) {
	now := time.Now().UTC()
	row := r.pool.QueryRow(ctx, `
		UPDATE snippets
		SET
			status = 'Published',
			published_at = $2,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, title, slug, excerpt, category, tags, cover_image, content, code, prompts, seo_title, seo_description, status, updated_at, published_at
	`, id, now)

	snippet, err := scanSnippet(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Snippet{}, ErrNotFound
		}
		return domain.Snippet{}, err
	}

	return snippet, nil
}

func (r *SnippetRepository) Unpublish(ctx context.Context, id string) (domain.Snippet, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE snippets
		SET
			status = 'Draft',
			published_at = NULL,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, title, slug, excerpt, category, tags, cover_image, content, code, prompts, seo_title, seo_description, status, updated_at, published_at
	`, id)

	snippet, err := scanSnippet(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Snippet{}, ErrNotFound
		}
		return domain.Snippet{}, err
	}

	return snippet, nil
}

func (r *SnippetRepository) Delete(ctx context.Context, id string) error {
	commandTag, err := r.pool.Exec(ctx, `DELETE FROM snippets WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete snippet: %w", err)
	}

	if commandTag.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}

func scanSnippet(row interface {
	Scan(dest ...any) error
}) (domain.Snippet, error) {
	var snippet domain.Snippet
	if err := row.Scan(
		&snippet.ID,
		&snippet.Title,
		&snippet.Slug,
		&snippet.Excerpt,
		&snippet.Category,
		&snippet.Tags,
		&snippet.CoverImage,
		&snippet.Content,
		&snippet.Code,
		&snippet.Prompts,
		&snippet.SEOTitle,
		&snippet.SEODescription,
		&snippet.Status,
		&snippet.UpdatedAt,
		&snippet.PublishedAt,
	); err != nil {
		return domain.Snippet{}, err
	}

	snippet.Tags = sanitizeTags(snippet.Tags)
	return snippet, nil
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
