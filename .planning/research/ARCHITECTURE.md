# Architecture Research

**Domain:** SwiftUI snippet card-feed platform
**Researched:** 2026-03-24
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
├─────────────────────────────────────────────────────────────┤
│  SvelteKit Web App  │  Search / Detail Pages  │  Admin UI  │
└──────────────┬───────────────┬──────────────────┬───────────┘
               │               │                  │
┌──────────────┴──────────────────────────────────────────────┐
│                       API Layer                             │
├─────────────────────────────────────────────────────────────┤
│ Go HTTP API: auth, feed, snippets, uploads, review, search │
└──────────────┬────────────────┬────────────────┬────────────┘
               │                │                │
┌──────────────┴───────┐ ┌──────┴────────┐ ┌─────┴────────────┐
│  PostgreSQL          │ │ Redis         │ │ Search Engine    │
│  metadata / review   │ │ cache / quota │ │ Meilisearch      │
└──────────────┬───────┘ └───────────────┘ └──────────┬───────┘
               │                                      │
        ┌──────┴──────────────────────────────┐  ┌────┴─────────┐
        │     Pipeline / Worker Layer         │  │ Object Store │
        │ validate, package, publish, index   │  │ media/assets │
        └──────────────────────────────────────┘  └──────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| SvelteKit frontend | 卡片流展示、详情页、搜索筛选、后台管理入口 | SSR + server load + client enhancement |
| Go API | 提供统一 JSON API、签发上传地址、处理审核与发布命令 | `net/http` + router + service modules |
| Pipeline worker | 异步执行结构校验、媒体校验、索引更新、发布打包 | background jobs / queue consumer |
| PostgreSQL | 持久化 snippet 元数据、版本、审核状态、用户与审计数据 | normalized relational schema |
| Search engine | 支持查询、分面、权重排序 | Meilisearch for MVP |
| Object storage | 存 demo 视频、封面、导出文件与发布产物 | S3-compatible bucket + CDN |

## Recommended Project Structure

```text
apps/
├── web/                # SvelteKit public site and internal admin pages
├── api/                # Go API service
└── worker/             # Go background publishing / indexing jobs

packages/
├── content-schema/     # snippet schema, fixtures, validation helpers
├── search-contracts/   # index document definitions and test fixtures
└── ui-content/         # optional shared front-end parsing/render helpers

content/
└── snippets/           # versioned snippet source directories

infra/
├── docker/             # local dependencies
└── ci/                 # pipeline scripts and workflow helpers
```

### Structure Rationale

- **apps/**: 把前台、API、异步任务拆成清晰执行单元，但不必拆成独立仓库
- **packages/**: 承载共享 schema 与索引契约，减少协议在多处漂移
- **content/**: 明确内容源与应用代码分离，方便发布与校验
- **infra/**: 把环境与 CI 脚本单独收纳，避免业务代码目录混乱

## Architectural Patterns

### Pattern 1: Content-as-Code

**What:** 片段内容以目录结构和元数据文件作为主事实来源  
**When to use:** 需要版本控制、代码审查、自动校验和可回滚发布时  
**Trade-offs:** 协议设计 upfront 成本高，但后续规模化收益明显

**Example:**
```typescript
type SnippetManifest = {
  id: string;
  title: string;
  version: string;
  facets: string[];
  assets: { cover: string; demo?: string };
};
```

### Pattern 2: Read-optimized Published Index

**What:** 前台主要读取“已发布索引”，而不是直接扫内容仓  
**When to use:** 内容需要审核、发布和回滚，前台体验要稳定时  
**Trade-offs:** 增加发布流程，但能显著降低线上不一致风险

**Example:**
```typescript
type PublishedSnippetCard = {
  id: string;
  title: string;
  summary: string;
  facets: Record<string, string[]>;
  coverUrl: string;
};
```

### Pattern 3: Async Publish Pipeline

**What:** 上传、校验、打包、索引更新异步执行  
**When to use:** 媒体、AI 校验或搜索建索引会拖慢请求时  
**Trade-offs:** 需要任务状态管理，但主 API 更稳定

## Data Flow

### Request Flow

```text
[User opens feed]
    ↓
[SvelteKit load] → [Go API /feed] → [Search + metadata store]
    ↓
[SSR/HTML response] ← [normalized card payload]
```

### State Management

```text
[Published content index]
    ↓
[Frontend filters + URL state]
    ↓
[Query params / server load]
    ↓
[API query + search facets]
```

### Key Data Flows

1. **Browse flow:** 用户打开卡片流，前端读取已发布 feed 数据并结合 facet 状态渲染列表
2. **Detail flow:** 用户进入详情页，读取已发布 snippet 详情、源码入口、提示词资产和媒体资源
3. **Publish flow:** 新片段提交后，pipeline 校验结构/媒体/license，通过后写入数据库与搜索索引
4. **Search flow:** 前端提交 query + facets，由搜索服务返回 hits 和 facet counts

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k active users | 单 API + 单 worker + 单搜索实例足够 |
| 1k-100k active users | 优先优化缓存、对象存储/CDN、搜索索引更新策略 |
| 100k+ active users | 才考虑拆分更细的服务边界与更强观测能力 |

### Scaling Priorities

1. **First bottleneck:** 搜索和媒体加载体验 — 先优化索引字段、缓存与 CDN
2. **Second bottleneck:** 发布流水线时长 — 通过队列和并行校验缩短内容上架时间

## Anti-Patterns

### Anti-Pattern 1: Frontend directly reading repo-shaped content

**What people do:** 让前台直接依赖原始文件结构  
**Why it's wrong:** 容易把草稿、不完整或未审核内容暴露出来  
**Do this instead:** 通过发布索引和显式状态读取“已发布视图”

### Anti-Pattern 2: Mixing protocol design with UI-specific hacks

**What people do:** 为了某个页面临时在元数据里塞展示字段  
**Why it's wrong:** 会让内容协议很快失去一致性  
**Do this instead:** 区分核心协议字段与派生展示字段

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Object storage | presigned upload + versioned asset paths | 媒体与发布产物都应可回滚 |
| CDN | cache immutable assets by version/hash | 避免媒体频繁回源 |
| Search engine | explicit indexing contracts | schema 变化要同步更新索引映射 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| web ↔ api | HTTP JSON | 早期足够简单清晰 |
| api ↔ worker | queue / persisted jobs | 发布任务不应阻塞用户请求 |
| api ↔ search | service wrapper | 避免搜索引擎细节泄漏到业务层 |

## Sources

- idea.md — 服务划分、架构图、数据流和发布设想
- 内容平台、媒体平台、搜索平台的常见工程模式推断

---
*Architecture research for: SwiftUI snippet card-feed platform*
*Researched: 2026-03-24*
