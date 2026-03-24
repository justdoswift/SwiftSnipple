<!-- GSD:project-start source:PROJECT.md -->
## Project

**SwiftSnippet**

SwiftSnippet 是一个面向 SwiftUI 开发者与 Vibe Coding 用户的片段卡片流平台。它把可直接观看的交互演示、可复制的 SwiftUI 源码、可复用的提示词协议放进同一张内容卡片里，让用户从“看到效果”到“复制实现”再到“继续生成变体”形成顺滑闭环。首个版本以 Web 端内容发现与内容协议/发布系统为主，优先验证“高质量 SwiftUI 片段库是否能被持续消费和贡献”。

**Core Value:** 用户必须能在几秒内找到一个可信、可复制、可复用的 SwiftUI 片段，并立即把它带回自己的项目或 AI 工作流中。

### Constraints

- **Tech stack**: 前端优先采用 SvelteKit，后端优先采用 Go — 初始设想已经围绕这套分层展开，便于前后端职责清晰拆分
- **Content protocol**: 所有片段必须遵守统一仓库协议 — 否则无法保证自动校验、审核发布、搜索建索引和回滚一致性
- **Quality**: 片段必须尽量做到可运行、可复制、可验证 — 平台价值建立在“可信内容”而不是纯展示素材上
- **Search UX**: 搜索必须支持分面与权重排序 — 片段库可发现性是核心体验，简单全文检索不够
- **Security**: 上传、鉴权、速率限制、秘密扫描必须在早期进入底线设计 — 内容平台天然涉及媒体、第三方贡献与公开仓库风险
- **Scope**: v1 必须先完成最小闭环，而不是一次性做完商业化与企业能力 — 需要尽快验证核心价值，避免长周期空转
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| SvelteKit | 2.x | Web app and SSR content delivery | 适合快速搭建可索引的内容站、详情页与后台界面，同时支持服务端加载和静态/混合部署 |
| Go | 1.24.x | API gateway, content pipeline, upload signing, indexing jobs | 适合做结构清晰的 API、异步流水线和基础设施能力，运行成本低，部署简单 |
| PostgreSQL | 16.x | Primary relational store for snippets, versions, review states, users | 适合承载结构化内容元数据、发布状态、审核记录与后台查询 |
| Redis | 7.x | Feed/detail caching and rate-limit counters | 能把热门读路径与速率限制拆出主库，降低初期性能风险 |
| Meilisearch | 1.12.x | Faceted search and typo-tolerant snippet discovery | 对中小规模内容库上手快，分面与相关性能力足够支撑 MVP |
| S3-compatible object storage | Current managed version | Store demo videos, covers, generated indexes, versioned assets | 与预签名上传和 CDN 分发模式天然匹配，适合媒体型平台 |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 4.x | Web UI styling system for the SvelteKit frontend | 当需要快速搭建稳定的内容网格、过滤器和后台页面时使用 |
| Zod | 3.x/4.x | Request validation and schema-safe parsing in frontend/admin tools | 当前端和内部工具需要共享结构化验证时使用 |
| sqlc or pgx | Current stable | Type-safe database access in Go | 需要降低手写 SQL 出错率，同时保持数据库访问明确可审计时使用 |
| chi | 5.x | Lightweight HTTP routing for Go services | 当 API 仍然保持单一服务边界、无需重型框架时使用 |
| ffmpeg/ffprobe | 7.x | Media metadata extraction and validation in CI/pipeline | 对 demo 视频做分辨率、时长、帧率门槛校验时使用 |
| SwiftLint | 0.58.x | Swift style enforcement for snippet code | 在内容 CI 中校验 Swift 代码风格和约束时使用 |
| swift-format | 6.x aligned with Swift toolchain | Swift formatting baseline | 在 PR 校验和自动修复中统一代码格式时使用 |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| pnpm | Frontend package management | 安装快、锁文件稳定，适合前端站点和管理后台 |
| Air or reflex | Hot reload for Go API during development | 只在本地服务开发阶段需要 |
| Docker Compose | Local orchestration for Postgres, Redis, Meilisearch | 降低多人开发环境搭建成本 |
| GitHub Actions | CI/CD orchestration | 适合统一处理内容校验、构建、测试、发布和索引更新 |
## Installation
# Frontend
# Go backend
# Dev tools
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Meilisearch | Typesense | 如果内容量快速增长且更看重稳定的高性能查询与可调排序，可切到 Typesense |
| Go API | Node/Bun API | 如果团队后端只有 JavaScript 经验且需求偏轻量，可用同栈简化初期开发 |
| PostgreSQL | SQLite | 仅当项目极小且完全单机运行时，SQLite 才值得作为短期过渡 |
| Tailwind CSS | Hand-authored CSS modules | 如果设计语言高度定制且团队不喜欢 utility-first，可改用模块化 CSS |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| 一开始拆成多微服务 | 会过早引入部署、观测和数据一致性复杂度 | 单个 Go 服务 + 明确模块边界 |
| 只做静态 Lunr 搜索 | 分面与相关性调优能力不足，后续迁移成本高 | Meilisearch 或 Typesense |
| 直接把媒体经后端中转上传 | 增加带宽和权限暴露风险 | 预签名 URL + 对象存储 |
| 未版本化的媒体路径 | 回滚和 CDN 失效会变复杂 | 内容哈希或版本号路径 |
## Stack Patterns by Variant
- 用单个 SvelteKit 前端 + 单个 Go API + PostgreSQL/Redis/Meilisearch
- 因为这样最容易尽快打通闭环
- 引入异步 pipeline worker 处理媒体校验、索引更新和 AI 校验
- 因为主 API 不应被重任务阻塞
- 抽离搜索与对象存储配置层，避免云厂商耦合
- 因为企业交付通常要求更强的环境适配能力
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| SvelteKit 2.x | Node 20 LTS+ | 前端构建和 SSR 建议锁定 LTS 运行时 |
| Tailwind 4.x | 最新 PostCSS toolchain | 需要遵循 v4 的新配置方式 |
| Go 1.24.x | pgx v5 / chi v5 | 适合当前 API/服务实现 |
| Meilisearch 1.12.x | Current SDKs | 需要在索引字段设计阶段先定义好分面字段 |
## Sources
- idea.md — 初始产品、协议、架构和里程碑设想
- 社区通用工程模式推断 — 基于内容平台、搜索平台和媒体平台常见分层
- Official docs to verify later during implementation — SvelteKit, Go, Meilisearch, PostgreSQL, Redis, SwiftLint, swift-format
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
