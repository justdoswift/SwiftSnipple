-- +goose Up
ALTER TABLE snippets
  ADD COLUMN IF NOT EXISTS cover_image_dark TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image_light TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS draft_cover_image_dark TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS draft_cover_image_light TEXT NOT NULL DEFAULT '';

UPDATE snippets
SET
  cover_image_dark = CASE
    WHEN cover_image_dark = '' AND cover_image <> '' THEN cover_image
    ELSE cover_image_dark
  END,
  cover_image_light = CASE
    WHEN cover_image_light = '' AND cover_image <> '' THEN cover_image
    ELSE cover_image_light
  END,
  draft_cover_image_dark = CASE
    WHEN draft_cover_image_dark = '' AND draft_cover_image <> '' THEN draft_cover_image
    ELSE draft_cover_image_dark
  END,
  draft_cover_image_light = CASE
    WHEN draft_cover_image_light = '' AND draft_cover_image <> '' THEN draft_cover_image
    ELSE draft_cover_image_light
  END;

-- +goose Down
ALTER TABLE snippets
  DROP COLUMN IF EXISTS draft_cover_image_light,
  DROP COLUMN IF EXISTS draft_cover_image_dark,
  DROP COLUMN IF EXISTS cover_image_light,
  DROP COLUMN IF EXISTS cover_image_dark;
