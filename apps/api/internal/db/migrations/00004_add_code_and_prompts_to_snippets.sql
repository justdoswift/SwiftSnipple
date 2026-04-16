-- +goose Up
ALTER TABLE snippets
  ADD COLUMN IF NOT EXISTS code TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS prompts TEXT NOT NULL DEFAULT '';

UPDATE snippets
SET
  code = COALESCE(code, ''),
  prompts = COALESCE(prompts, '');

-- +goose Down
ALTER TABLE snippets
  DROP COLUMN IF EXISTS prompts,
  DROP COLUMN IF EXISTS code;
