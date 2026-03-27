# Project Research Summary

> Historical note: this summary reflects the initial research direction. Any `SvelteKit`-based wording should be read as historical planning context rather than the current stack.

**Project:** SwiftSnippet
**Domain:** SwiftUI snippet card-feed platform
**Researched:** 2026-03-24
**Confidence:** MEDIUM

## Executive Summary

SwiftSnippet 本质上是一个“内容协议驱动的开发者资产平台”，而不只是一个展示型教程站。研究结论非常明确：v1 的成败取决于是否同时打通三件事，第一是卡片流发现与详情消费体验，第二是 `snippet.yaml` 驱动的内容协议与自动校验，第三是从内容提交到已发布索引的最小发布闭环。只做前台页面或只做内容仓库都不足以验证核心价值。

推荐路线是以 SvelteKit 作为 Web 展示层，用 Go 提供 API 与发布流水线能力，采用 PostgreSQL + Redis + Meilisearch + 对象存储的经典组合。这样既能快速搭建公开内容站，也能为后续审核、搜索和媒体扩展保留足够的工程弹性。

最大风险不是技术实现难度本身，而是范围膨胀和协议漂移。若一开始把商业化、企业能力、社区互动都拉进 v1，或者先堆内容再补协议，后续会迅速失去可扩展性。路线图应优先保证“可信内容可以被稳定发现、查看、复制、发布”。

## Key Findings

### Recommended Stack

MVP 推荐使用 SvelteKit 2.x、Go 1.24.x、PostgreSQL 16、Redis 7、Meilisearch 1.12 和 S3 兼容对象存储。这个组合的优点是职责边界清晰、部署简单、前后端都能独立推进，同时足以支撑 SSR 卡片流、搜索分面、媒体托管和异步发布。

**Core technologies:**
- SvelteKit: Web 展示与后台入口，负责卡片流、详情页与 SSR 可索引页面
- Go: 负责 feed/detail/search/upload/review/publish API 与异步任务
- PostgreSQL: 负责 snippet 元数据、版本、审核状态、用户与发布记录
- Meilisearch: 负责分面筛选与搜索召回
- Object storage + CDN: 负责视频、封面与发布产物分发

### Expected Features

研究显示，v1 的 table stakes 不是“完善账号系统”，而是“可信内容能被发现和复用”。因此必须优先实现卡片流浏览、详情页三段资产展示、搜索/分面、内容协议、发布流水线与媒体托管。

**Must have (table stakes):**
- 卡片流浏览与详情页闭环 — 用户必须能浏览、点开、复制与理解片段
- 统一内容协议与自动校验 — 平台必须能持续接纳高质量内容
- 分面搜索 — 内容一多，可发现性就是核心体验
- 发布索引与媒体托管 — 线上只应暴露已发布内容

**Should have (competitive):**
- 提示词模板与 acceptance checklist — 形成 AI 协作差异化
- AI 结构化校验 — 提高内容与提示词质量的一致性

**Defer (v2+):**
- 订阅付费与配额体系 — 非首发核心
- 企业私有部署、SSO、审计 — 商业化后再推进
- 社区互动能力 — 先用外部协作工具承接反馈

### Architecture Approach

建议采用单仓但模块化的结构：`apps/web`、`apps/api`、`apps/worker` 承载应用逻辑，`packages/` 承载 schema/索引契约，`content/snippets/` 承载真实片段内容。前台只读 published 视图，发布与搜索建索引通过异步 worker 完成，避免把草稿内容直接暴露给用户。

**Major components:**
1. Web app — 负责卡片流、详情页、搜索筛选和管理入口
2. API service — 负责内容读取、上传签发、审核与发布命令
3. Pipeline worker — 负责校验、打包、索引更新和回滚支持
4. Search index — 负责 query、facets 和排序
5. Object storage/CDN — 负责媒体与发布静态产物

### Critical Pitfalls

1. **协议过晚收敛** — 第一阶段就固定 `snippet.yaml`、目录与校验脚本
2. **没有已发布视图** — 只让前台消费 published 数据和索引
3. **没有分面搜索** — 先设计 facets 字段，再谈搜索 UI
4. **平台先于内容** — 把首批内容作为正式交付，不是补充物料
5. **范围膨胀** — 把订阅、企业、社区能力后置到 v2+

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation Protocol
**Rationale:** 所有后续能力都依赖稳定的内容协议与仓库结构  
**Delivers:** monorepo 骨架、`snippet.yaml` 规范、基础 fixture、最小开发环境  
**Addresses:** 内容协议、内容仓结构、基础开发底座  
**Avoids:** 协议漂移

### Phase 2: Content Read Path
**Rationale:** 先把“浏览、搜索、详情”读路径打通，验证用户价值  
**Delivers:** 卡片流、详情页、分面搜索、published 读取模型  
**Uses:** SvelteKit、Go API、Meilisearch  
**Implements:** 前台体验与查询边界

### Phase 3: Publish Pipeline
**Rationale:** 平台必须能持续接纳内容，不能只展示 mock 数据  
**Delivers:** 上传签发、结构校验、媒体校验、审核状态与发布索引  
**Uses:** object storage、worker、Redis、PostgreSQL  
**Implements:** 发布闭环

### Phase 4: Launch Content Batch
**Rationale:** 没有真实内容就无法证明产品价值  
**Delivers:** 首批 12-18 个片段、质量门槛、公开可演示站点  
**Uses:** 全部前序能力  
**Implements:** 内容供给与对外验证

### Phase Ordering Rationale

- 先协议，再读路径，再发布，再内容批次，符合依赖顺序
- 搜索和详情不能晚于发布太多，否则平台会一直停留在“后台工具”状态
- 内容批次必须成为独立 phase，避免被平台开发无限挤压

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** 搜索字段、排序策略、SvelteKit SSR 数据加载细节需要实施级确认
- **Phase 3:** 对象存储、媒体校验、审核状态机和搜索索引更新需要实施级确认

Phases with standard patterns (skip research-phase):
- **Phase 1:** 仓库结构、schema、基础工程脚手架相对标准

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | 方向明确，但具体版本仍需实施时核对官方文档 |
| Features | HIGH | 核心价值和 v1/v2 分层已经比较清晰 |
| Architecture | MEDIUM | 结构清晰，但真实 repo 布局仍需随实现校准 |
| Pitfalls | HIGH | 风险主要来自范围与流程，已比较明确 |

**Overall confidence:** MEDIUM

### Gaps to Address

- 搜索引擎最终选择还需要在实现前做一次成本与运维权衡
- 首批 12-18 个片段的精确清单需要在内容 phase 中进一步确认
- 后台审核入口是直接用 Web admin 还是先以 PR 驱动，需要 Phase 3 决策

## Sources

### Primary (HIGH confidence)
- idea.md — 项目原始设想、协议、架构、内容、风险和里程碑

### Secondary (MEDIUM confidence)
- 通用内容平台、媒体分发、搜索平台和开发者资产库的常见工程模式

### Tertiary (LOW confidence)
- 具体依赖版本与某些服务实现细节，需要在 phase planning 时再核官方文档

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
