-- +goose Up
ALTER TABLE snippets
  ADD COLUMN IF NOT EXISTS title_en TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS slug_en TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS excerpt_en TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category_en TEXT NOT NULL DEFAULT 'Workflow',
  ADD COLUMN IF NOT EXISTS tags_en TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS content_en TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS prompts_en TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_title_en TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description_en TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS title_zh TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS slug_zh TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS excerpt_zh TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category_zh TEXT NOT NULL DEFAULT 'Workflow',
  ADD COLUMN IF NOT EXISTS tags_zh TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS content_zh TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS prompts_zh TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_title_zh TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description_zh TEXT NOT NULL DEFAULT '';

UPDATE snippets
SET
  title_en = CASE WHEN title_en = '' THEN title ELSE title_en END,
  slug_en = CASE WHEN slug_en = '' THEN slug ELSE slug_en END,
  excerpt_en = CASE WHEN excerpt_en = '' THEN excerpt ELSE excerpt_en END,
  category_en = CASE WHEN category_en = 'Workflow' AND category <> '' THEN category ELSE category_en END,
  tags_en = CASE WHEN array_length(tags_en, 1) IS NULL THEN tags ELSE tags_en END,
  content_en = CASE WHEN content_en = '' THEN content ELSE content_en END,
  prompts_en = CASE WHEN prompts_en = '' THEN prompts ELSE prompts_en END,
  seo_title_en = CASE WHEN seo_title_en = '' THEN seo_title ELSE seo_title_en END,
  seo_description_en = CASE WHEN seo_description_en = '' THEN seo_description ELSE seo_description_en END,
  title_zh = CASE WHEN title_zh = '' THEN title ELSE title_zh END,
  slug_zh = CASE WHEN slug_zh = '' THEN slug ELSE slug_zh END,
  excerpt_zh = CASE WHEN excerpt_zh = '' THEN excerpt ELSE excerpt_zh END,
  category_zh = CASE WHEN category_zh = 'Workflow' AND category <> '' THEN category ELSE category_zh END,
  tags_zh = CASE WHEN array_length(tags_zh, 1) IS NULL THEN tags ELSE tags_zh END,
  content_zh = CASE WHEN content_zh = '' THEN content ELSE content_zh END,
  prompts_zh = CASE WHEN prompts_zh = '' THEN prompts ELSE prompts_zh END,
  seo_title_zh = CASE WHEN seo_title_zh = '' THEN seo_title ELSE seo_title_zh END,
  seo_description_zh = CASE WHEN seo_description_zh = '' THEN seo_description ELSE seo_description_zh END;

CREATE UNIQUE INDEX IF NOT EXISTS idx_snippets_slug_en ON snippets (slug_en);
CREATE UNIQUE INDEX IF NOT EXISTS idx_snippets_slug_zh ON snippets (slug_zh);

-- +goose Down
DROP INDEX IF EXISTS idx_snippets_slug_zh;
DROP INDEX IF EXISTS idx_snippets_slug_en;

ALTER TABLE snippets
  DROP COLUMN IF EXISTS seo_description_zh,
  DROP COLUMN IF EXISTS seo_title_zh,
  DROP COLUMN IF EXISTS prompts_zh,
  DROP COLUMN IF EXISTS content_zh,
  DROP COLUMN IF EXISTS tags_zh,
  DROP COLUMN IF EXISTS category_zh,
  DROP COLUMN IF EXISTS excerpt_zh,
  DROP COLUMN IF EXISTS slug_zh,
  DROP COLUMN IF EXISTS title_zh,
  DROP COLUMN IF EXISTS seo_description_en,
  DROP COLUMN IF EXISTS seo_title_en,
  DROP COLUMN IF EXISTS prompts_en,
  DROP COLUMN IF EXISTS content_en,
  DROP COLUMN IF EXISTS tags_en,
  DROP COLUMN IF EXISTS category_en,
  DROP COLUMN IF EXISTS excerpt_en,
  DROP COLUMN IF EXISTS slug_en,
  DROP COLUMN IF EXISTS title_en;
