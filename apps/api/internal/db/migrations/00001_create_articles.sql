-- +goose Up
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Workflow',
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  cover_image TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('Draft', 'In Review', 'Scheduled', 'Published')),
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles (updated_at DESC);

-- +goose Down
DROP TABLE IF EXISTS articles;
