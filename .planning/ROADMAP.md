# Roadmap: SwiftSnippet

**Created:** 2026-03-24
**Mode:** yolo
**Granularity:** coarse
**Total phases:** 4
**Total v1 requirements:** 24
**Mapped requirements:** 24 / 24

## Overview

SwiftSnippet 的 v1 路线图按“协议 -> 读路径 -> 发布 -> 首发内容”拆成 4 个阶段。这个顺序优先保证内容协议与发现体验，再补齐发布与种子内容，避免平台长期停留在只有后台或只有文档的状态。

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Foundation Protocol | 建立仓库结构、内容协议、基础数据模型与 CI 底座 | 6 | 4 |
| 2 | Discovery Experience | 交付公开卡片流、详情页和分面搜索的最小用户体验 | 9 | 4 |
| 3 | Publish Pipeline | 打通上传、审核、发布、索引更新和运行底线 | 6 | 4 |
| 4 | Launch Content Batch | 用首批真实片段验证平台闭环与内容价值 | 3 | 4 |

## Phase 1: Foundation Protocol

**Goal:** 建立项目基础骨架、内容协议、数据库/索引契约和 CI 校验底座，让后续所有阶段都建立在统一规范上。

**Requirements:** CPRT-01, CPRT-02, CPRT-03, CPRT-04, OPS-02, OPS-04

**Success criteria:**
1. 仓库中存在清晰的应用、内容、共享 schema 与基础环境结构，团队可本地启动核心依赖
2. `snippet.yaml`、目录结构、license/asset 要求与示例 fixture 已定义，且可通过自动校验验证
3. 主数据库与发布所需的核心数据模型已明确并可存储 snippet 元数据、版本与状态
4. CI 至少能运行内容协议校验、Swift 格式/lint 校验和基础构建检查

**Why first:**  
它直接回应“协议漂移”风险，也是搜索、发布和首批内容能够规模化推进的前提。

## Phase 2: Discovery Experience

**Goal:** 交付用户真正可使用的公开浏览体验，包括卡片流、详情页与可筛选搜索。

**Requirements:** DISC-01, DISC-02, DISC-03, DISC-04, DTL-01, DTL-02, DTL-03, DTL-04, OPS-03

**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — 定义 published-only discovery snapshot、visibility registry 与公开读模型契约
- [x] 02-02-PLAN.md — 在 Go `net/http` 边界上实现缓存化的 feed/search/detail 公开 API
- [ ] 02-03-PLAN.md — 用 SvelteKit 构建首页卡片流、Explore 搜索页和 snippet 详情页

**Success criteria:**
1. 用户能在 Web 端浏览已发布片段卡片，并看到标题、摘要、标签与预览媒体
2. 用户能通过关键词搜索和 facet 筛选快速缩小结果范围
3. 用户能打开详情页并分别查看 demo、源码、提示词与 license 信息
4. 前台只消费 published 数据视图，不会暴露草稿或未完成内容

**Why now:**  
这是最直接验证核心价值的读路径，也是后续发布与内容批次需要对接的真实消费面。

## Phase 3: Publish Pipeline

**Goal:** 建立可持续供给内容的后台闭环，让平台不依赖手工拼装上线。

**Requirements:** PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, OPS-01

**Success criteria:**
1. 维护者能够上传媒体、提交内容并通过明确的状态流转进入审核与发布
2. 发布流程会校验结构、媒体、license 和发布准备度，失败时给出可定位反馈
3. 发布成功后，公开站点所需的 published index 和搜索索引会同步更新
4. 资源敏感接口具备基本速率限制和运行安全底线

**Why here:**  
Phase 2 先证明消费面，Phase 3 再补齐供给面，保证真实内容能稳定进入系统。

## Phase 4: Launch Content Batch

**Goal:** 交付首批真实内容，验证 SwiftSnippet 不是空平台，而是一个可被使用的片段库。

**Requirements:** SEED-01, SEED-02, SEED-03

**Success criteria:**
1. 公开 feed 中至少有 12 个达到发布标准的真实 SwiftUI 片段
2. 首批片段覆盖卡片流 UI、交互动效、数据状态和 AI 协作模板等关键场景
3. 每个首发片段都至少提供可复用代码或可复用提示词资产
4. 团队可以完整演示“发现 -> 查看 -> 复制 -> 发布下一条内容”的闭环

**Why last:**  
真实内容是最终验证，但必须建立在协议、读路径和发布能力都可用之后。

## Phase Ordering Rationale

- 先协议，避免内容和实现早早分叉
- 再做用户读路径，尽快验证“这个东西值不值得用”
- 再做发布闭环，让平台能持续接纳真实内容
- 最后把内容批次作为正式交付，不让其被平台工作吞没

## Deferred After v1

- 收藏、同步、下载包、订阅与配额
- 企业私有部署、SSO、审计日志
- 平台内讨论区、关注机制与更强社区能力
- 多技术栈扩展

---
*Roadmap created: 2026-03-24*
