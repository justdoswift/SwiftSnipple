# Feature Research

**Domain:** SwiftUI snippet card-feed platform
**Researched:** 2026-03-24
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 卡片流浏览 | 用户首先要“先看效果再决定是否点开” | MEDIUM | 需要首屏快、缩略信息明确、滚动体验稳定 |
| 详情页展示演示/源码/提示词 | 这是产品最核心的消费闭环 | MEDIUM | 三类内容需要结构清晰且可复制 |
| 标签/分面筛选与全文搜索 | 片段库不支持发现会迅速失去价值 | MEDIUM | 至少支持平台、难度、分类、是否带视频等分面 |
| 统一内容协议与元数据 | 没有协议就无法规模化供给内容 | HIGH | `snippet.yaml`、目录结构、license 和 acceptance 要统一 |
| 基础发布流水线 | 用户需要看到的是“可信已发布内容”而不是随意堆文件 | HIGH | 至少包含 schema 校验、媒体校验、索引生成 |
| 媒体资源托管与加载 | 内容卡片高度依赖视觉演示 | MEDIUM | 需要封面图、demo 视频、CDN 分发 |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 提示词模板与验收清单并存 | 让片段既能复制代码，也能作为 AI 生成起点 | MEDIUM | 是与普通 SwiftUI 组件库最大的差异点 |
| 片段三段式卡片协议 | 演示、源码、提示词同仓管理，便于版本化 | HIGH | 能把内容生产和平台能力连起来 |
| AI 结构化校验 | 自动发现提示词、目录、acceptance 不一致问题 | HIGH | 先做有限规则校验，后续再引入更深的模型评审 |
| 首批高质量示例包 | 直接证明平台价值而不是只上线空壳系统 | HIGH | 需要平台建设与内容建设并行 |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| 一开始就做复杂用户社区 | 看起来能提升活跃度 | 会把项目重心从“内容资产”偏到“社交产品” | 先用 GitHub PR/Discussions 承接反馈 |
| 一开始就做全量付费订阅系统 | 便于尽早商业化 | 会拖慢核心闭环验证，还引入账单/权限复杂度 | 先做公开内容验证，再规划商业层 |
| 一开始支持多技术栈 | 显得市场更大 | 会让协议、搜索、审核、内容标准全部发散 | 先聚焦 SwiftUI |
| 全量自动审核无人值守发布 | 看起来省人力 | 媒体、代码、license 的误判成本高 | 先做自动校验 + 人工批准 |

## Feature Dependencies

```text
内容协议
    └──requires──> 元数据 Schema
                       └──requires──> CI 校验

卡片详情页
    └──requires──> 已发布索引
                       └──requires──> 发布流水线

分面搜索
    └──requires──> 规范化 facets 字段

投稿/审核
    └──requires──> 媒体上传签发
                       └──requires──> 对象存储

提示词模板
    ──enhances──> 详情页价值
```

### Dependency Notes

- **卡片详情页 requires 已发布索引:** 没有稳定索引和发布状态，前台无法可靠读取内容
- **分面搜索 requires 规范化 facets 字段:** 搜索质量取决于元数据约束，而不只是搜索引擎本身
- **投稿/审核 requires 媒体上传签发:** 媒体上传链路是内容发布闭环的一部分，不能后补
- **提示词模板 enhances 详情页价值:** 它不是浏览器是否能打开的硬依赖，但决定产品差异化

## MVP Definition

### Launch With (v1)

- [ ] 公开卡片流浏览与详情页 — 核心消费入口
- [ ] `snippet.yaml` + 固定目录协议 + 基础 schema 校验 — 内容生产底座
- [ ] 首版搜索与分面筛选 — 让内容可发现
- [ ] 媒体上传与发布索引流水线 — 让内容能稳定上架
- [ ] 首批 12-18 个高质量片段 — 证明内容库不是空架子
- [ ] 提示词模板与 acceptance checklist — 验证 AI 协作差异化

### Add After Validation (v1.x)

- [ ] Web 投稿/审核后台 — 当 PR 模式验证供给成立后补齐操作台
- [ ] 收藏与最近查看 — 当内容量上升，需要提高回访效率时加入
- [ ] 更细的搜索排序调优 — 当搜索结果开始出现召回与排序问题时加入
- [ ] 更多片段批次与质量报告 — 当平台稳定后继续扩大内容供给

### Future Consideration (v2+)

- [ ] 个人订阅、批量导出、离线包 — 需要用户价值和付费意愿被证明
- [ ] 企业私有索引、SSO、审计日志 — 需要明确企业场景
- [ ] 多平台与多技术栈扩展 — 当前先不稀释 SwiftUI 聚焦
- [ ] 社区讨论/评论/关注关系 — 不是内容平台初始核心

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 卡片流浏览 | HIGH | MEDIUM | P1 |
| 详情页三段内容展示 | HIGH | MEDIUM | P1 |
| 内容协议与 schema 校验 | HIGH | HIGH | P1 |
| 发布流水线与索引生成 | HIGH | HIGH | P1 |
| 分面搜索 | HIGH | MEDIUM | P1 |
| 提示词模板体系 | HIGH | MEDIUM | P1 |
| Web 审核后台 | MEDIUM | MEDIUM | P2 |
| 收藏/同步 | MEDIUM | MEDIUM | P2 |
| 订阅付费 | MEDIUM | HIGH | P3 |
| 企业功能 | LOW for MVP | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Competitor A | Competitor B | Our Approach |
|---------|--------------|--------------|--------------|
| 演示与代码并存 | 开源组件库常有 README GIF + code | 教程站通常有视频与 sample project | 卡片流层就同时露出演示与代码入口 |
| 提示词资产化 | 大多缺位 | 大多缺位 | 把提示词模板做成一等资产 |
| 内容协议 | GitHub repo 组织不统一 | 课程站通常不开放协议 | 用统一目录和元数据协议驱动 |
| 搜索与分面 | GitHub 搜索弱 | 教程站多偏分类导航 | 从第一版就内建分面检索 |

## Sources

- idea.md — 竞品、架构、内容协议、增长与里程碑草案
- 对片段库/内容平台的常见产品模式推断

---
*Feature research for: SwiftUI snippet card-feed platform*
*Researched: 2026-03-24*
