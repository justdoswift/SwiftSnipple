# Phase 4: Launch Content Batch - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只交付首批真实、可公开浏览、达到发布标准的 SwiftUI 片段内容，让 SwiftSnippet 在现有协议、Discovery 和 Publish Pipeline 之上形成“发现 -> 查看 -> 复制 -> 发布下一条内容”的完整内容闭环。它不再扩展新的平台能力，也不把 Phase 4 变成后台系统、搜索系统或商业化能力的继续建设；讨论只锁定首发内容批次该如何组成、验收和分批发布。

</domain>

<decisions>
## Implementation Decisions

### Batch composition and coverage
- **D-01:** 首发批次目标锁定为至少 12 条已发布 snippet，其中现有 `basic-card-feed`、`stacked-hero-card`、`review-only-meter` 作为第一批可复用种子，而不是另起一套样例体系。
- **D-02:** 这 12 条内容必须显式覆盖四个核心场景带：卡片流 UI、交互动效、数据状态、AI 协作模板；不能把 12 条都堆在单一视觉组件类目里。
- **D-03:** 内容组合优先选择高频、可复用、能直接服务 SwiftUI 开发者与 Vibe Coding 用户的题材，而不是为了“看起来丰富”引入边缘场景。
- **D-04:** 首发批次允许难度分层，但整体应以 easy / medium 为主，hard 题材只作为少量展示平台上限的补充，不让批次被少数高复杂度条目拖住。

### Launch quality bar
- **D-05:** 每条首发 snippet 在发布前都必须满足完整内容协议：合法 `snippet.yaml`、可用媒体路径、SwiftUI 代码或提示词资产、license 声明、以及与版本对齐的发布元数据。
- **D-06:** “真实内容”在 Phase 4 的含义是用户拿到后能立即复用，而不是只有占位描述；至少要有可复制代码或可复制提示词其中之一，最好两者兼具。
- **D-07:** 需要依赖动态交互才能体现价值的条目优先补 demo 视频；静态布局、状态基建或 AI 模板类条目可以接受 cover-only，但不能因此牺牲内容可理解性。
- **D-08:** 每条 snippet 的标题、摘要、标签、difficulty 和平台信息必须服务“几秒内判断是否可用”这个核心价值，不允许出现只有作者看得懂的命名或过于抽象的描述。

### Publish sequencing and launch pacing
- **D-09:** Phase 4 采用分波次发布，而不是等 12 条全部完成后一次性上线；优先尽快把现有 3 条内容作为首个可展示批次，再持续补齐到 12 条。
- **D-10:** 每一波发布都必须保持 category coverage 在变好，而不是连续发布同类 snippet；规划时要主动避免 feed 在视觉上显得题材单一。
- **D-11:** 发布顺序优先保证公开站能够演示完整用户价值链：至少尽早具备一个卡片流 UI、一个数据状态、一个 AI 协作模板和一个交互动效条目。
- **D-12:** Phase 4 的节奏目标是“持续补货并验证价值”，因此 planning 应优先拆成可独立完成并可单条发布的内容任务，而不是把所有首发内容绑成一个大工单。

### Reuse path and content consistency
- **D-13:** SwiftUI 代码类 snippet 要优先强调“可直接拷回项目”的主实现与最小预览入口，避免内容只停留在 demo 层。
- **D-14:** AI 协作类 snippet 要优先强调“可直接喂给模型”的 prompt / acceptance 资产，形成与代码类内容不同但同样明确的复用路径。
- **D-15:** 首发批次的摘要和标签体系应延续现有 Discovery 的轻量浏览方式，让用户在首页和 Explore 里能自然看出不同内容类型，而不是靠阅读长文案理解差异。
- **D-16:** 每条内容都应能支撑后续“发现 -> 查看 -> 复制 -> 发布下一条内容”的演示脚本，因此至少要保证其中部分条目彼此可串联，形成从 UI 组件到 AI 模板的连续故事线。

### the agent's Discretion
- 具体采用哪 12 个题目、每一波次各包含几条、以及 hard 题材占比由 planning 决定，但必须满足四类场景覆盖和 MVP 节奏约束。
- 哪些条目优先补 demo 视频、哪些条目以 cover-only 发布，由 planner 按内容类型和交互价值判断。
- 标签命名、摘要语气和 feed 中的内容多样性平衡由 planner 决定，但必须服务“快速判断可用性”的核心价值。
- 如果 `idea.md` 的 36 个候选与仓库现有 3 条种子之间存在空档，可在 Phase 4 内新增内容目录填补，但不能扩展到多技术栈或非 SwiftUI 范围。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and phase requirements
- `.planning/PROJECT.md` — 核心价值、SwiftUI-first 范围和 v1 仍聚焦内容发现/发布闭环的边界
- `.planning/REQUIREMENTS.md` — `SEED-01`、`SEED-02`、`SEED-03` 的正式 requirement 定义
- `.planning/ROADMAP.md` — Phase 4 目标、成功标准和“最后用真实内容验证平台”的阶段定位
- `.planning/STATE.md` — 当前项目已完成到 Phase 03 UAT，说明平台闭环已具备承载内容批次的基础

