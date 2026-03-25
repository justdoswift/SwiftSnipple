---
phase: 04-launch-content-batch
plan: 04
subsystem: publish-and-verification
tags: [publish, discovery, testing, artifacts, search]
requires:
  - phase: 03-publish-pipeline
    provides: review/publish flow, artifact compiler, published discovery contracts
  - phase: 04-launch-content-batch
    provides: twelve launch-ready snippet directories
provides:
  - Twelve-item published launch snapshot with deterministic featured order
  - Discovery and HTTP regression coverage for the launch batch
  - Verification evidence for feed count, demo mix, search ranking, and hidden-content behavior
affects: [phase-04-verification, public-launch]
tech-stack:
  added: []
  patterns: [launch-order-encoded-in-artifact-compiler, hidden-content-regression-kept-in-visibility-registry]
key-files:
  created: []
  modified:
    - apps/api/internal/publish/artifacts.go
    - apps/api/internal/publish/artifacts_test.go
    - apps/api/internal/discovery/service_test.go
    - apps/api/internal/httpapi/server_test.go
    - content/published/snippets.json
    - content/published/visibility.json
    - content/published/search-documents.json
key-decisions:
  - "首发 featured 排序直接编码到 artifact compiler，而不是手工维护 JSON 顺序。"
  - "保留 `internal-draft-sample` 作为 `not_public` 回归样本，避免 12 条全公开后失去隐藏态测试。"
patterns-established:
  - "launch 内容扩容后，discovery 回归要同时断言 feed 数量、demo 配比、search 排序和隐藏内容阻断。"
requirements-completed: [SEED-01, SEED-02, SEED-03]
duration: 24min
completed: 2026-03-25
---

# Phase 4 Plan 4: Publish & Launch Verification Summary

**12 条首发内容已进入公开产物并带上确定性排序，discovery 回归也已切换到真实 launch 批次**

## Accomplishments

- `content/published/snippets.json`、`visibility.json`、`search-documents.json` 现在反映 12 条公开 launch 内容，其中 4 条带 demo。
- `apps/api/internal/publish/artifacts.go` 增加了 `launchFeaturedRanks`，把首页首发排序固定为展示优先的 12 条顺序。
- discovery / HTTP / publish 回归测试已经从早期 seed 场景切换到 12 条 launch 批次，并保留了 `internal-draft-sample` 的隐藏态校验。

## Verification

- `pnpm lint:protocol`
- `./packages/snippet-schema/node_modules/.bin/tsx packages/snippet-schema/src/cli.ts snippet content/snippets/*`（逐条通过）
- `cd apps/api && go test ./internal/discovery ./internal/httpapi ./internal/publish`
- `pnpm check:published-index`
- `node -e '...'` 验证 `content/published/snippets.json` 中共有 12 条内容、top 5 顺序为 `stacked-hero-card` / `masonry-grid` / `basic-card-feed` / `skeleton-shimmer` / `like-button-bounce`
- `node -e '...'` 验证 `internal-draft-sample` 仍为 `not_public`

## Issues Encountered

None. 本计划涉及的代码与产物已在工作区完成，本次执行重点是做计划对照、自动化验证和收尾记录。

---
*Phase: 04-launch-content-batch*
*Completed: 2026-03-25*
