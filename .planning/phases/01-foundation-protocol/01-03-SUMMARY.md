---
phase: 01-foundation-protocol
plan: 03
subsystem: quality
tags: [github-actions, swiftlint, swift-format, docs, ci, workflow]
requires:
  - phase: 01-foundation-protocol
    provides: repository skeleton and protocol package from plans 01-01 and 01-02
provides:
  - Core CI workflow aligned with protocol, web, api, and Swift quality gates
  - Strict Swift formatting entrypoint and cleaned fixture target
  - Updated contributor docs and agent routing for post-plan execution
affects: [discovery, publish-pipeline, contributor-workflow]
tech-stack:
  added: [github-actions, swiftlint, swift-format, postgresql-16]
  patterns: [ci-mirrors-local-commands, strict-swift-format-gate, docs-as-handoff-contract]
key-files:
  created: []
  modified:
    - .github/workflows/ci.yml
    - scripts/check-swift.sh
    - README.md
    - AGENTS.md
    - .gitignore
key-decisions:
  - "Run PostgreSQL directly on macOS CI via Homebrew because SwiftUI fixture validation keeps the job on macOS."
  - "Treat swift-format findings as failures by using --strict."
patterns-established:
  - "CI mirrors the same root commands contributors run locally."
  - "Agent guidance must advance with the planning state, not point back to stale commands."
requirements-completed: [CPRT-03, OPS-04]
duration: 25min
completed: 2026-03-24
---

# Phase 1: Foundation Protocol Summary

**Core CI and documentation handoff aligned around strict Swift quality gates and executable next-step guidance**

## Performance

- **Duration:** 25 min
- **Started:** 2026-03-24T05:05:00Z
- **Completed:** 2026-03-24T05:31:09Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- 把 Swift 格式检查改为 `--strict`，让格式问题真正成为门禁而不是 warning 噪音。
- 更新了 CI，在 `macos-latest` 上通过 Homebrew 启动 PostgreSQL 16，以兼容 SwiftUI fixture 的构建需求。
- 修正了 README 和 AGENTS 的执行导向，让下一步从“继续 plan”切换到“执行/校验”。

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the core CI and Swift quality gate entrypoints** - `488508c` (fix)
2. **Task 2: Document local workflows and downstream contract boundaries** - `488508c` (docs)

**Plan metadata:** `488508c` (docs: complete plan)

## Files Created/Modified
- `.github/workflows/ci.yml` - macOS runner 下的 PostgreSQL 16 + core gates workflow。
- `scripts/check-swift.sh` - 严格 Swift 格式、lint、build 门禁入口。
- `README.md` - 补充 `psql` 依赖和本地工作流说明。
- `AGENTS.md` - 把过期的 `$gsd-plan-phase 1` 指令改成执行/校验导向。
- `.gitignore` - 忽略 Swift package 产生的 `.build/` 目录。

## Decisions Made
- 因为 Phase 1 需要在 CI 中构建 SwiftUI fixture，job 保持在 macOS；相应 PostgreSQL 改为本机启动而不是 Linux service container。
- Swift 格式检查采用严格模式，确保格式问题在 CI 和本地都能明确失败。
- 将 agent 指导文件视为交接契约的一部分，必须随着 phase 状态推进同步更新。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reworked CI PostgreSQL startup for macOS compatibility**
- **Found during:** Task 1 (Add the core CI and Swift quality gate entrypoints)
- **Issue:** 原 CI 定义在 `macos-latest` 上声明了 service container；这和 GitHub Actions 的 runner 约束及本仓库的 Swift/macOS 需求不匹配。
- **Fix:** 改为在 macOS runner 上通过 Homebrew 安装并启动 `postgresql@16`，再执行 `pnpm db:migrate`。
- **Files modified:** `.github/workflows/ci.yml`
- **Verification:** 工作流 YAML 可解析；命令链与仓库本地脚本保持一致。
- **Committed in:** `488508c` (part of task/metadata completion)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** 修复的是 CI 可执行性，不改变 Phase 1 目标。

## Issues Encountered
- 本机仍缺少 `swiftlint`，所以完整运行 `bash scripts/check-swift.sh` 依然会在工具缺失处失败；这属于环境依赖，不是脚本逻辑问题。
- 本机缺少 `psql`，因此 `pnpm db:migrate` 本地无法真正执行，但 README 和脚本已经明确该依赖。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 2 可以直接复用当前 CI / 文档入口继续扩展，不需要重新设计基础门禁。
- 团队若要在本机完整复现所有 Phase 1 检查，需要安装 `swiftlint` 和 `psql`，并确保 `5432` / `8080` 端口不冲突。

---
*Phase: 01-foundation-protocol*
*Completed: 2026-03-24*
