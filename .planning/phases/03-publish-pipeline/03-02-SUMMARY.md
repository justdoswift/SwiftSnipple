---
phase: 03-publish-pipeline
plan: 02
subsystem: publish-validation
tags: [go, yaml, published-index, artifacts, validation]
requires:
  - phase: 03-publish-pipeline
    provides: signed upload flow, explicit publish transitions, and rate-limited write routes
provides:
  - Layered publish-readiness validation over snippet protocol + publish-only checks
  - Artifact compiler for snippets.json, visibility.json, and search-documents.json
  - Real snippet source tree under content/snippets for local publish validation
affects: [03-03-PLAN, publish-artifacts, discovery-refresh]
tech-stack:
  added: [yaml-v3, published-json-compiler]
  patterns: [validator-shells-into-snippet-schema, publish-compiles-public-artifacts]
key-files:
  created:
    - apps/api/internal/publish/validator.go
    - apps/api/internal/publish/artifacts.go
    - content/published/search-documents.json
    - content/snippets/basic-card-feed/snippet.yaml
    - content/snippets/review-only-meter/snippet.yaml
    - content/snippets/stacked-hero-card/snippet.yaml
  modified:
    - apps/api/internal/config/config.go
    - apps/api/go.mod
key-decisions:
  - "Go publish validation reuses the existing TypeScript snippet validator by shelling into the snippet-schema CLI instead of forking schema logic."
  - "Publish artifacts are compiled as deterministic JSON files that keep Discovery on the same published-only read contract."
patterns-established:
  - "Public search documents are generated during publish, not on read."
  - "Snippet source content lives under content/snippets and is the canonical publish input."
requirements-completed: [PIPE-03, PIPE-04, PIPE-05]
duration: 55min
completed: 2026-03-25
---

# Phase 3 Plan 2: Publish Validation Summary

**Layered readiness validation and deterministic published artifact compilation for the Phase 3 supply pipeline**

## Accomplishments

- `publish.Validator` 先调用 `@swiftsnippet/snippet-schema` CLI 做协议校验，再叠加 license、release metadata、version 对齐和资产完整性检查。
- `publish.ArtifactCompiler` 现在会刷新 `content/published/snippets.json`、`content/published/visibility.json`、`content/published/search-documents.json`。
- 在 `content/snippets/` 下补了最小可发布内容树，使 Phase 3 有仓库内真实 publish input，而不只依赖 fixture。

## Verification

- `cd apps/api && go test ./internal/publish`
- `pnpm check:published-index`

---
*Phase: 03-publish-pipeline*
*Completed: 2026-03-25*
