# Pitfalls Research

**Domain:** SwiftUI snippet card-feed platform
**Researched:** 2026-03-24
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: 内容协议过晚收敛

**What goes wrong:**  
前期快速堆片段，后期发现 metadata、目录、license、提示词格式各不相同，导致校验、索引和发布系统反复返工。

**Why it happens:**  
团队通常会先做展示界面，再补协议，结果内容标准被历史样本拖住。

**How to avoid:**  
第一阶段就冻结 `snippet.yaml`、目录结构、必填字段和发布状态机，并提供 fixture 与校验脚本。

**Warning signs:**  
同类片段目录结构不同；前台或搜索需要写特殊分支来兼容“旧内容”。

**Phase to address:**  
Phase 1

---

### Pitfall 2: 发布链路没有“已发布视图”

**What goes wrong:**  
前台直接依赖原始内容源，草稿、半成品、未审核媒体或损坏元数据会进入线上页面。

**Why it happens:**  
为了省事，开发者让前台直接读取仓库内容或数据库草稿记录。

**How to avoid:**  
区分 draft/review/published 状态，只允许前台读取发布索引或已发布记录。

**Warning signs:**  
前台出现“某些卡片打不开”“媒体 404”“搜索结果与详情不一致”。

**Phase to address:**  
Phase 2

---

### Pitfall 3: 只做搜索框，不做分面

**What goes wrong:**  
内容变多后，用户无法按平台、难度、类别等快速缩小范围，搜索体验劣化。

**Why it happens:**  
早期低估“片段发现”在产品价值中的权重。

**How to avoid:**  
在协议层先定义受控 facets，在前台和搜索索引里同时支持。

**Warning signs:**  
用户知道自己要找“动画 / iOS 17 / easy”的片段，但只能全文搜关键词。

**Phase to address:**  
Phase 2

---

### Pitfall 4: 内容供给计划落后于平台开发

**What goes wrong:**  
系统上线了，但没有足够高质量首发内容，用户无法感受到平台价值。

**Why it happens:**  
工程团队把“内容”视作后置填充项，而不是 MVP 组成部分。

**How to avoid:**  
把首批 12-18 个片段视为正式交付物，提前进入 roadmap 和验收标准。

**Warning signs:**  
只有协议和后台，没有可对外演示的真实卡片批次。

**Phase to address:**  
Phase 4

---

### Pitfall 5: 过早引入订阅、企业和社区系统

**What goes wrong:**  
路线图被账号、支付、权限、社区互动吞噬，核心“内容可信可复用”迟迟没有被验证。

**Why it happens:**  
团队容易把潜在商业化能力误当成首发必要能力。

**How to avoid:**  
把商业化、企业和社区能力明确列为 v2+，只有验证核心价值后再提升优先级。

**Warning signs:**  
需求讨论开始频繁围绕付费、SSO、审计，而不是内容质量和发现体验。

**Phase to address:**  
Roadmap framing / Phase 1 planning

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| 先手写少量 schema 校验，不上完整工具链 | 启动快 | 后续规则增多时容易散落 | MVP 可接受，但要集中在单个模块 |
| 先人工触发发布，不做全自动 | 降低早期复杂度 | 人工步骤容易遗漏 | MVP 可接受，只要状态和检查明确 |
| 前台先用静态 mock 数据做 UI | 提高页面开发速度 | 若拖太久会导致真实集成返工 | 仅限最早期界面验证 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Object storage | 服务端代传媒体文件 | 签发预签名 URL，让客户端直传 |
| Search engine | 在没有稳定 schema 前就频繁建索引 | 先确定 facets、排序字段、published 文档结构 |
| CI pipeline | 只有构建测试，没有内容和媒体校验 | 把 schema、媒体、license、prompt 校验都纳入 |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 卡片流首屏加载过重 | 首屏慢、滚动卡顿 | 轻量卡片 payload、缩略图优先、SSR + lazy media | 内容量和媒体量上升时 |
| 详情页直接加载过大源码/媒体 | 打开详情页迟缓 | 拆分元数据与重资源下载入口 | 首批内容超过十几个视频后 |
| 搜索排序依赖临时字段 | 结果不稳定、难调优 | 先定义 `quality_score`、`popularity_score` 等显式字段 | 搜索使用频率变高时 |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| 上传媒体前不做 mock 数据和敏感信息约束 | 可能泄露个人信息或内部服务信息 | 明确录制规范并在审核清单中检查 |
| 未限制上传和搜索接口速率 | 容易被刷流量或资源耗尽 | Redis/网关级限流，按 IP 和用户分层 |
| 第三方依赖与 license 未追踪 | 发布后出现合规风险 | 强制 `dependencies` 和 `THIRD_PARTY.md` |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| 卡片只展示标题，不展示价值摘要 | 用户无法快速判断是否值得点开 | 卡片上明确展示场景、难度、标签、是否带视频 |
| 详情页三类资产混在一起 | 用户难以找到复制入口 | 明确分区：Demo / Code / Prompt |
| 搜索结果不显示 facet counts | 用户无法理解筛选收益 | 提供可见的分面数量与当前筛选状态 |

## "Looks Done But Isn't" Checklist

- [ ] **卡片流:** 看起来能浏览，但缺少真实发布内容与真实媒体资源
- [ ] **搜索:** 看起来能搜，但没有 facets、权重和空结果体验
- [ ] **内容协议:** 看起来有 `snippet.yaml`，但没有 CI 与 fixture 验证
- [ ] **发布流程:** 看起来能上架，但没有可回滚的索引版本或状态机

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| 协议漂移 | HIGH | 冻结 schema，写迁移脚本，批量修复已有内容 |
| 发布视图缺失 | HIGH | 引入 published 索引层，隔离草稿数据源 |
| 搜索不可用 | MEDIUM | 回退到最小搜索模式，同时补 facets 与排序字段 |
| 内容供给不足 | MEDIUM | 缩减首发范围，优先做能代表价值的 12-18 个片段 |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 内容协议过晚收敛 | Phase 1 | schema、目录和 fixture 被写入并可校验 |
| 发布链路没有已发布视图 | Phase 2 | 前台只读取 published 数据 |
| 只做搜索框不做分面 | Phase 2 | 前台与索引都支持 facets |
| 内容供给落后于平台开发 | Phase 4 | 首发内容批次达到目标数量并全部可浏览 |
| 过早扩展商业化/企业能力 | Phase 1-4 planning | roadmap 中这些能力保持 v2+ |

## Sources

- idea.md — 风险、合规、搜索、内容协议与里程碑部分
- 内容平台和媒体/搜索系统的常见失败模式推断

---
*Pitfalls research for: SwiftUI snippet card-feed platform*
*Researched: 2026-03-24*
