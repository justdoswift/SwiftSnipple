# SwiftSnippet

## What This Is

SwiftSnippet 是一个面向 SwiftUI 开发者与 Vibe Coding 用户的片段卡片流平台。它把可直接观看的交互演示、可复制的 SwiftUI 源码、可复用的提示词协议放进同一张内容卡片里，让用户从“看到效果”到“复制实现”再到“继续生成变体”形成顺滑闭环。首个版本以 Web 端内容发现与内容协议/发布系统为主，优先验证“高质量 SwiftUI 片段库是否能被持续消费和贡献”。

## Core Value

用户必须能在几秒内找到一个可信、可复制、可复用的 SwiftUI 片段，并立即把它带回自己的项目或 AI 工作流中。

## Requirements

### Validated

- [x] Phase 1 validated the `snippet.yaml`-driven content protocol, runnable repository skeleton, PostgreSQL baseline, and core CI gates.
- [x] Phase 2 validated the published-only feed, search, detail, and explicit `not_public` discovery experience.
- [x] Phase 3 validated the signed upload, review/publish transitions, artifact refresh, cache invalidation, and write-path rate limiting.
- [x] Phase 4 validated a 12-snippet public launch batch covering UI, interaction, state, and AI collaboration reuse paths.

### Active

- [ ] 维护者需要一个受保护的内部运营台来录入和编辑 snippet，而不是继续手工维护 `content/snippets`
- [ ] 后台保存必须继续以文件协议为权威源，避免后台数据与仓库内容分叉
- [ ] 内容录入、校验、Review、Publish 必须在同一条后台链路里闭环，减少运营切换成本

## Current Milestone: v1.2 内容运营后台

**Goal:** 把内部内容录入、编辑、校验与发布闭环包进 `/studio` 运营后台，降低新增 snippet 的维护成本。

**Target features:**
- `/studio` 提供管理员登录、snippet 列表、新建与编辑页
- 后台可以直接读写 `content/snippets/<id>/...` 与相关资产
- 后台复用现有 publish pipeline 的校验、review、publish 能力而不重写状态机

## Next Milestone Goals

- 让维护者从“手工编辑仓库文件”切换到“在后台完成录入与发布”
- 为后续批量补内容、补媒体和持续上新建立可复制的内部操作面
- 后台闭环稳定后，再决定是否回到公开站视觉 phase 收尾 v1.1 的剩余 UI 工作

### Out of Scope

- 原生 iOS/macOS 客户端应用 — v1 先验证 Web 端内容分发与工作流闭环
- 企业级 SSO、审计日志、私有部署 — 商业化路线明确后再进入当前路线图
- 完整订阅付费系统与配额控制 — 属于验证后增长阶段，不阻塞核心价值验证
- 实时协作、评论社区、站内社交关系链 — 会显著放大复杂度，且不是 v1 的核心内容消费路径
- 面向所有前端/后端框架的通用代码片段库 — 当前聚焦 SwiftUI，避免协议和内容标准过早发散
- 多人角色权限、Git 提交历史管理与可视化审计 — 这轮先把单管理员内部运营闭环跑通

## Context

这个项目起点是一份较完整的产品与架构设想文档，已经明确了内容卡片的三段式价值主张：演示视频、源代码、提示词模板。当前仓库的真实实现已经收口为 React + Vite 负责 Web 展示层，Go 负责 API 与发布/审核相关服务，再用对象存储和搜索引擎承接媒体与索引能力。

项目核心不是单纯“做一个教程站”，而是把内容协议和工程发布体系设计成产品本身的一部分。每个 snippet 需要有固定目录结构、结构化元数据、媒体与 license 声明、提示词模板与验收清单，这样后续 CI、AI 校验、审核发布和搜索索引才能稳定扩展。

文档里还给出了一批首发片段候选，覆盖卡片流 UI、交互动效、状态管理、工程化和 AI 协作模板。这意味着 v1 既有平台侧工作，也有内容供给侧工作；路线图必须同时考虑“系统能发布”和“内容足够证明系统有价值”。

## Constraints