### Prior phase decisions
- `.planning/phases/01-foundation-protocol/01-CONTEXT.md` — 片段协议、目录结构、license 和版本追踪边界
- `.planning/phases/02-discovery-experience/02-CONTEXT.md` — Discovery 对卡片、详情、搜索和 published-only 内容展示的用户感知要求
- `.planning/phases/03-publish-pipeline/03-CONTEXT.md` — 发布链、artifact 刷新、visibility registry 和写路径约束
- `.planning/phases/03-publish-pipeline/03-UAT.md` — Phase 03 已通过真实发布链验证，Phase 4 可以直接依赖 publish flow 补货

### Content strategy and candidate pool
- `idea.md` §首批建议覆盖...（约第 297 行起）— 首发 36 个候选 snippet 列表、优先级、难度与是否需要视频
- `idea.md` §示例卡片完整样例 — 三段式卡片协议在真实内容中的落地样式参考

### Existing content and publish anchors
- `content/snippets/basic-card-feed/snippet.yaml` — 当前最完整的卡片流类 seed 内容
- `content/snippets/stacked-hero-card/snippet.yaml` — 当前布局/展示向 seed 内容
- `content/snippets/review-only-meter/snippet.yaml` — 当前数据状态/工具向 seed 内容
- `content/published/snippets.json` — 当前公开 feed 的已发布样本形态
- `content/published/visibility.json` — 当前公开可见性注册表
- `content/published/search-documents.json` — 当前公开搜索文档形态

### Validation and publish workflow anchors
- `packages/snippet-schema/src/schema.ts` — snippet manifest 的权威字段边界
- `packages/snippet-schema/src/validate.ts` — 内容协议校验入口
- `packages/snippet-schema/src/check-published-index.ts` — published index 校验入口
- `apps/api/README.md` — 本地 publish / review / publish 验证命令与写路径契约
- `README.md` §Phase 3 Publish Flow — 当前项目对发布链和公开产物刷新的统一说明

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `content/snippets/basic-card-feed`, `stacked-hero-card`, `review-only-meter`: 已经存在 3 条真实内容目录，可直接作为 Phase 4 的首批 anchor，而不是从 0 开始凑 12 条。
- `packages/snippet-schema`: 已经提供协议校验和 published index 校验，Phase 4 应把重点放在补内容，不重新发明内容质检方式。
- `content/published/*.json`: 现有公开索引格式已经能承载 feed/search/detail，新增内容只需通过 Publish Pipeline 进入该边界。

### Established Patterns
- 内容源以 `content/snippets/<id>/` 为唯一 canonical source，Phase 4 的新增条目必须沿用这一目录协议。
- Discovery 已被锁定为 published-only，因此未发布内容不会自动出现在前台；内容批次必须经过真实 review/publish 才算完成。
- Publish Pipeline 已支持 `draft -> review -> published` 和 artifact refresh，说明 Phase 4 的关键工作重心是内容生产与批量验收，而不是再造平台能力。

### Integration Points
- 新增 snippet 目录会先经过 `packages/snippet-schema` 的协议校验，再通过 Phase 3 的 publish 路径进入 `content/published/*.json`。
- 首发批次的验证应同时关注内容本身和公开展示结果，也就是既看 manifest / assets / license，也看它们在 feed/detail/search 中是否形成清晰价值。
- 规划时需要把内容生产任务和发布任务串起来，确保首批条目不是只存在于仓库，而是真正进入公开站点可浏览。

</code_context>

<specifics>
## Specific Ideas

- [auto] 首发 12 条内容优先从 `idea.md` 的 P0 候选池中选题，再用当前已存在的 3 条 snippet 作为第一波种子。
- [auto] 首发体验要让用户在首页就看到内容多样性，因此首批不做“12 条同类 UI 卡片”，而是混合卡片流、动效、状态和 AI 模板。
- [auto] 动效类条目更值得补 demo 视频；状态基建和 AI 模板类条目可以以更轻的媒体要求先落地，但必须保持复用路径清晰。
- [auto] Phase 4 的成败不只看数量，还要看能否自然演示“发现一个 snippet -> 复制复用 -> 再发布下一条内容”的产品故事。

</specifics>

<deferred>
## Deferred Ideas

- 超过首发 12 条之外的长尾候选内容、P1/P2 优先级扩充和更广题材覆盖，留到 v1 后续内容运营阶段。
- 多技术栈扩展、社区投稿体系、订阅内容分层和企业私有内容都不属于本阶段内容批次范围。
- 更重的内容运营工具、后台批量编排界面和自动化内容评分体系属于后续平台增强，不纳入 Phase 4 首发批次交付。

</deferred>

---

*Phase: 04-launch-content-batch*
*Context gathered: 2026-03-25*
