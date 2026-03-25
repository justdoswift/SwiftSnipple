---
phase: 04-launch-content-batch
plan: 01
subsystem: content-seeds
tags: [swiftui, content, manifests, launch, metadata]
requires:
  - phase: 03-publish-pipeline
    provides: publish flow and published artifact contract
provides:
  - Launch-ready metadata for the three seed snippets
  - Normalized seed summaries, tags, and reuse-path copy
affects: [phase-04-launch-batch, content-validation]
tech-stack:
  added: []
  patterns: [seed-snippets-ship-with-explicit-reuse-paths]
key-files:
  created: []
  modified:
    - content/snippets/basic-card-feed/snippet.yaml
    - content/snippets/stacked-hero-card/snippet.yaml
    - content/snippets/review-only-meter/snippet.yaml
    - content/snippets/review-only-meter/Code/SwiftUI/README.md
key-decisions:
  - "保留现有 3 条 seed，不另起一套首发样例体系。"
  - "只有 `basic-card-feed` 继续保留 demo，另外两条 seed 以 cover-only 进入首发。"
patterns-established:
  - "首发 seed 都必须在 manifest 和代码说明里给出清晰复用场景。"
requirements-completed: [SEED-01, SEED-03]
duration: 12min
completed: 2026-03-25
---

# Phase 4 Plan 1: Seed Uplift Summary

**三条种子 snippet 已统一到首发质量门槛，并明确了它们各自的复用入口与媒体策略**

## Accomplishments

- `basic-card-feed`、`stacked-hero-card`、`review-only-meter` 的 manifest 已与首发约束对齐，保留了明确的 `assets`、`code`、`license` 和 `source_revision`。
- `review-only-meter` 的摘要、标签和 SwiftUI README 已改成首发语境，直接面向 review dashboard、launch checklist、QA surface 三类复用场景。
- seed 批次的媒体策略被锁定为 1 条 demo + 2 条 cover-only，为后续 12 条批次建立了统一基线。

## Verification

- `pnpm lint:protocol`
- `./packages/snippet-schema/node_modules/.bin/tsx packages/snippet-schema/src/cli.ts snippet content/snippets/basic-card-feed`
- `./packages/snippet-schema/node_modules/.bin/tsx packages/snippet-schema/src/cli.ts snippet content/snippets/stacked-hero-card`
- `./packages/snippet-schema/node_modules/.bin/tsx packages/snippet-schema/src/cli.ts snippet content/snippets/review-only-meter`

## Issues Encountered

None. 当前工作区中的 seed 内容已经满足本计划要求，本次执行主要完成对照计划验收与执行记录固化。

---
*Phase: 04-launch-content-batch*
*Completed: 2026-03-25*
