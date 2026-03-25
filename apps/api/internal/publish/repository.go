package publish

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sync"

	_ "github.com/lib/pq"
)

type SQLRepository struct {
	databaseURL string
	once        sync.Once
	db          *sql.DB
	dbErr       error
}

type AssetRecord struct {
	SnippetID  string
	Version    string
	AssetKind  string
	Path       string
	MIMEType   string
	IsRequired bool
}

type AssetRepository interface {
	ListAssets(ctx context.Context, snippetID string, version string) ([]AssetRecord, error)
}

type AdminRepository interface {
	Repository
	AssetRepository
	UpsertSnippet(ctx context.Context, record SnippetRecord) error
	UpsertVersion(ctx context.Context, record VersionRecord) (VersionRecord, error)
	UpsertAsset(ctx context.Context, asset AssetRecord) error
}

func NewRepository(databaseURL string) *SQLRepository {
	return &SQLRepository{databaseURL: databaseURL}
}

func (r *SQLRepository) GetSnippet(ctx context.Context, snippetID string) (SnippetRecord, error) {
	db, err := r.ensureDB()
	if err != nil {
		return SnippetRecord{}, err
	}

	const query = `
select id, title, summary, category_primary, difficulty, status
from snippet
where id = $1
`

	var record SnippetRecord
	if err := db.QueryRowContext(ctx, query, snippetID).Scan(
		&record.ID,
		&record.Title,
		&record.Summary,
		&record.CategoryPrimary,
		&record.Difficulty,
		&record.Status,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return SnippetRecord{}, ErrSnippetNotFound
		}
		return SnippetRecord{}, fmt.Errorf("load snippet: %w", err)
	}

	return record, nil
}

func (r *SQLRepository) GetState(ctx context.Context, snippetID string) (StateRecord, error) {
	db, err := r.ensureDB()
	if err != nil {
		return StateRecord{}, err
	}

	const query = `
select snippet_id, state, coalesce(published_version, ''), reviewed_at, published_at
from publish_state
where snippet_id = $1
`

	var record StateRecord
	if err := db.QueryRowContext(ctx, query, snippetID).Scan(
		&record.SnippetID,
		&record.State,
		&record.PublishedVersion,
		&record.ReviewedAt,
		&record.PublishedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return StateRecord{}, ErrSnippetNotFound
		}
		return StateRecord{}, fmt.Errorf("load publish state: %w", err)
	}

	return record, nil
}

func (r *SQLRepository) EnsureVersion(ctx context.Context, snippetID string, version string) (VersionRecord, error) {
	db, err := r.ensureDB()
	if err != nil {
		return VersionRecord{}, err
	}

	const query = `
select id, snippet_id, version, source_revision, changelog
from snippet_version
where snippet_id = $1 and version = $2
`

	var record VersionRecord
	if err := db.QueryRowContext(ctx, query, snippetID, version).Scan(
		&record.ID,
		&record.SnippetID,
		&record.Version,
		&record.SourceRevision,
		&record.Changelog,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return VersionRecord{}, ErrVersionNotFound
		}
		return VersionRecord{}, fmt.Errorf("load snippet version: %w", err)
	}

	return record, nil
}

func (r *SQLRepository) SaveState(ctx context.Context, record StateRecord) error {
	db, err := r.ensureDB()
	if err != nil {
		return err
	}

	const query = `
insert into publish_state (snippet_id, state, published_version, reviewed_at, published_at)
values ($1, $2, nullif($3, ''), $4, $5)
on conflict (snippet_id) do update
set state = excluded.state,
    published_version = excluded.published_version,
    reviewed_at = excluded.reviewed_at,
    published_at = excluded.published_at
`
	_, err = db.ExecContext(ctx, query,
		record.SnippetID,
		record.State,
		record.PublishedVersion,
		record.ReviewedAt,
		record.PublishedAt,
	)
	if err != nil {
		return fmt.Errorf("save publish state: %w", err)
	}

	return nil
}

