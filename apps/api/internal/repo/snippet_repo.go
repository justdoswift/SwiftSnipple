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

const fullSnippetSelectColumns = `
	id,
	cover_image,
	cover_image_dark,
	cover_image_light,
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
	seo_description_zh,
	draft_cover_image,
	draft_cover_image_dark,
	draft_cover_image_light,
	draft_code,
	draft_requires_subscription,
	draft_title_en,
	draft_slug_en,
	draft_excerpt_en,
	draft_category_en,
	draft_tags_en,
	draft_content_en,
	draft_prompts_en,
	draft_seo_title_en,
	draft_seo_description_en,
	draft_title_zh,
	draft_slug_zh,
	draft_excerpt_zh,
	draft_category_zh,
	draft_tags_zh,
	draft_content_zh,
	draft_prompts_zh,
	draft_seo_title_zh,
	draft_seo_description_zh,
	has_unpublished_changes,
	draft_updated_at
`

type rawSnippetRecord struct {
	ID                   string
	CoverImage           string
	CoverImageDark       string
	CoverImageLight      string
	Code                 string
	Status               domain.SnippetStatus
	UpdatedAt            time.Time
	PublishedAt          *time.Time
	RequiresSubscription bool
	Locales              domain.SnippetLocales

	DraftCoverImage           string
	DraftCoverImageDark       string
	DraftCoverImageLight      string
	DraftCode                 string
	DraftRequiresSubscription bool
	DraftLocales              domain.SnippetLocales
	HasUnpublishedChanges     bool
	DraftUpdatedAt            *time.Time
}

func (r rawSnippetRecord) liveSnippet() domain.Snippet {
	snippet := domain.Snippet{
		ID:                    r.ID,
		CoverImage:            resolveCoverImage(r.CoverImageDark, r.CoverImageLight, r.CoverImage),
		CoverImageDark:        r.CoverImageDark,
		CoverImageLight:       r.CoverImageLight,
		Code:                  r.Code,
		Status:                domain.NormalizeStoredStatus(r.Status),
		UpdatedAt:             r.UpdatedAt,
		PublishedAt:           r.PublishedAt,
		LivePublishedAt:       r.PublishedAt,
		RequiresSubscription:  r.RequiresSubscription,
		Locales:               normalizeLocales(r.Locales),
		HasUnpublishedChanges: r.HasUnpublishedChanges,
		DraftUpdatedAt:        r.DraftUpdatedAt,
	}
	if snippet.Status != domain.StatusPublished {
		snippet.PublishedAt = nil
		snippet.LivePublishedAt = nil
	}
	snippet.AvailableLocales = domain.AvailableLocalesFor(snippet.Locales)
	return snippet
}

func (r rawSnippetRecord) editableSnippet() domain.Snippet {
	if r.Status == domain.StatusPublished && r.HasUnpublishedChanges {
		snippet := domain.Snippet{
			ID:                    r.ID,
			CoverImage:            resolveCoverImage(r.DraftCoverImageDark, r.DraftCoverImageLight, firstNonEmpty(r.DraftCoverImage, r.CoverImage)),
			CoverImageDark:        r.DraftCoverImageDark,
			CoverImageLight:       r.DraftCoverImageLight,
			Code:                  r.DraftCode,
			Status:                domain.StatusPublished,
			UpdatedAt:             draftUpdatedAtOrFallback(r.DraftUpdatedAt, r.UpdatedAt),
			PublishedAt:           r.PublishedAt,
			LivePublishedAt:       r.PublishedAt,
			RequiresSubscription:  r.DraftRequiresSubscription,
			Locales:               normalizeLocales(r.DraftLocales),
			HasUnpublishedChanges: true,
			DraftUpdatedAt:        r.DraftUpdatedAt,
		}
		snippet.AvailableLocales = domain.AvailableLocalesFor(snippet.Locales)
		return snippet
	}

	return r.liveSnippet()
}

func (r rawSnippetRecord) previewSnippet() domain.Snippet {
	if r.HasUnpublishedChanges {
		return r.editableSnippet()
	}
	return r.liveSnippet()
}

func draftUpdatedAtOrFallback(draftUpdatedAt *time.Time, fallback time.Time) time.Time {
	if draftUpdatedAt != nil {
		return *draftUpdatedAt
	}
	return fallback
}

