# Project Retrospective

> Historical note: stack references in this retrospective reflect the implementation path at the time of each milestone. Where it mentions `SvelteKit` or `shadcn-svelte`, treat that as historical context, not the current frontend stack.

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-25
**Phases:** 4 | **Plans:** 13 | **Sessions:** 1

### What Was Built
- A validated `snippet.yaml` protocol, schema CLI, CI checks, and PostgreSQL-backed repository foundation
- Published-only discovery APIs plus SvelteKit feed, search, and detail pages with explicit `not_public` handling
- Signed uploads, review/publish transitions, artifact refresh, search document generation, and rate-limited write paths
- A 12-snippet public launch batch with deterministic featured ordering and four demo-backed showcase entries

### What Worked
- 先锁协议、再做读路径、再做发布、最后补内容的 phase 顺序很顺，后续每阶段都能复用前一阶段的稳定边界
- published snapshot / visibility registry / search documents 这组三件套把 discovery 和 publish 解耦得比较干净

### What Was Inefficient
- `.planning` 的部分状态文件会落后于真实执行进度，里程碑末尾需要人工纠偏
- execute / complete-milestone 的自动工具对 `STATE.md` 与 `REQUIREMENTS.md` 的最终收尾还不够完整，需要人工补一层

### Patterns Established
- 内容平台用 `snippet.yaml + fixed directory structure + published artifacts` 作为唯一内容边界是可行的
- launch 批次扩容后，回归测试要同时盯住 feed 数量、demo 配比、search 排序和 `not_public` 阻断

### Key Lessons
1. 先把发布产物边界做稳定，比过早接搜索引擎或后台 UI 更能降低后续实现复杂度。
2. 内容批次不能等平台全完工后再做，真实内容会反过来暴露协议、搜索和详情页的边界是否够用。

### Cost Observations
- Model mix: mostly sonnet/balanced orchestration, with planning-heavy GSD flows layered on top
- Sessions: 1
- Notable: GSD 适合把长链路拆开推进，但 milestone 收尾仍需要一次人工整合和一致性校正

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 4 | 从协议驱动的空仓库推进到可浏览、可发布、可演示的 SwiftUI snippet 平台 |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | protocol + go + published-index + UAT | goal-level phase verification across all 4 phases | prioritized reuse of existing stack and validators |

### Top Lessons (Verified Across Milestones)

1. 把内容协议和发布产物做成单一权威边界，会显著降低读写两侧的漂移风险。
2. 真实内容和真实 UAT 要尽早进入路线图，否则很难判断平台是否真的在服务核心价值。