func (r *SQLRepository) ListAssets(ctx context.Context, snippetID string, version string) ([]AssetRecord, error) {
	db, err := r.ensureDB()
	if err != nil {
		return nil, err
	}

	const query = `
select sa.snippet_id, sv.version, sa.asset_kind, sa.path, sa.mime_type, sa.is_required
from snippet_asset sa
join snippet_version sv on sv.id = sa.version_id
where sa.snippet_id = $1 and sv.version = $2
order by sa.asset_kind asc, sa.id asc
`

	rows, err := db.QueryContext(ctx, query, snippetID, version)
	if err != nil {
		return nil, fmt.Errorf("list snippet assets: %w", err)
	}
	defer rows.Close()

	assets := make([]AssetRecord, 0)
	for rows.Next() {
		var asset AssetRecord
		if err := rows.Scan(
			&asset.SnippetID,
			&asset.Version,
			&asset.AssetKind,
			&asset.Path,
			&asset.MIMEType,
			&asset.IsRequired,
		); err != nil {
			return nil, fmt.Errorf("scan snippet asset: %w", err)
		}
		assets = append(assets, asset)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate snippet assets: %w", err)
	}

	return assets, nil
}

func (r *SQLRepository) UpsertSnippet(ctx context.Context, record SnippetRecord) error {
	db, err := r.ensureDB()
	if err != nil {
		return err
	}

	const query = `
insert into snippet (id, title, summary, category_primary, difficulty, status)
values ($1, $2, $3, $4, $5, $6)
on conflict (id) do update
set title = excluded.title,
    summary = excluded.summary,
    category_primary = excluded.category_primary,
    difficulty = excluded.difficulty,
    status = excluded.status,
    updated_at = now()
`
	if _, err := db.ExecContext(ctx, query,
		record.ID,
		record.Title,
		record.Summary,
		record.CategoryPrimary,
		record.Difficulty,
		record.Status,
	); err != nil {
		return fmt.Errorf("upsert snippet: %w", err)
	}

	return nil
}

func (r *SQLRepository) UpsertVersion(ctx context.Context, record VersionRecord) (VersionRecord, error) {
	db, err := r.ensureDB()
	if err != nil {
		return VersionRecord{}, err
	}

	const query = `
insert into snippet_version (snippet_id, version, source_revision, changelog)
values ($1, $2, $3, $4)
on conflict (snippet_id, version) do update
set source_revision = excluded.source_revision,
    changelog = excluded.changelog
returning id, snippet_id, version, source_revision, changelog
`

	var saved VersionRecord
	if err := db.QueryRowContext(ctx, query,
		record.SnippetID,
		record.Version,
		record.SourceRevision,
		record.Changelog,
	).Scan(
		&saved.ID,
		&saved.SnippetID,
		&saved.Version,
		&saved.SourceRevision,
		&saved.Changelog,
	); err != nil {
		return VersionRecord{}, fmt.Errorf("upsert snippet version: %w", err)
	}

	return saved, nil
}

func (r *SQLRepository) UpsertAsset(ctx context.Context, asset AssetRecord) error {
	db, err := r.ensureDB()
	if err != nil {
		return err
	}

	version, err := r.EnsureVersion(ctx, asset.SnippetID, asset.Version)
	if err != nil {
		return err
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin asset transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx,
		`delete from snippet_asset where snippet_id = $1 and version_id = $2 and asset_kind = $3`,
		asset.SnippetID,
		version.ID,
		asset.AssetKind,
	); err != nil {
		return fmt.Errorf("delete snippet asset: %w", err)
	}

	if _, err := tx.ExecContext(ctx,
		`insert into snippet_asset (snippet_id, version_id, asset_kind, path, mime_type, is_required) values ($1, $2, $3, $4, $5, $6)`,
		asset.SnippetID,
		version.ID,
		asset.AssetKind,
		asset.Path,
		asset.MIMEType,
		asset.IsRequired,
	); err != nil {
		return fmt.Errorf("insert snippet asset: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit asset transaction: %w", err)
	}

	return nil
}

func (r *SQLRepository) ensureDB() (*sql.DB, error) {
	r.once.Do(func() {
		r.db, r.dbErr = sql.Open("postgres", r.databaseURL)
		if r.dbErr != nil {
			return
		}
		r.dbErr = r.db.Ping()
	})

	if r.dbErr != nil {
		return nil, fmt.Errorf("connect publish database: %w", r.dbErr)
	}
	return r.db, nil
}

type InMemoryRepository struct {
	Snippets map[string]SnippetRecord
	States   map[string]StateRecord
	Versions map[string]map[string]VersionRecord
	Assets   map[string]map[string][]AssetRecord
}

