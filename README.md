# SwiftSnippet

SwiftSnippet 是一个面向 SwiftUI 开发者与 Vibe Coding 用户的片段卡片流平台。当前仓库实现的是 Phase 1 的基础协议与项目骨架：内容协议、可运行 stub、本地 PostgreSQL、以及最小 CI 门槛。

## Repository Layout

- `apps/web` — SvelteKit Web stub
- `apps/api` — Go API stub
- `packages/snippet-schema` — `snippet.yaml` JSON Schema、TypeScript 类型与校验 CLI
- `content/snippets` — 真实 snippet 内容目录，后续 phases 在这里增加内容
- `infra/postgres` — 本地 PostgreSQL 与 migration
- `.planning/` — 项目规划与 phase 上下文

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

```bash
pnpm db:up
pnpm db:migrate
```

默认数据库连接：

- Host: `127.0.0.1`
- Port: `5432`
- Database: `swiftsnippet`
- User: `swiftsnippet`
- Password: `swiftsnippet`

### 3. Run the stubs

Web:

```bash
pnpm dev:web
```

API:

```bash
cd apps/api
go run ./cmd/api
```

默认 API 监听 `http://127.0.0.1:8080`。

## Snippet Protocol

`packages/snippet-schema` 是 `snippet.yaml` 的权威校验源。每个 snippet 目录必须遵守以下结构：

```text
<snippet-id>/
  snippet.yaml
  Media/
    cover.png
    demo.mp4
  Code/
    SwiftUI/
      Sources/
      Demo/
      README.md
    Vibe/
      prompt.yaml
      prompt.md
      acceptance.md
  Tests/
  LICENSES/
    THIRD_PARTY.md
```

当前 fixture 在 `packages/snippet-schema/fixtures`，包括：

- `valid/basic-card-feed` — 最小合法样本
- `invalid/missing-required` — 缺少必填字段
- `invalid/invalid-enum` — 枚举值非法

### Add a new fixture

1. 在 `packages/snippet-schema/fixtures/{valid|invalid}/<name>` 下创建目录
2. 添加 `snippet.yaml`
3. 按需创建协议要求的目录和占位文件
4. 运行：

```bash
pnpm verify:snippets
```

## Quality Gates

本阶段只启用核心门禁：

- Snippet schema / 目录结构校验
- Web stub type / build check
- Go API build / test
- Swift format / lint / build 检查入口

运行全部检查：

```bash
pnpm check
```

### Swift tooling note

本机需要安装：

- `swift-format`
- `swiftlint`

如果缺少任一工具，`pnpm check:swift` 会失败并提示安装。

## Phase 2/3 Contract Handoff

- Phase 2 必须复用 `packages/snippet-schema` 中定义的 manifest/types，而不是自行发明前台数据结构。
- Phase 2 的 published 内容展示必须建立在 Phase 1 定义的最小字段上：identity、classification、platform、assets、code/prompt/license metadata。
- Phase 3 必须复用数据库中的 publish state 与 asset contract，不应重新定义状态机。
- Redis、Meilisearch、上传签名、媒体处理和发布索引不在本阶段实现，只允许为它们预留扩展接口。
