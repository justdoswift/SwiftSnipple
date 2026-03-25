# SwiftSnippet API

This Go service now exposes the public discovery API plus the Phase 3 publish write-path endpoints.

## Endpoints

- `GET /health` — liveness/health check
- `GET /meta` — version, phase, environment, and database configuration metadata
- `GET /api/v1/discovery/feed` — published-only feed
- `GET /api/v1/discovery/search` — published-only search and facets
- `GET /api/v1/discovery/snippets/{id}` — published-only detail with `not_public` handling
- `POST /api/v1/media/upload-url` — issue a constrained signed upload URL for `cover` or `demo`
- `POST /api/v1/publish/snippets/{id}/review` — move a snippet from `draft` to `review`
- `POST /api/v1/publish/snippets/{id}/publish` — validate, publish, and refresh `content/published/*.json`

## Run

```bash
go run ./cmd/api
```

Environment variables:

- `API_ADDRESS` — defaults to `:18080`
- `DATABASE_URL` — defaults to local PostgreSQL
- `APP_ENV` — defaults to `development`
- `SNIPPET_SOURCE_ROOT` — defaults to `content/snippets`
- `PUBLISHED_INDEX_PATH` — defaults to `content/published/snippets.json`
- `VISIBILITY_INDEX_PATH` — defaults to `content/published/visibility.json`
- `SEARCH_DOCUMENTS_PATH` — defaults to `content/published/search-documents.json`
- `STORAGE_UPLOAD_BASE_URL` — signed upload base URL
- `STORAGE_SIGNING_SECRET` — upload signing secret

## Local Phase 3 Flow

Start the database, run migrations, then boot the API:

```bash
pnpm db:up
pnpm db:migrate
cd apps/api && go run ./cmd/api
```

Request a signed upload URL:

```bash
curl -s http://127.0.0.1:18080/api/v1/media/upload-url \
  -H 'Content-Type: application/json' \
  -d '{
    "snippetID":"review-only-meter",
    "version":"1.0.0",
    "assetKind":"cover",
    "contentType":"image/png",
    "contentLength":2048
  }'
```

Move a snippet into review:

```bash
curl -s -X POST http://127.0.0.1:18080/api/v1/publish/snippets/stacked-hero-card/review
```

Publish a reviewed version and refresh public artifacts:

```bash
curl -s -X POST http://127.0.0.1:18080/api/v1/publish/snippets/review-only-meter/publish \
  -H 'Content-Type: application/json' \
  -d '{"version":"1.0.0"}'
```

After a successful publish, the API refreshes:

- `content/published/snippets.json`
- `content/published/visibility.json`
- `content/published/search-documents.json`
