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

- [ ] 公开站需要从现有的功能可用 UI 升级到更有辨识度的视觉系统，并保留 Discovery 的核心效率
- [ ] 首页、Explore、详情页的主浏览文案需要切成中文，降低首次理解成本
- [ ] 新一轮 UI 重构必须保持 SwiftSnippet 的 SwiftUI-first 内容定位，不把精力扩散到后台或新平台能力

## Current Milestone: v1.1 视觉重构

**Goal:** 用更统一、更高级、中文优先的公开站视觉系统，提升首屏吸引力、浏览效率和品牌辨识度。

**Target features:**
- 首页采用更强的海报式首屏和深色视觉语言
- Explore 与详情页共享统一的深色组件、筛选与信息层级
- 主浏览流程的导航、状态、操作文案改成中文

## Next Milestone Goals

- 把公开站从“功能已通”升级到“风格明确、记忆点强、截图也成立”的视觉层级
- 在不改写 Discovery / Publish 后端边界的前提下，提升首页、Explore、详情页的一致性与可读性
- 为后续 UI phase / verification 留出清晰的中文文案与视觉标准，而不是继续沿用 v1 的英文占位语气

### Out of Scope

- 原生 iOS/macOS 客户端应用 — v1 先验证 Web 端内容分发与工作流闭环
- 企业级 SSO、审计日志、私有部署 — 商业化路线明确后再进入当前路线图
- 完整订阅付费系统与配额控制 — 属于验证后增长阶段，不阻塞核心价值验证
- 实时协作、评论社区、站内社交关系链 — 会显著放大复杂度，且不是 v1 的核心内容消费路径
- 面向所有前端/后端框架的通用代码片段库 — 当前聚焦 SwiftUI，避免协议和内容标准过早发散

## Context

这个项目起点是一份较完整的产品与架构设想文档，已经明确了内容卡片的三段式价值主张：演示视频、源代码、提示词模板。文档同时提出了前后端解耦的方向，倾向于用 SvelteKit 负责 Web 展示层、Go 负责 API 与发布/审核相关服务，再用对象存储和搜索引擎承接媒体与索引能力。

项目核心不是单纯“做一个教程站”，而是把内容协议和工程发布体系设计成产品本身的一部分。每个 snippet 需要有固定目录结构、结构化元数据、媒体与 license 声明、提示词模板与验收清单，这样后续 CI、AI 校验、审核发布和搜索索引才能稳定扩展。

文档里还给出了一批首发片段候选，覆盖卡片流 UI、交互动效、状态管理、工程化和 AI 协作模板。这意味着 v1 既有平台侧工作，也有内容供给侧工作；路线图必须同时考虑“系统能发布”和“内容足够证明系统有价值”。

## Constraints

- **Tech stack**: 前端优先采用 SvelteKit，后端优先采用 Go — 初始设想已经围绕这套分层展开，便于前后端职责清晰拆分
- **Content protocol**: 所有片段必须遵守统一仓库协议 — 否则无法保证自动校验、审核发布、搜索建索引和回滚一致性
- **Quality**: 片段必须尽量做到可运行、可复制、可验证 — 平台价值建立在“可信内容”而不是纯展示素材上
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

## Current State

v1.0 已完成并归档。SwiftSnippet 现在已经具备统一内容协议、published-only discovery 体验、可验证的 publish pipeline，以及一批可公开浏览和复用的 12 条首发内容。当前进入 v1.1，重点不是补新平台边界，而是把公开站 UI 做成更有辨识度、中文优先、适合公开展示的版本。

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
*Last updated: 2026-03-25 after v1.1 milestone kickoff*