func resolveCoverImage(primary, secondary, legacy string) string {
	return firstNonEmpty(primary, secondary, legacy)
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func (r *SnippetRepository) List(ctx context.Context) ([]domain.Snippet, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT `+fullSnippetSelectColumns+`
		FROM snippets
		ORDER BY updated_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("query snippets: %w", err)
	}
	defer rows.Close()

	var snippets []domain.Snippet
	for rows.Next() {
		record, err := scanRawSnippet(rows)
		if err != nil {
			return nil, err
		}
		snippets = append(snippets, record.liveSnippet())
	}

	return snippets, rows.Err()
}

func (r *SnippetRepository) ListAdmin(ctx context.Context) ([]domain.Snippet, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT `+fullSnippetSelectColumns+`
		FROM snippets
		ORDER BY updated_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("query snippets: %w", err)
	}
	defer rows.Close()

	var snippets []domain.Snippet
	for rows.Next() {
		record, err := scanRawSnippet(rows)
		if err != nil {
			return nil, err
		}
		snippets = append(snippets, record.editableSnippet())
	}

	return snippets, rows.Err()
}

func (r *SnippetRepository) GetByID(ctx context.Context, id string) (domain.Snippet, error) {
	record, err := r.getRawByID(ctx, id)
	if err != nil {
		return domain.Snippet{}, err
	}
	return record.liveSnippet(), nil
}

func (r *SnippetRepository) GetAdminByID(ctx context.Context, id string) (domain.Snippet, error) {
	record, err := r.getRawByID(ctx, id)
	if err != nil {
		return domain.Snippet{}, err
	}
	return record.editableSnippet(), nil
}

func (r *SnippetRepository) GetBySlug(ctx context.Context, slug string) (domain.Snippet, error) {
	record, err := r.getRawByLiveSlug(ctx, slug)
	if err != nil {
		return domain.Snippet{}, err
	}
	return record.liveSnippet(), nil
}

func (r *SnippetRepository) GetPreviewByID(ctx context.Context, id string) (domain.Snippet, error) {
	record, err := r.getRawByID(ctx, id)
	if err != nil {
		return domain.Snippet{}, err
	}
	return record.previewSnippet(), nil
}

