# SwiftSnippet API Stub

This Go service is the Phase 1 runnable API stub. It defines only the minimum interface surface needed to prove the repository skeleton and local infrastructure.

## Endpoints

- `GET /health` — liveness/health check
- `GET /meta` — version, phase, environment, and database configuration metadata
- `GET /api/v1/snippets` — reserved route group for future snippet APIs, currently returns `501 Not Implemented`

## Run

```bash
go run ./cmd/api
```

Environment variables:

- `API_ADDRESS` — defaults to `:8080`
- `DATABASE_URL` — defaults to local PostgreSQL
- `APP_ENV` — defaults to `development`
