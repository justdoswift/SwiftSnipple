# Phase 6: Discovery Surface Redesign - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只重做公开站的首页与 Explore 两个 discovery 入口，让它们从“功能已通的内容列表”升级为“品牌门面明确、作品库优先、但仍保持快速复制效率”的浏览面。它不扩展新的后端能力、不改写 discovery query contract、不重做发布后台，也不把详情页当成本阶段主战场；讨论只锁定首页与 Explore 应如何分工、卡片应暴露多少信息，以及筛选在新画廊结构中的存在感。

</domain>

<decisions>
## Implementation Decisions

### Homepage structure and landing hierarchy
- **D-01:** 首页 hero 继续收向极简门面，不再承担大量解释职责；首屏以一句主标题和最少量价值说明建立气质，不做长段产品介绍。
- **D-02:** 首页结构锁定为 `极简 hero -> 直接进入精选作品墙`，不在 hero 与 gallery 之间插入额外说明区块或“为什么选择我们”式中间层。
- **D-03:** 首页只突出 1 个门面 snippet，而不是并列 2-3 个主卡，避免首屏一上来就变成卡片拼盘。
- **D-04:** 首页的职责是品牌门面和精选入口，不承担完整浏览任务；如果用户想系统浏览，应被自然引导去 Explore 深挖。

### Card density and action priority
- **D-05:** Phase 6 的共享卡片默认收敛到“封面 + 标题 + 1 行 meta”这一极简信息层级，摘要不再作为默认强信息层出现。
- **D-06:** 卡片上的 `复制代码` / `复制 Prompt` 动作继续保留，但默认只显示小图标，hover / focus 时再露出文字标签。
- **D-07:** 卡片默认不再保留 tag 云或多组状态 chip，只保留最少量、最有判断价值的元信息，避免重新变回信息列表卡。
- **D-08:** 卡片仍保留进入详情页的入口，但视觉优先级要让位于“快速复制资产”这一主动作，让首页和 Explore 都更像可直接拿走资产的作品库。

### Explore as gallery-first browsing surface
- **D-09:** Explore 页面顶部结构收敛为“一行简短标题 + 轻工具条”，用户进入页面后应尽快看到结果画廊，而不是先阅读说明。
- **D-10:** 搜索框保留，但在视觉上更像轻量工具，而不是单独的主舞台；Explore 的注意力中心仍然是结果卡片阵列。
- **D-11:** facet chips 继续采用轻量顶部交互，但默认只强调最关键的 2-3 组筛选，其余筛选存在感需要更弱，避免 Explore 重新长成后台筛选页。
- **D-12:** 零结果状态更像“精选回退画廊”的一部分，而不是强系统提示框；用户在无结果时仍应自然回到浏览流，而不是被提示打断。

### Homepage vs Explore differentiation
- **D-13:** 首页与 Explore 共享同一视觉系统和同一张卡片骨架，但首页版本应更克制、更门面化，Explore 版本可保留略多一点辅助信息以服务挑选。
- **D-14:** Explore 是 Phase 6 的主浏览页，承担筛选、比较和快速复制任务；首页只负责建立品牌气质与精选入口，不再尝试兼顾全量浏览。
- **D-15:** 首页需要更明显地给出前往 Explore 的引导，让用户理解“首页看精选，Explore 深挖全部”的职责分工。
- **D-16:** 首页与 Explore 的差异化主要体现在信息密度、首屏节奏和入口语气，而不是发展出两套完全不同的组件系统。

### the agent's Discretion
- 首页那 1 个门面 snippet 的挑选方式、是否固定某个精选内容或基于 feed 数据得出，由 planning 决定，但必须服务“门面感强于列表感”。
- Explore 中究竟是哪 2-3 组 facet 被默认强调、其它筛选如何弱化或折叠，由 planning 结合现有 facets 和 URL contract 决定。
- 首页卡片版与 Explore 卡片版的差异应控制在同一组件骨架内完成，具体通过 props、slot 或 layout variant 实现，由 planning 决定。
- 是否保留极少量摘要、meta 里优先显示哪类信息、以及移动端密度如何进一步收紧，由 planning 结合当前 quick copy 与 published data 决定，但不能回到高密度说明卡。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and requirements
- `.planning/PROJECT.md` — v1.1 视觉重构目标、SwiftUI-first 边界和公开站只做表现层升级的约束
- `.planning/REQUIREMENTS.md` — Phase 6 对应的 `ART-02` 与 `UX-01` requirement 定义
- `.planning/ROADMAP.md` — Phase 6 的固定目标、成功标准与“只重做首页 / Explore”的阶段边界
- `.planning/STATE.md` — 当前 milestone 状态与 Phase 05 已完成的上下文

### Prior phase decisions
- `.planning/phases/02-discovery-experience/02-CONTEXT.md` — 已锁定的 gallery-first discovery、轻量 chips、published-only 和 detail 承接边界
- `.planning/phases/04-launch-content-batch/04-CONTEXT.md` — 12 条已发布首发内容的构成与“发现 -> 复制 -> 复用”的价值链要求

