-- +goose Up
ALTER TABLE IF EXISTS articles RENAME TO snippets;
ALTER INDEX IF EXISTS idx_articles_updated_at RENAME TO idx_snippets_updated_at;

-- +goose Down
ALTER INDEX IF EXISTS idx_snippets_updated_at RENAME TO idx_articles_updated_at;
ALTER TABLE IF EXISTS snippets RENAME TO articles;