- **Tech stack**: 前端当前采用 React + Vite，后端采用 Go — 后续 planning、部署和验收都必须以真实实现为准，避免文档与代码继续漂移
- **Content protocol**: 所有片段必须遵守统一仓库协议 — 否则无法保证自动校验、审核发布、搜索建索引和回滚一致性
- **Quality**: 片段必须尽量做到可运行、可复制、可验证 — 平台价值建立在“可信内容”而不是纯展示素材上
- **UI density**: 页面宁可更克制、更有留白，也不要为了“填满画面”把信息和控件堆得过密 — 低心智压力优先于高信息密度
- **UI copy**: 所有界面文案都必须是真实、面向用户的产品文案，不允许出现解释组件用途、提示开发意图或明显占位的说明性文字
- **UI sizing**: 标题层级、按钮高度、输入框高度、圆角和间距必须复用统一尺寸体系，避免页面级任意值导致界面没有章法
- **Component system**: 既然前端已收口到 `HeroUI React + Tailwind`，后续后台与公开站都应继续复用共享组件与 token，而不是在页面层大量覆写成另一套视觉
- **Search UX**: 搜索必须支持分面与权重排序 — 片段库可发现性是核心体验，简单全文检索不够
- **Security**: 上传、鉴权、速率限制、秘密扫描必须在早期进入底线设计 — 内容平台天然涉及媒体、第三方贡献与公开仓库风险
- **Scope**: v1 必须先完成最小闭环，而不是一次性做完商业化与企业能力 — 需要尽快验证核心价值，避免长周期空转

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 聚焦 SwiftUI 片段卡片流而不是泛化多技术栈片段平台 | 先服务一个明确且高价值的垂直场景，更容易定义内容协议和质量标准 | Phase 1 confirmed this focus in the protocol, fixture, and stub copy |
| 采用“演示视频 + 源码 + 提示词”三段式卡片模型 | 这是产品差异化来源，也能同时服务复制用户与 AI 协作用户 | Phase 1 schema and fixture lock this content contract |
| v1 先做 Web 平台与内容发布闭环 | 最快验证发现、复制、搜索、投稿、审核、发布这些核心流程 | Phase 1 established the runnable Web/API/database baseline |
| 内容协议以 `snippet.yaml` 和固定目录结构驱动 | 便于 CI、AI 校验、索引构建、许可证追踪与回滚 | Phase 1 validated this via JSON Schema, CLI, and fixtures |
| 路线图先收敛在 MVP 闭环，后置订阅、企业和增长体系 | 保持初始阶段可执行，减少一次性铺太宽的交付风险 | Still active after Phase 1 |
| 首发内容批次锁定为 12 条 SwiftUI 内容并优先展示多样性 | 首发必须同时证明“平台可用”与“内容值得消费” | Phase 4 shipped a 12-item published batch with 4 demo-backed highlights |
| 后台录入继续以文件协议为权威源，而不是引入独立 CMS 数据模型 | 这样可以复用现有 validator、publish pipeline 和仓库审阅流，避免双写 | Phase 8 admin studio implementation follows this decision |
| 视觉打磨默认优先留白与低压阅读节奏，而不是追求更高密度的信息堆叠 | 用户明确要求“不要怕空，怕太密”，后续 UI 决策应优先降低认知负担 | Locked on 2026-03-26 during Studio UI refinement |
| 所有 UI 文案必须像真实产品，而不是解释性说明或组件占位提示 | 用户明确要求界面里的文字不能带“给开发者看”的味道，后续所有页面都要按真实产品语气重写 | Locked on 2026-03-26 during Studio UI refinement |
| 所有 UI 尺寸必须复用统一层级与尺寸 token，而不是页面里各写各的字号、按钮和输入框高度 | 用户明确指出“字体大小没有章法”，后续所有 UI 必须先保证尺寸系统一致 | Locked on 2026-03-26 during Studio consistency audit |
| `HeroUI React + Tailwind` 必须作为真实共享组件体系来使用，而不是只保留组件壳再由页面层大面积覆写成另一套视觉 | 当前仓库已经不是 Svelte 路径，后续 UI 收口和部署都必须基于真实前端栈推进 | Updated on 2026-03-27 during UI cleanup |

## Current State

v1.0 已完成并归档。SwiftSnippet 现在已经具备统一内容协议、published-only discovery 体验、可验证的 publish pipeline，以及一批可公开浏览和复用的 12 条首发内容。`/studio` 后台与受保护的 admin API 已实现，并且后台与公开站都已经进一步收口到统一的 `HeroUI React + Tailwind` 组件体系；下一步重点回到这条录入/发布闭环的人工验收与真实使用顺滑度。

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition**:
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone**:
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 after current-stack documentation cleanup*