### Immediate visual baseline from Phase 5
- `.planning/phases/05-visual-system-reset/05-UAT.md` — 当前视觉验收结论，确认浅色液态玻璃方向已被接受
- `.planning/phases/05-visual-system-reset/05-VERIFICATION.md` — Phase 5 已验证的中文化、共享视觉系统与回退态

### Current implementation anchors
- `apps/web/src/routes/+layout.svelte` — 当前全局浅色 liquid glass 主题、导航与排版 token
- `apps/web/src/routes/+page.svelte` — 当前首页 hero / trust / feed 结构，Phase 6 需在此基础上重排
- `apps/web/src/routes/explore/+page.svelte` — 当前 Explore gallery / search / facet 结构，Phase 6 需在此基础上弱化筛选存在感
- `apps/web/src/lib/components/SnippetCard.svelte` — 当前共享卡片骨架与 quick copy 行为，Phase 6 需基于它继续压缩信息密度
- `apps/web/src/lib/components/SnippetPreviewMedia.svelte` — 当前画廊封面构图与 generated cover 接管逻辑
- `apps/web/src/lib/components/FacetChips.svelte` — 当前顶部 chips 的视觉与交互实现
- `apps/web/src/lib/discovery/api.ts` — 当前 feed / search 卡片 quick copy 数据补充逻辑
- `apps/web/src/lib/discovery/types.ts` — `PublishedSnippetCard` 与 `quickCopy` 数据边界，Phase 6 不能突破此公开契约

### Canonical refs status
- 本阶段没有额外外部 PRD / 设计文档 / ADR 被用户指定为必须遵循；当前 canonical refs 以上述 roadmap、prior context 与现有实现为准。

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/routes/+layout.svelte` 已经提供统一浅色 liquid glass 导航、字体和页面级 token，Phase 6 不需要再造第二套全局主题层。
- `apps/web/src/lib/components/SnippetCard.svelte` 已经具备 quick copy、详情入口和画廊式 media 容器，是首页与 Explore 共用卡片的直接起点。
- `apps/web/src/lib/components/SnippetPreviewMedia.svelte` 已经解决 generated cover 视觉接管问题，可继续作为首页门面卡和 Explore 卡面的统一 media 基座。
- `apps/web/src/lib/components/FacetChips.svelte` 已经是独立组件，说明 Explore 的筛选存在感可以通过组件级 variant / density 调整，而不是重写整页逻辑。
- `apps/web/src/lib/discovery/api.ts` 与 `types.ts` 已经提供卡片 quick copy 所需的最小 detail enrich，说明 Phase 6 可继续把“复制”作为卡片主动作，而不用扩 API。

### Established Patterns
- 当前前端已经转向浅色、中文、liquid glass、作品库感，说明 Phase 6 不需要重新决定整体主题，只需要把首页 / Explore 的层级与分工做得更明确。
- discovery 仍然是 published-only、cards-first、轻 chips 的结构，Phase 6 应继续强化这一方向，而不是引入后台式布局或复杂侧栏筛选。
- 共享组件已经开始承担 UI 统一职责，Phase 6 应继续通过共享组件的 variant 化完成首页与 Explore 的差异，而不是复制两套近似 UI。

### Integration Points
- 首页重构主要落点在 `apps/web/src/routes/+page.svelte`，需要围绕现有 feed 数据做“门面化首页 + 更明显 Explore 引导”。
- Explore 重构主要落点在 `apps/web/src/routes/explore/+page.svelte`，重点是减弱筛选工具感、强化结果画廊优先级。
- 卡片密度调整会集中在 `apps/web/src/lib/components/SnippetCard.svelte` 和相关 media / copy 子组件；planning 需要把首页 variant 与 Explore variant 的共享边界定义清楚。
- 所有改动都必须保持现有 URL filter、feed/search 数据流和 quick copy 行为可用，不能为了排版重构破坏当前 discovery contract。

</code_context>

<specifics>
## Specific Ideas

- 用户明确选择：首页 hero 要继续极简化，说明文字极少，只保留一句价值说明，不做长解释。
- 用户明确选择：首页 hero 后直接进入精选作品墙，不加中间说明层；而且首页只需要 1 个门面 snippet。
- 用户明确选择：卡片继续压成“封面优先”的资产卡，默认只露标题和 1 行 meta，复制按钮默认只保留图标。
- 用户明确选择：卡片上的 tag 与多余状态 chip 应进一步退场，避免再次显得像说明卡或后台列表。
- 用户明确选择：Explore 的顶部要更像工具条，筛选存在感更弱，结果画廊更快进入主视野。
- 用户明确选择：首页和 Explore 应明显分工：首页负责品牌门面，Explore 承担真正的筛选、比较与快速复制。

</specifics>

<deferred>
## Deferred Ideas

- 详情页、代码块、Prompt 区块和更细的响应式 polish 仍属于 Phase 7 范围，不在 Phase 6 里扩写。
- 如果后续还要做“首页超海报式编排”或更激进的 editorial art direction，可以作为 Phase 6 执行中的风格上限探索，但不应演变成新 capability。
- 多语言内容源、收藏、分享集合、社区互动等增长能力继续 deferred，不纳入本阶段。

</deferred>

---

*Phase: 06-discovery-surface-redesign*
*Context gathered: 2026-03-25*