func (r *SnippetRepository) GetPreviewBySlug(ctx context.Context, slug string) (domain.Snippet, error) {
	record, err := r.getRawByPreviewSlug(ctx, slug)
	if err != nil {
		return domain.Snippet{}, err
	}
	return record.previewSnippet(), nil
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
			cover_image_dark,
			cover_image_light,
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
			draft_cover_image,
			draft_cover_image_dark,
			draft_cover_image_light,
			draft_code,
			draft_requires_subscription,
			draft_title_en,
			draft_slug_en,
			draft_excerpt_en,
			draft_category_en,
			draft_tags_en,
			draft_content_en,
			draft_prompts_en,
			draft_seo_title_en,
			draft_seo_description_en,
			draft_title_zh,
			draft_slug_zh,
			draft_excerpt_zh,
			draft_category_zh,
			draft_tags_zh,
			draft_content_zh,
			draft_prompts_zh,
			draft_seo_title_zh,
			draft_seo_description_zh,
			status,
			published_at,
			requires_subscription,
			has_unpublished_changes,
			draft_updated_at,
			created_at,
			updated_at
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
			$15,$16,$17,$18,$19,$20,$21,$22,$23,
			$24,$25,$26,$27,$28,$29,$30,$31,$32,
			$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,
			$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,
			$57,$58,$59,FALSE,NULL,NOW(),NOW()
		)
		RETURNING `+fullSnippetSelectColumns,
		id,
		payload.Locales.EN.Title,
		payload.Locales.EN.Slug,
		payload.Locales.EN.Excerpt,
		payload.Locales.EN.Category,
		payload.Locales.EN.Tags,
		"",
		payload.CoverImageDark,
		payload.CoverImageLight,
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
		"",
		payload.CoverImageDark,
		payload.CoverImageLight,
		payload.Code,
		payload.RequiresSubscription,
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

	record, err := scanRawSnippet(row)
	if err != nil {
		return domain.Snippet{}, err
	}
	return record.editableSnippet(), nil
}

func (r *SnippetRepository) Update(ctx context.Context, id string, payload domain.SnippetPayload) (domain.Snippet, error) {
	existing, err := r.getRawByID(ctx, id)
	if err != nil {
		return domain.Snippet{}, err
	}

	payload = payload.Normalize()

	var row pgx.Row
	if existing.Status == domain.StatusPublished {
		row = r.pool.QueryRow(ctx, `
			UPDATE snippets
			SET
				draft_cover_image = $2,
				draft_cover_image_dark = $3,
				draft_cover_image_light = $4,
				draft_code = $5,
				draft_requires_subscription = $6,
				draft_title_en = $7,
				draft_slug_en = $8,
				draft_excerpt_en = $9,
				draft_category_en = $10,
				draft_tags_en = $11,
				draft_content_en = $12,
				draft_prompts_en = $13,
				draft_seo_title_en = $14,
				draft_seo_description_en = $15,
				draft_title_zh = $16,
				draft_slug_zh = $17,
				draft_excerpt_zh = $18,
				draft_category_zh = $19,
				draft_tags_zh = $20,
				draft_content_zh = $21,
				draft_prompts_zh = $22,
				draft_seo_title_zh = $23,
				draft_seo_description_zh = $24,
				has_unpublished_changes = TRUE,
				draft_updated_at = NOW(),
				updated_at = NOW()
			WHERE id = $1
			RETURNING `+fullSnippetSelectColumns,
			id,
			"",
			payload.CoverImageDark,
			payload.CoverImageLight,
			payload.Code,
			payload.RequiresSubscription,
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
		)
	} else {
		row = r.pool.QueryRow(ctx, `
			UPDATE snippets
			SET
				title = $2,
				slug = $3,
				excerpt = $4,
				category = $5,
				tags = $6,
				cover_image = $7,
				cover_image_dark = $8,
				cover_image_light = $9,
				content = $10,
				code = $11,
				prompts = $12,
				seo_title = $13,
				seo_description = $14,
				title_en = $15,
				slug_en = $16,
				excerpt_en = $17,
				category_en = $18,
				tags_en = $19,
				content_en = $20,
				prompts_en = $21,
				seo_title_en = $22,
				seo_description_en = $23,
				title_zh = $24,
				slug_zh = $25,
				excerpt_zh = $26,
				category_zh = $27,
				tags_zh = $28,
				content_zh = $29,
				prompts_zh = $30,
				seo_title_zh = $31,
				seo_description_zh = $32,
				draft_cover_image = $33,
				draft_cover_image_dark = $34,
				draft_cover_image_light = $35,
				draft_code = $36,
				draft_requires_subscription = $37,
				draft_title_en = $38,
				draft_slug_en = $39,
				draft_excerpt_en = $40,
				draft_category_en = $41,
				draft_tags_en = $42,
				draft_content_en = $43,
				draft_prompts_en = $44,
				draft_seo_title_en = $45,
				draft_seo_description_en = $46,
				draft_title_zh = $47,
				draft_slug_zh = $48,
				draft_excerpt_zh = $49,
				draft_category_zh = $50,
				draft_tags_zh = $51,
				draft_content_zh = $52,
				draft_prompts_zh = $53,
				draft_seo_title_zh = $54,
				draft_seo_description_zh = $55,
				status = $56,
				published_at = $57,
				requires_subscription = $37,
				has_unpublished_changes = FALSE,
				draft_updated_at = NULL,
				updated_at = NOW()
			WHERE id = $1
			RETURNING `+fullSnippetSelectColumns,
			id,
			payload.Locales.EN.Title,
			payload.Locales.EN.Slug,
			payload.Locales.EN.Excerpt,
			payload.Locales.EN.Category,
			payload.Locales.EN.Tags,
			"",
			payload.CoverImageDark,
			payload.CoverImageLight,
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
			"",
			payload.CoverImageDark,
			payload.CoverImageLight,
			payload.Code,
			payload.RequiresSubscription,
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
		)
	}

	record, err := scanRawSnippet(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Snippet{}, ErrNotFound
		}
		return domain.Snippet{}, err
	}

	return record.editableSnippet(), nil
}

func (r *SnippetRepository) Publish(ctx context.Context, id string) (domain.Snippet, error) {
	now := time.Now().UTC()
	row := r.pool.QueryRow(ctx, `
		UPDATE snippets
		SET
			title = CASE WHEN has_unpublished_changes THEN draft_title_en ELSE title END,
			slug = CASE WHEN has_unpublished_changes THEN draft_slug_en ELSE slug END,
			excerpt = CASE WHEN has_unpublished_changes THEN draft_excerpt_en ELSE excerpt END,
			category = CASE WHEN has_unpublished_changes THEN draft_category_en ELSE category END,
			tags = CASE WHEN has_unpublished_changes THEN draft_tags_en ELSE tags END,
			cover_image = CASE WHEN has_unpublished_changes THEN draft_cover_image ELSE cover_image END,
			cover_image_dark = CASE WHEN has_unpublished_changes THEN draft_cover_image_dark ELSE cover_image_dark END,
			cover_image_light = CASE WHEN has_unpublished_changes THEN draft_cover_image_light ELSE cover_image_light END,
			content = CASE WHEN has_unpublished_changes THEN draft_content_en ELSE content END,
			code = CASE WHEN has_unpublished_changes THEN draft_code ELSE code END,
			prompts = CASE WHEN has_unpublished_changes THEN draft_prompts_en ELSE prompts END,
			seo_title = CASE WHEN has_unpublished_changes THEN draft_seo_title_en ELSE seo_title END,
			seo_description = CASE WHEN has_unpublished_changes THEN draft_seo_description_en ELSE seo_description END,
			title_en = CASE WHEN has_unpublished_changes THEN draft_title_en ELSE title_en END,
			slug_en = CASE WHEN has_unpublished_changes THEN draft_slug_en ELSE slug_en END,
			excerpt_en = CASE WHEN has_unpublished_changes THEN draft_excerpt_en ELSE excerpt_en END,
			category_en = CASE WHEN has_unpublished_changes THEN draft_category_en ELSE category_en END,
			tags_en = CASE WHEN has_unpublished_changes THEN draft_tags_en ELSE tags_en END,
			content_en = CASE WHEN has_unpublished_changes THEN draft_content_en ELSE content_en END,
			prompts_en = CASE WHEN has_unpublished_changes THEN draft_prompts_en ELSE prompts_en END,
			seo_title_en = CASE WHEN has_unpublished_changes THEN draft_seo_title_en ELSE seo_title_en END,
			seo_description_en = CASE WHEN has_unpublished_changes THEN draft_seo_description_en ELSE seo_description_en END,
			title_zh = CASE WHEN has_unpublished_changes THEN draft_title_zh ELSE title_zh END,
			slug_zh = CASE WHEN has_unpublished_changes THEN draft_slug_zh ELSE slug_zh END,
			excerpt_zh = CASE WHEN has_unpublished_changes THEN draft_excerpt_zh ELSE excerpt_zh END,
			category_zh = CASE WHEN has_unpublished_changes THEN draft_category_zh ELSE category_zh END,
			tags_zh = CASE WHEN has_unpublished_changes THEN draft_tags_zh ELSE tags_zh END,
			content_zh = CASE WHEN has_unpublished_changes THEN draft_content_zh ELSE content_zh END,
			prompts_zh = CASE WHEN has_unpublished_changes THEN draft_prompts_zh ELSE prompts_zh END,
			seo_title_zh = CASE WHEN has_unpublished_changes THEN draft_seo_title_zh ELSE seo_title_zh END,
			seo_description_zh = CASE WHEN has_unpublished_changes THEN draft_seo_description_zh ELSE seo_description_zh END,
			requires_subscription = CASE WHEN has_unpublished_changes THEN draft_requires_subscription ELSE requires_subscription END,
			draft_cover_image = CASE WHEN has_unpublished_changes THEN draft_cover_image ELSE cover_image END,
			draft_cover_image_dark = CASE WHEN has_unpublished_changes THEN draft_cover_image_dark ELSE cover_image_dark END,
			draft_cover_image_light = CASE WHEN has_unpublished_changes THEN draft_cover_image_light ELSE cover_image_light END,
			draft_code = CASE WHEN has_unpublished_changes THEN draft_code ELSE code END,
			draft_requires_subscription = CASE WHEN has_unpublished_changes THEN draft_requires_subscription ELSE requires_subscription END,
			draft_title_en = CASE WHEN has_unpublished_changes THEN draft_title_en ELSE title_en END,
			draft_slug_en = CASE WHEN has_unpublished_changes THEN draft_slug_en ELSE slug_en END,
			draft_excerpt_en = CASE WHEN has_unpublished_changes THEN draft_excerpt_en ELSE excerpt_en END,
			draft_category_en = CASE WHEN has_unpublished_changes THEN draft_category_en ELSE category_en END,
			draft_tags_en = CASE WHEN has_unpublished_changes THEN draft_tags_en ELSE tags_en END,
			draft_content_en = CASE WHEN has_unpublished_changes THEN draft_content_en ELSE content_en END,
			draft_prompts_en = CASE WHEN has_unpublished_changes THEN draft_prompts_en ELSE prompts_en END,
			draft_seo_title_en = CASE WHEN has_unpublished_changes THEN draft_seo_title_en ELSE seo_title_en END,
			draft_seo_description_en = CASE WHEN has_unpublished_changes THEN draft_seo_description_en ELSE seo_description_en END,
			draft_title_zh = CASE WHEN has_unpublished_changes THEN draft_title_zh ELSE title_zh END,
			draft_slug_zh = CASE WHEN has_unpublished_changes THEN draft_slug_zh ELSE slug_zh END,
			draft_excerpt_zh = CASE WHEN has_unpublished_changes THEN draft_excerpt_zh ELSE excerpt_zh END,
			draft_category_zh = CASE WHEN has_unpublished_changes THEN draft_category_zh ELSE category_zh END,
			draft_tags_zh = CASE WHEN has_unpublished_changes THEN draft_tags_zh ELSE tags_zh END,
			draft_content_zh = CASE WHEN has_unpublished_changes THEN draft_content_zh ELSE content_zh END,
			draft_prompts_zh = CASE WHEN has_unpublished_changes THEN draft_prompts_zh ELSE prompts_zh END,
			draft_seo_title_zh = CASE WHEN has_unpublished_changes THEN draft_seo_title_zh ELSE seo_title_zh END,
			draft_seo_description_zh = CASE WHEN has_unpublished_changes THEN draft_seo_description_zh ELSE seo_description_zh END,
			status = 'Published',
			published_at = $2,
			has_unpublished_changes = FALSE,
			draft_updated_at = NULL,
			updated_at = NOW()
		WHERE id = $1
		RETURNING `+fullSnippetSelectColumns, id, now)

	record, err := scanRawSnippet(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Snippet{}, ErrNotFound
		}
		return domain.Snippet{}, err
	}

	return record.editableSnippet(), nil
}

func (r *SnippetRepository) Unpublish(ctx context.Context, id string) (domain.Snippet, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE snippets
		SET
			title = CASE WHEN has_unpublished_changes THEN draft_title_en ELSE title END,
			slug = CASE WHEN has_unpublished_changes THEN draft_slug_en ELSE slug END,
			excerpt = CASE WHEN has_unpublished_changes THEN draft_excerpt_en ELSE excerpt END,
			category = CASE WHEN has_unpublished_changes THEN draft_category_en ELSE category END,
			tags = CASE WHEN has_unpublished_changes THEN draft_tags_en ELSE tags END,
			cover_image = CASE WHEN has_unpublished_changes THEN draft_cover_image ELSE cover_image END,
			cover_image_dark = CASE WHEN has_unpublished_changes THEN draft_cover_image_dark ELSE cover_image_dark END,
			cover_image_light = CASE WHEN has_unpublished_changes THEN draft_cover_image_light ELSE cover_image_light END,
			content = CASE WHEN has_unpublished_changes THEN draft_content_en ELSE content END,
			code = CASE WHEN has_unpublished_changes THEN draft_code ELSE code END,
			prompts = CASE WHEN has_unpublished_changes THEN draft_prompts_en ELSE prompts END,
			seo_title = CASE WHEN has_unpublished_changes THEN draft_seo_title_en ELSE seo_title END,
			seo_description = CASE WHEN has_unpublished_changes THEN draft_seo_description_en ELSE seo_description END,
			title_en = CASE WHEN has_unpublished_changes THEN draft_title_en ELSE title_en END,
			slug_en = CASE WHEN has_unpublished_changes THEN draft_slug_en ELSE slug_en END,
			excerpt_en = CASE WHEN has_unpublished_changes THEN draft_excerpt_en ELSE excerpt_en END,
			category_en = CASE WHEN has_unpublished_changes THEN draft_category_en ELSE category_en END,
			tags_en = CASE WHEN has_unpublished_changes THEN draft_tags_en ELSE tags_en END,
			content_en = CASE WHEN has_unpublished_changes THEN draft_content_en ELSE content_en END,
			prompts_en = CASE WHEN has_unpublished_changes THEN draft_prompts_en ELSE prompts_en END,
			seo_title_en = CASE WHEN has_unpublished_changes THEN draft_seo_title_en ELSE seo_title_en END,
			seo_description_en = CASE WHEN has_unpublished_changes THEN draft_seo_description_en ELSE seo_description_en END,
			title_zh = CASE WHEN has_unpublished_changes THEN draft_title_zh ELSE title_zh END,
			slug_zh = CASE WHEN has_unpublished_changes THEN draft_slug_zh ELSE slug_zh END,
			excerpt_zh = CASE WHEN has_unpublished_changes THEN draft_excerpt_zh ELSE excerpt_zh END,
			category_zh = CASE WHEN has_unpublished_changes THEN draft_category_zh ELSE category_zh END,
			tags_zh = CASE WHEN has_unpublished_changes THEN draft_tags_zh ELSE tags_zh END,
			content_zh = CASE WHEN has_unpublished_changes THEN draft_content_zh ELSE content_zh END,
			prompts_zh = CASE WHEN has_unpublished_changes THEN draft_prompts_zh ELSE prompts_zh END,
			seo_title_zh = CASE WHEN has_unpublished_changes THEN draft_seo_title_zh ELSE seo_title_zh END,
			seo_description_zh = CASE WHEN has_unpublished_changes THEN draft_seo_description_zh ELSE seo_description_zh END,
			draft_cover_image = CASE WHEN has_unpublished_changes THEN draft_cover_image ELSE cover_image END,
			draft_cover_image_dark = CASE WHEN has_unpublished_changes THEN draft_cover_image_dark ELSE cover_image_dark END,
			draft_cover_image_light = CASE WHEN has_unpublished_changes THEN draft_cover_image_light ELSE cover_image_light END,
			draft_code = CASE WHEN has_unpublished_changes THEN draft_code ELSE code END,
			draft_requires_subscription = CASE WHEN has_unpublished_changes THEN draft_requires_subscription ELSE requires_subscription END,
			draft_title_en = CASE WHEN has_unpublished_changes THEN draft_title_en ELSE title_en END,
			draft_slug_en = CASE WHEN has_unpublished_changes THEN draft_slug_en ELSE slug_en END,
			draft_excerpt_en = CASE WHEN has_unpublished_changes THEN draft_excerpt_en ELSE excerpt_en END,
			draft_category_en = CASE WHEN has_unpublished_changes THEN draft_category_en ELSE category_en END,
			draft_tags_en = CASE WHEN has_unpublished_changes THEN draft_tags_en ELSE tags_en END,
			draft_content_en = CASE WHEN has_unpublished_changes THEN draft_content_en ELSE content_en END,
			draft_prompts_en = CASE WHEN has_unpublished_changes THEN draft_prompts_en ELSE prompts_en END,
			draft_seo_title_en = CASE WHEN has_unpublished_changes THEN draft_seo_title_en ELSE seo_title_en END,
			draft_seo_description_en = CASE WHEN has_unpublished_changes THEN draft_seo_description_en ELSE seo_description_en END,
			draft_title_zh = CASE WHEN has_unpublished_changes THEN draft_title_zh ELSE title_zh END,
			draft_slug_zh = CASE WHEN has_unpublished_changes THEN draft_slug_zh ELSE slug_zh END,
			draft_excerpt_zh = CASE WHEN has_unpublished_changes THEN draft_excerpt_zh ELSE excerpt_zh END,
			draft_category_zh = CASE WHEN has_unpublished_changes THEN draft_category_zh ELSE category_zh END,
			draft_tags_zh = CASE WHEN has_unpublished_changes THEN draft_tags_zh ELSE tags_zh END,
			draft_content_zh = CASE WHEN has_unpublished_changes THEN draft_content_zh ELSE content_zh END,
			draft_prompts_zh = CASE WHEN has_unpublished_changes THEN draft_prompts_zh ELSE prompts_zh END,
			draft_seo_title_zh = CASE WHEN has_unpublished_changes THEN draft_seo_title_zh ELSE seo_title_zh END,
			draft_seo_description_zh = CASE WHEN has_unpublished_changes THEN draft_seo_description_zh ELSE seo_description_zh END,
			requires_subscription = CASE WHEN has_unpublished_changes THEN draft_requires_subscription ELSE requires_subscription END,
			status = 'Draft',
			published_at = NULL,
			has_unpublished_changes = FALSE,
			draft_updated_at = NULL,
			updated_at = NOW()
		WHERE id = $1
		RETURNING `+fullSnippetSelectColumns, id)

	record, err := scanRawSnippet(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Snippet{}, ErrNotFound
		}
		return domain.Snippet{}, err
	}

	return record.editableSnippet(), nil
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

