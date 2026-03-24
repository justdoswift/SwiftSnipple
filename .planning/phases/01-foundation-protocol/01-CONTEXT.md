# Phase 1: Foundation Protocol - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只负责建立 SwiftSnippet 的项目基础骨架、内容协议、数据库/索引契约与 CI 校验底座。它不交付公开可用的卡片流、详情页或发布后台，而是为后续 Discovery Experience、Publish Pipeline 和首发内容批次提供统一规范与基础设施。

</domain>

<decisions>
## Implementation Decisions

### Repository shape
- **D-01:** 采用单仓多应用结构，顶层按 `apps/`、`packages/`、`content/`、`infra/` 分层，避免在 Phase 1 就拆多仓或微服务。
- **D-02:** `content/snippets/` 作为内容主事实来源，应用代码与内容资产分离管理。
- **D-03:** 当前仓库按 greenfield 处理，不为兼容历史代码或历史内容结构增加迁移负担。

### Content protocol boundary
- **D-04:** 每个 snippet 必须以 `snippet.yaml` 作为结构化入口文件，并配套固定目录结构承载 Media、SwiftUI 代码、Prompt 资产、测试与 license 信息。
- **D-05:** Phase 1 只定义并校验协议，不尝试在本阶段完成大量真实 snippet 内容生产。
- **D-06:** 协议字段优先覆盖发布、索引、合规和复用所需的最小集合，避免一开始就为增长和商业化设计过宽字段。

### Data contracts
- **D-07:** Phase 1 先定义 published 内容所需的核心数据模型和索引契约，不提前扩展订阅、企业权限或社区互动模型。
- **D-08:** 发布状态以最小状态机为目标，至少覆盖 draft、review、published 三类状态，以支撑后续发布 phase。
- **D-09:** 搜索与索引契约先围绕受控 facets、基础排序字段和公开展示字段设计，不在本阶段锁死高级排序算法。

### Quality gates
- **D-10:** CI 门槛优先覆盖内容协议校验、Swift 格式/lint 校验和基础构建检查，作为后续所有 phase 的统一底线。
- **D-11:** 媒体校验、发布任务和索引刷新机制在本阶段只定义接口与校验入口，不要求完成完整发布流程。
- **D-12:** 对于尚未被用户明确指定的细节，planner 可在不偏离上述边界的前提下自行选择标准实现。

### the agent's Discretion
- Phase 1 中具体使用哪种 schema 验证库、Go 数据访问层风格、前端样板细节和本地开发编排方式，由 planner 在遵守项目方向的前提下决定。
- 初始 fixture 与示例 snippet 的具体内容可采用最小可验证样本，只要能证明协议和 CI 可工作。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and scope
- `.planning/PROJECT.md` — 项目愿景、核心价值、范围边界与关键决策
- `.planning/REQUIREMENTS.md` — Phase 1 对应的 requirement IDs 与可验证要求
- `.planning/ROADMAP.md` — Phase 1 的固定边界、目标与成功标准
- `.planning/STATE.md` — 当前项目位置与阶段上下文

### Source idea
- `idea.md` §系统架构设计 — 初始的前后端分层、数据存储和 API 方向
- `idea.md` §数据与元数据模型 — `snippet.yaml`、索引字段与版本策略的原始设想
- `idea.md` §卡片内容协议 — snippet 目录结构、媒体规范、提示词协议与 license 策略
- `idea.md` §CI/CD 与自动化 — 内容校验、构建、媒体校验与 AI 校验的流水线方向

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing business code yet — 当前仓库只有规划文档、项目级指引和工作流说明文件。

### Established Patterns
- Greenfield repository — 不存在必须兼容的旧模式，可直接按规划中的单仓多应用结构建立基础骨架。
- GSD planning workflow is already initialized — 后续 Phase 1 产物需要与 `.planning/` 文档保持同步。

### Integration Points
- 新代码将从顶层项目骨架开始落地，首先连接 `.planning/REQUIREMENTS.md` 中的 Content Protocol 与 Operations 要求。
- Phase 1 的输出将直接成为 Phase 2 和 Phase 3 的输入，因此协议、目录和 CI 入口需要以“后续可接入”为目标设计。

</code_context>

<specifics>
## Specific Ideas

- [auto] Repository shape — selected single-repo modular structure (`apps/`, `packages/`, `content/`, `infra/`) as the recommended default for a greenfield MVP.
- [auto] Content protocol — selected `snippet.yaml` + fixed snippet directory structure as the required contract because it best supports validation, indexing, and publishing.
- [auto] Data contracts — selected a minimal published-content contract with draft/review/published status progression instead of broader product modeling.
- [auto] Quality gates — selected protocol validation + Swift formatting/lint + baseline build checks as the default Phase 1 CI floor.

</specifics>

<deferred>
## Deferred Ideas

- Search engine final selection details — defer to Phase 2 planning where discovery requirements become active.
- Full publish pipeline orchestration — defer to Phase 3, only contracts and touchpoints matter here.
- Seed snippet batch definition — defer to Phase 4, only fixtures/sample protocol coverage matter here.
- Subscription, enterprise, and community capabilities — already out of v1 scope and not part of this phase.

</deferred>

---

*Phase: 01-foundation-protocol*
*Context gathered: 2026-03-24*
