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

const snippetSelectColumns = `
	id,
	cover_image,
	code,
	status,
	updated_at,
	published_at,
	requires_subscription,
	title_en,
	slug_en,
	excerpt_en,
	category_en,
	tags_en,
	content_en,
	prompts_en,
	seo_title_en,
	seo_description_en,
	title_zh,
	slug_zh,
	excerpt_zh,
	category_zh,
	tags_zh,
	content_zh,
	prompts_zh,
	seo_title_zh,
	seo_description_zh
`

func (r *SnippetRepository) List(ctx context.Context) ([]domain.Snippet, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT `+snippetSelectColumns+`
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
		SELECT `+snippetSelectColumns+`
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
		SELECT `+snippetSelectColumns+`
		FROM snippets
		WHERE slug_en = $1 OR slug_zh = $1
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
				id,
				title,
			slug,
			excerpt,
			category,
			tags,
			cover_image,
			content,
			code,
			prompts,
			seo_title,
			seo_description,
			title_en,
			slug_en,
			excerpt_en,
			category_en,
			tags_en,
			content_en,
			prompts_en,
			seo_title_en,
			seo_description_en,
			title_zh,
			slug_zh,
			excerpt_zh,
			category_zh,
			tags_zh,
			content_zh,
			prompts_zh,
				seo_title_zh,
				seo_description_zh,
				status,
				published_at,
				requires_subscription,
				created_at,
				updated_at
			) VALUES (
			$1,
			$2,
			$3,
			$4,
			$5,
			$6,
			$7,
			$8,
			$9,
			$10,
			$11,
			$12,
			$13,
			$14,
			$15,
			$16,
			$17,
			$18,
			$19,
			$20,
			$21,
			$22,
			$23,
			$24,
			$25,
			$26,
			$27,
			$28,
			$29,
				$30,
				$31,
				$32,
				$33,
				NOW(),
				NOW()
			)
			RETURNING `+snippetSelectColumns,
		id,
		payload.Locales.EN.Title,
		payload.Locales.EN.Slug,
		payload.Locales.EN.Excerpt,
		payload.Locales.EN.Category,
		payload.Locales.EN.Tags,
		payload.CoverImage,
		payload.Locales.EN.Content,
		payload.Code,
		payload.Locales.EN.Prompts,
		payload.Locales.EN.SEOTitle,
		payload.Locales.EN.SEODescription,
		payload.Locales.EN.Title,
		payload.Locales.EN.Slug,
		payload.Locales.EN.Excerpt,
		payload.Locales.EN.Category,
		payload.Locales.EN.Tags,
		payload.Locales.EN.Content,
		payload.Locales.EN.Prompts,
		payload.Locales.EN.SEOTitle,
		payload.Locales.EN.SEODescription,
		payload.Locales.ZH.Title,
		payload.Locales.ZH.Slug,
		payload.Locales.ZH.Excerpt,
		payload.Locales.ZH.Category,
		payload.Locales.ZH.Tags,
		payload.Locales.ZH.Content,
		payload.Locales.ZH.Prompts,
			payload.Locales.ZH.SEOTitle,
			payload.Locales.ZH.SEODescription,
			payload.Status,
			payload.PublishedAt,
			payload.RequiresSubscription,
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
			title_en = $13,
			slug_en = $14,
			excerpt_en = $15,
			category_en = $16,
			tags_en = $17,
			content_en = $18,
			prompts_en = $19,
			seo_title_en = $20,
			seo_description_en = $21,
			title_zh = $22,
			slug_zh = $23,
			excerpt_zh = $24,
			category_zh = $25,
			tags_zh = $26,
			content_zh = $27,
			prompts_zh = $28,
				seo_title_zh = $29,
				seo_description_zh = $30,
				status = $31,
				published_at = $32,
				requires_subscription = $33,
				updated_at = NOW()
			WHERE id = $1
			RETURNING `+snippetSelectColumns,
		id,
		payload.Locales.EN.Title,
		payload.Locales.EN.Slug,
		payload.Locales.EN.Excerpt,
		payload.Locales.EN.Category,
		payload.Locales.EN.Tags,
		payload.CoverImage,
		payload.Locales.EN.Content,
		payload.Code,
		payload.Locales.EN.Prompts,
		payload.Locales.EN.SEOTitle,
		payload.Locales.EN.SEODescription,
		payload.Locales.EN.Title,
		payload.Locales.EN.Slug,
		payload.Locales.EN.Excerpt,
		payload.Locales.EN.Category,
		payload.Locales.EN.Tags,
		payload.Locales.EN.Content,
		payload.Locales.EN.Prompts,
		payload.Locales.EN.SEOTitle,
		payload.Locales.EN.SEODescription,
		payload.Locales.ZH.Title,
		payload.Locales.ZH.Slug,
		payload.Locales.ZH.Excerpt,
		payload.Locales.ZH.Category,
		payload.Locales.ZH.Tags,
		payload.Locales.ZH.Content,
		payload.Locales.ZH.Prompts,
			payload.Locales.ZH.SEOTitle,
			payload.Locales.ZH.SEODescription,
			payload.Status,
			payload.PublishedAt,
			payload.RequiresSubscription,
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
		RETURNING `+snippetSelectColumns, id, now)

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
		RETURNING `+snippetSelectColumns, id)

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
		&snippet.CoverImage,
		&snippet.Code,
		&snippet.Status,
		&snippet.UpdatedAt,
		&snippet.PublishedAt,
		&snippet.RequiresSubscription,
		&snippet.Locales.EN.Title,
		&snippet.Locales.EN.Slug,
		&snippet.Locales.EN.Excerpt,
		&snippet.Locales.EN.Category,
		&snippet.Locales.EN.Tags,
		&snippet.Locales.EN.Content,
		&snippet.Locales.EN.Prompts,
		&snippet.Locales.EN.SEOTitle,
		&snippet.Locales.EN.SEODescription,
		&snippet.Locales.ZH.Title,
		&snippet.Locales.ZH.Slug,
		&snippet.Locales.ZH.Excerpt,
		&snippet.Locales.ZH.Category,
		&snippet.Locales.ZH.Tags,
		&snippet.Locales.ZH.Content,
		&snippet.Locales.ZH.Prompts,
		&snippet.Locales.ZH.SEOTitle,
		&snippet.Locales.ZH.SEODescription,
	); err != nil {
		return domain.Snippet{}, err
	}

	snippet.Status = domain.NormalizeStoredStatus(snippet.Status)
	if snippet.Status != domain.StatusPublished {
		snippet.PublishedAt = nil
	}
	snippet.Locales.EN.Tags = sanitizeTags(snippet.Locales.EN.Tags)
	snippet.Locales.ZH.Tags = sanitizeTags(snippet.Locales.ZH.Tags)
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
