---
phase: 03-publish-pipeline
plan: 01
subsystem: publish-foundation
tags: [go, http, publish, ratelimit, storage]
requires:
  - phase: 02-discovery-experience
    provides: published-only discovery API and cache boundary
provides:
  - Signed upload URL issuance for publish media
  - Explicit draft/review/published state transitions
  - Endpoint-focused rate limiting on publish write paths
affects: [03-02-PLAN, 03-03-PLAN, publish-api]
tech-stack:
  added: [go-stdlib-http, hmac-sha256, in-memory-token-bucket]
  patterns: [constrained-upload-signing, explicit-transition-service, write-path-middleware]
key-files:
  created:
    - apps/api/internal/storage/presign.go
    - apps/api/internal/ratelimit/limiter.go
    - apps/api/internal/publish/service.go
  modified:
    - apps/api/internal/config/config.go
    - apps/api/internal/httpapi/server.go
    - apps/api/internal/httpapi/server_test.go
key-decisions:
  - "Upload signing accepts only snippetID/version/assetKind/content metadata and derives the object key server-side."
  - "Rate limiting attaches only to upload and publish write endpoints, not public feed/search/detail routes."
patterns-established:
  - "Publish transitions are modeled as explicit service methods rather than inline handler mutation."
  - "Write-path tests use injected dependencies so route behavior can be verified without a live database."
requirements-completed: [PIPE-01, PIPE-02, OPS-01]
duration: 45min
completed: 2026-03-25
---

# Phase 3 Plan 1: Publish Foundation Summary

**Signed upload issuance, explicit review/publish transitions, and rate-limited write routes for the Phase 3 publish pipeline**

## Accomplishments

- 新增 `storage.Presigner`，只允许 `cover` / `demo` 两类资产，并按 `snippet/version/assetKind` 生成对象键。
- 新增 `publish.Service` 与 `publish.Repository` 读写边界，明确支持 `MoveToReview` / `PublishVersion`。
- 为 `/api/v1/media/upload-url`、`/api/v1/publish/snippets/{id}/review`、`/api/v1/publish/snippets/{id}/publish` 接入了基础限流和结构化错误返回。

## Verification

- `cd apps/api && go test ./internal/storage ./internal/publish ./internal/ratelimit ./internal/httpapi`

---
*Phase: 03-publish-pipeline*
*Completed: 2026-03-25*
