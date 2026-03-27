# Phase 2: Discovery Experience - Context

> Historical note: this context file was created during the earlier `SvelteKit` route structure. Those references are preserved as planning history only.

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只交付公开 Discovery 读路径：已发布 snippet 的卡片流、搜索/筛选体验，以及详情页里的 demo、源码、提示词和 license 信息展示。它不包含投稿、审核、发布、上传、索引写回或任何 draft/review 后台能力；讨论只锁定公开体验应如何呈现，而不是扩展到供给侧工作流。

</domain>

<decisions>
## Implementation Decisions

### Feed composition and browsing feel
- **D-01:** 公开 feed 采用偏作品集感的大视觉卡片流，而不是高密度纯信息列表，优先让用户先看到效果再决定是否点入详情。
- **D-02:** 卡片除标题、摘要、标签、预览媒体外，还应直接露出 `difficulty` 与平台信息，帮助用户快速判断可用性。
- **D-03:** 卡片预览默认以静态 cover 为主；demo 播放不作为 feed 默认行为，把动态预览留给详情页或后续增强。
- **D-04:** 默认排序采用“精选优先，但保留新内容露出”的混合路线，公开 feed 需要有编辑选择感，而不是单纯按时间倒序。

### Search and facet interaction
- **D-05:** 搜索体验以独立 Explore/Search 页面为主，而不是仅在首页顶部附带一个轻量搜索框。
- **D-06:** facet 交互保持轻量，优先用顶部 chips 或 segmented controls，而不是桌面左侧重型筛选栏。
- **D-07:** 关键词与筛选都采用实时生效的交互，用户输入或点选后应立即刷新结果，不增加额外“应用筛选”步骤。
- **D-08:** 搜索零结果时，既要明确说明当前条件没有命中，也要给出替代的已发布推荐内容，避免死路体验。

### Detail page information architecture
- **D-09:** 详情页首屏优先展示 demo / 视觉预览，让用户先判断效果，再继续查看实现与提示词资产。
- **D-10:** 详情页整体采用混合结构：首屏固定展示核心信息，主体内容区使用 tabs 在 `Demo / Code / Prompt / License` 等内容间切换。
- **D-11:** Phase 2 的复制体验优先做最直接的块级复制；代码块与提示词块各自提供一键复制，不先做更复杂的聚合复制流程。
- **D-12:** license 与依赖披露放在页面后半段或对应内容区中，不要求首屏强曝光，但必须可清晰访问。

### Published-only visibility rules
- **D-13:** 公开站访问未发布 snippet slug 时，不伪装成正常内容，也不返回通用 404；应明确显示“内容未公开”这一状态。
- **D-14:** `draft` 与 `review` 内容在公开 feed 与 search 中完全不可枚举，不能以任何占位或半公开方式出现。
- **D-15:** 如果某个 `published` snippet 缺少 demo 媒体，公开前台仍可展示，但应回退到静态 cover 或明确占位样式，不能因此中断卡片流。
- **D-16:** 如果某个 `published` snippet 只具备 code 或只具备 prompt，详情页只展示已有区块，缺失区块可直接隐藏，不强制补充“暂不可用”文案。

### the agent's Discretion
- Explore 页面与首页的具体关系、是否共享同一数据流与样式骨架，由 planner 在不偏离上述交互方向的前提下决定。
- “精选优先 + 新内容露出”的具体排序信号、权重与数据来源由 research / plan 阶段确定，本阶段只锁定用户感知结果。
- 详情页 tabs 的具体命名、桌面/移动端排版细节、切换动画与滚动行为由 planner 决定。
- 对“内容未公开”页的语气、视觉样式和跳转建议由 planner 决定，但不能泄露 draft/review 元数据。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and requirements
- `.planning/PROJECT.md` — 项目核心价值、v1 边界与“演示视频 + 源码 + 提示词”三段式内容模型
- `.planning/REQUIREMENTS.md` — Phase 2 对应的 `DISC-*`、`DTL-*`、`OPS-03` requirement 定义
- `.planning/ROADMAP.md` — Phase 2 固定目标、成功标准与阶段边界
- `.planning/STATE.md` — 当前项目所处阶段与后续 planning 状态

### Prior phase decisions
- `.planning/phases/01-foundation-protocol/01-CONTEXT.md` — 已锁定的仓库结构、`snippet.yaml` 协议、publish state 与 published-content contract 边界
- `.planning/phases/01-foundation-protocol/01-VERIFICATION.md` — Phase 1 已交付基础设施与质量门禁的验证结果，供 Phase 2 复用

### Source idea and product references
- `idea.md` §目标与边界 — 读路径范围、前后端分工与 Discovery 的整体目标
- `idea.md` §API 设计框架 — feed / snippet detail / search 这些公开读接口的原始边界
- `idea.md` §索引字段映射 — 搜索字段、facet 字段与排序字段的初始候选
- `idea.md` §卡片内容协议 — card 所消费的媒体、代码、提示词和 license 资产组成
- `idea.md` §示例卡片完整样例 — 详情页与卡片内容层次的原始样例参考
- `idea.md` §分面与权重策略 — faceting 与权重排序的产品意图