func NewInMemoryRepository() *InMemoryRepository {
	return &InMemoryRepository{
		Snippets: map[string]SnippetRecord{
			"stacked-hero-card": {
				ID:              "stacked-hero-card",
				Title:           "Stacked Hero Card",
				Summary:         "A more editorial SwiftUI hero card with layered typography and static cover fallback.",
				CategoryPrimary: "layout",
				Difficulty:      "medium",
				Status:          "draft",
			},
			"review-only-meter": {
				ID:              "review-only-meter",
				Title:           "Review Only Meter",
				Summary:         "A draft/review snippet reserved for publish workflow tests.",
				CategoryPrimary: "tooling",
				Difficulty:      "easy",
				Status:          "review",
			},
		},
		States: map[string]StateRecord{
			"stacked-hero-card": {SnippetID: "stacked-hero-card", State: "draft"},
			"review-only-meter": {SnippetID: "review-only-meter", State: "review"},
		},
		Versions: map[string]map[string]VersionRecord{
			"stacked-hero-card": {
				"1.0.0": {ID: 1, SnippetID: "stacked-hero-card", Version: "1.0.0", SourceRevision: "fixture-rev-hero-001", Changelog: "Initial release"},
			},
			"review-only-meter": {
				"1.0.0": {ID: 2, SnippetID: "review-only-meter", Version: "1.0.0", SourceRevision: "fixture-rev-meter-001", Changelog: "Initial review candidate"},
			},
		},
		Assets: map[string]map[string][]AssetRecord{
			"stacked-hero-card": {
				"1.0.0": {
					{SnippetID: "stacked-hero-card", Version: "1.0.0", AssetKind: "cover", Path: "stacked-hero-card/1.0.0/cover", MIMEType: "image/png", IsRequired: true},
				},
			},
			"review-only-meter": {
				"1.0.0": {
					{SnippetID: "review-only-meter", Version: "1.0.0", AssetKind: "cover", Path: "review-only-meter/1.0.0/cover", MIMEType: "image/png", IsRequired: true},
				},
			},
		},
	}
}

func (r *InMemoryRepository) GetSnippet(_ context.Context, snippetID string) (SnippetRecord, error) {
	record, ok := r.Snippets[snippetID]
	if !ok {
		return SnippetRecord{}, ErrSnippetNotFound
	}
	return record, nil
}

func (r *InMemoryRepository) GetState(_ context.Context, snippetID string) (StateRecord, error) {
	record, ok := r.States[snippetID]
	if !ok {
		return StateRecord{}, ErrSnippetNotFound
	}
	return record, nil
}

func (r *InMemoryRepository) EnsureVersion(_ context.Context, snippetID string, version string) (VersionRecord, error) {
	versions, ok := r.Versions[snippetID]
	if !ok {
		return VersionRecord{}, ErrVersionNotFound
	}
	record, ok := versions[version]
	if !ok {
		return VersionRecord{}, ErrVersionNotFound
	}
	return record, nil
}

func (r *InMemoryRepository) SaveState(_ context.Context, record StateRecord) error {
	r.States[record.SnippetID] = record
	return nil
}

func (r *InMemoryRepository) ListAssets(_ context.Context, snippetID string, version string) ([]AssetRecord, error) {
	versions, ok := r.Assets[snippetID]
	if !ok {
		return nil, nil
	}
	assets := versions[version]
	cloned := make([]AssetRecord, len(assets))
	copy(cloned, assets)
	return cloned, nil
}

func (r *InMemoryRepository) UpsertSnippet(_ context.Context, record SnippetRecord) error {
	r.Snippets[record.ID] = record
	return nil
}

func (r *InMemoryRepository) UpsertVersion(_ context.Context, record VersionRecord) (VersionRecord, error) {
	if r.Versions[record.SnippetID] == nil {
		r.Versions[record.SnippetID] = map[string]VersionRecord{}
	}
	if existing, ok := r.Versions[record.SnippetID][record.Version]; ok {
		record.ID = existing.ID
	} else if record.ID == 0 {
		record.ID = int64(len(r.Versions[record.SnippetID]) + 1)
	}
	r.Versions[record.SnippetID][record.Version] = record
	return record, nil
}

func (r *InMemoryRepository) UpsertAsset(_ context.Context, asset AssetRecord) error {
	if r.Assets[asset.SnippetID] == nil {
		r.Assets[asset.SnippetID] = map[string][]AssetRecord{}
	}
	assets := r.Assets[asset.SnippetID][asset.Version]
	next := make([]AssetRecord, 0, len(assets)+1)
	for _, existing := range assets {
		if existing.AssetKind == asset.AssetKind {
			continue
		}
		next = append(next, existing)
	}
	next = append(next, asset)
	r.Assets[asset.SnippetID][asset.Version] = next
	return nil
}