func (r *SnippetRepository) getRawByID(ctx context.Context, id string) (rawSnippetRecord, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT `+fullSnippetSelectColumns+`
		FROM snippets
		WHERE id = $1
	`, id)

	record, err := scanRawSnippet(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return rawSnippetRecord{}, ErrNotFound
		}
		return rawSnippetRecord{}, err
	}
	return record, nil
}

func (r *SnippetRepository) getRawByLiveSlug(ctx context.Context, slug string) (rawSnippetRecord, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT `+fullSnippetSelectColumns+`
		FROM snippets
		WHERE slug_en = $1 OR slug_zh = $1
	`, slug)

	record, err := scanRawSnippet(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return rawSnippetRecord{}, ErrNotFound
		}
		return rawSnippetRecord{}, err
	}
	return record, nil
}

func (r *SnippetRepository) getRawByPreviewSlug(ctx context.Context, slug string) (rawSnippetRecord, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT `+fullSnippetSelectColumns+`
		FROM snippets
		WHERE slug_en = $1 OR slug_zh = $1 OR draft_slug_en = $1 OR draft_slug_zh = $1
	`, slug)

	record, err := scanRawSnippet(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return rawSnippetRecord{}, ErrNotFound
		}
		return rawSnippetRecord{}, err
	}
	return record, nil
}

func scanRawSnippet(row interface{ Scan(dest ...any) error }) (rawSnippetRecord, error) {
	var record rawSnippetRecord
	if err := row.Scan(
		&record.ID,
		&record.CoverImage,
		&record.CoverImageDark,
		&record.CoverImageLight,
		&record.Code,
		&record.Status,
		&record.UpdatedAt,
		&record.PublishedAt,
		&record.RequiresSubscription,
		&record.Locales.EN.Title,
		&record.Locales.EN.Slug,
		&record.Locales.EN.Excerpt,
		&record.Locales.EN.Category,
		&record.Locales.EN.Tags,
		&record.Locales.EN.Content,
		&record.Locales.EN.Prompts,
		&record.Locales.EN.SEOTitle,
		&record.Locales.EN.SEODescription,
		&record.Locales.ZH.Title,
		&record.Locales.ZH.Slug,
		&record.Locales.ZH.Excerpt,
		&record.Locales.ZH.Category,
		&record.Locales.ZH.Tags,
		&record.Locales.ZH.Content,
		&record.Locales.ZH.Prompts,
		&record.Locales.ZH.SEOTitle,
		&record.Locales.ZH.SEODescription,
		&record.DraftCoverImage,
		&record.DraftCoverImageDark,
		&record.DraftCoverImageLight,
		&record.DraftCode,
		&record.DraftRequiresSubscription,
		&record.DraftLocales.EN.Title,
		&record.DraftLocales.EN.Slug,
		&record.DraftLocales.EN.Excerpt,
		&record.DraftLocales.EN.Category,
		&record.DraftLocales.EN.Tags,
		&record.DraftLocales.EN.Content,
		&record.DraftLocales.EN.Prompts,
		&record.DraftLocales.EN.SEOTitle,
		&record.DraftLocales.EN.SEODescription,
		&record.DraftLocales.ZH.Title,
		&record.DraftLocales.ZH.Slug,
		&record.DraftLocales.ZH.Excerpt,
		&record.DraftLocales.ZH.Category,
		&record.DraftLocales.ZH.Tags,
		&record.DraftLocales.ZH.Content,
		&record.DraftLocales.ZH.Prompts,
		&record.DraftLocales.ZH.SEOTitle,
		&record.DraftLocales.ZH.SEODescription,
		&record.HasUnpublishedChanges,
		&record.DraftUpdatedAt,
	); err != nil {
		return rawSnippetRecord{}, err
	}

	return record, nil
}

func normalizeLocales(locales domain.SnippetLocales) domain.SnippetLocales {
	locales.EN = normalizeLocalizedFields(locales.EN)
	locales.ZH = normalizeLocalizedFields(locales.ZH)
	return locales
}

func normalizeLocalizedFields(fields domain.SnippetLocalizedFields) domain.SnippetLocalizedFields {
	fields.Tags = sanitizeTags(fields.Tags)
	return fields
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
