-- +goose Up
UPDATE snippets
SET
  status = 'Draft',
  published_at = NULL
WHERE status IN ('In Review', 'Scheduled');

ALTER TABLE snippets
  DROP CONSTRAINT IF EXISTS articles_status_check;

ALTER TABLE snippets
  DROP CONSTRAINT IF EXISTS snippets_status_check;

ALTER TABLE snippets
  ADD CONSTRAINT snippets_status_check CHECK (status IN ('Draft', 'Published'));

-- +goose Down
ALTER TABLE snippets
  DROP CONSTRAINT IF EXISTS snippets_status_check;

ALTER TABLE snippets
  ADD CONSTRAINT snippets_status_check CHECK (status IN ('Draft', 'In Review', 'Scheduled', 'Published'));