### Current implementation anchors
- `packages/snippet-schema/src/types.ts` — 当前已锁定的 `status`、`category_primary`、`difficulty`、`platforms`、`assets` 等字段
- `packages/snippet-schema/src/schema.ts` — `snippet.yaml` 的权威 schema，Phase 2 公开视图必须建立在其允许字段之上
- `packages/snippet-schema/src/validate.ts` — 内容协议校验入口，后续 published fixture / sample 应继续复用
- `packages/snippet-schema/fixtures/valid/basic-card-feed/snippet.yaml` — 最小合法 snippet 示例，可作为 Discovery 样本输入
- `packages/snippet-schema/fixtures/valid/basic-card-feed/Media/demo.mp4` — 当前最小 demo 媒体样本
- `packages/snippet-schema/fixtures/valid/basic-card-feed/Code/SwiftUI/Sources/BasicCardFeedSnippet.swift` — 当前最小可展示 SwiftUI 源码样本
- `packages/snippet-schema/fixtures/valid/basic-card-feed/Code/Vibe/prompt.md` — 当前最小提示词资产样本
- `packages/snippet-schema/fixtures/valid/basic-card-feed/LICENSES/THIRD_PARTY.md` — 当前最小 license 披露样本

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/snippet-schema/src/types.ts`: 已定义公开卡片和详情页最关键的内容字段，Phase 2 不应再发明新的核心 manifest 结构。
- `packages/snippet-schema/fixtures/valid/basic-card-feed/*`: 当前唯一完整合法 fixture 同时具备 cover、demo、SwiftUI 代码、prompt 和 license，可直接作为最小 published 展示样本。
- `apps/web/src/routes/+page.svelte`: 已有 SvelteKit 首页 stub，可作为 Discovery 首页或入口页的替换起点。
- `apps/web/src/routes/health/+page.svelte`: 已有独立 health 路由模式，说明 web 端目前按 SvelteKit 文件路由扩展页面即可。
- `apps/api/internal/httpapi/server.go`: 已有 Go `net/http` 服务器和 `/api/v1/snippets` 路由占位，Phase 2 可在这一边界内补公开读接口。
- `apps/api/internal/httpapi/server_test.go`: 已有最小 endpoint 测试，可延续同样的接口测试风格为 feed / detail / search 增补基础覆盖。

### Established Patterns
- 单仓结构与 `apps/`、`packages/`、`content/`、`infra/` 分层已在 Phase 1 锁定，Discovery 实现必须沿用这套边界。
- `snippet.yaml` + 固定目录结构是唯一权威内容来源，公开页面展示内容只能建立在该协议和其派生 published contract 之上。
- publish state 仅有 `draft | review | published` 三类，Phase 2 只处理公开读路径，不引入新的前台可见状态。
- 当前 web 和 api 都还是 stub，说明 Phase 2 需要同时推进真实页面骨架和公开数据读取，但应保持接口最小化。

### Integration Points
- Web 端 Discovery 页面将从 `apps/web/src/routes/+page.svelte` 和后续新增 route 扩展，消费 API 或 published data contract。
- API 端公开读能力预计从 `apps/api/internal/httpapi/server.go` 当前 `/api/v1/snippets` 路由边界扩展，补充 feed / detail / search 所需读接口。
- 搜索与 facet 能力必须消费 Phase 1 已锁定的 `category_primary`、`difficulty`、`platforms`、`assets` 等结构化字段，而不是重新设计自由格式元数据。
- 公开体验只能读取 published 内容，因此 planner 需要定义 published 视图或缓存层如何与现有数据库 / fixture / future publish pipeline 对接，但不能提前实现 Phase 3 的供给工作流。

</code_context>

<specifics>
## Specific Ideas

- 用户希望公开 feed 更像“作品集式”的大视觉卡片流，而不是文档站式密集列表。
- 卡片要让用户在进入详情前就能快速判断“我能不能用”，因此难度和平台必须直接露出。
- 搜索体验更像一个独立 Explore 页面，但筛选交互不要做成后台系统式重控件，保持轻量和即时反馈。
- 详情页是“先看效果，再看实现”，因此首屏 demo 优先，其后再用 tabs 切换代码、提示词和 license。
- 未发布 slug 不希望伪装成不存在；要明确告诉用户“内容未公开”，但公开结果中不能枚举 draft / review。

</specifics>

<deferred>
## Deferred Ideas

- 公开 feed 的“精选”如何生产、是否来自人工运营或发布打分体系，属于排序实现与发布体系衔接问题，留到 Phase 2 planning / Phase 3 衔接时决定。
- 搜索引擎最终选型与具体索引更新机制仍保持 deferred，由 Phase 2 research / planning 结合现有约束落定。
- demo 自动播放、hover 动效、沉浸式 media 交互等 richer showcase 行为可作为 Discovery 增强项，但不是本次 discuss-phase 必锁内容。
- 对未发布内容的鉴权访问、后台预览或 reviewer-only 可见性属于 Publish Pipeline 范畴，不纳入 Phase 2 公开站范围。

</deferred>

---

*Phase: 02-discovery-experience*
*Context gathered: 2026-03-24*
