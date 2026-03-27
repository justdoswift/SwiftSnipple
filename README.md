# SwiftSnippet

SwiftSnippet 是一个面向 SwiftUI 开发者与 Vibe Coding 用户的片段卡片流平台。当前仓库已经包含可运行的公开发现站、Go API、内部 `/studio` 运营后台、本地 PostgreSQL，以及内容协议和发布链路。

## Repository Layout

- `apps/web` — React + Vite Web app（公开发现站 + `/studio`）
- `apps/api` — Go API
- `packages/snippet-schema` — `snippet.yaml` JSON Schema、TypeScript 类型与校验 CLI
- `content/snippets` — 真实 snippet 内容目录，后续 phases 在这里增加内容
- `infra/postgres` — 本地 PostgreSQL 与 migration
- `.planning/` — 项目规划与 phase 上下文

## Quick Start

### 1. Prepare env and dependencies

```bash
cp .env.example .env
pnpm install
```

如果你本地已经有 PostgreSQL 在运行，只要把 `.env` 里的 `DATABASE_URL` 改成可用连接，启动脚本会优先复用它，不会强制再起一个库。

### 2. One-command local startup

```bash
pnpm dev
```

这条命令会按顺序完成：

- 复用现有 `DATABASE_URL`，如果连不上再回退到 `infra/postgres/docker-compose.yml`
- 执行数据库 migration
- 启动 Go API
- 启动 React Web

默认数据库连接：

- Host: `127.0.0.1`
- Port: `5432`
- Database: `swiftsnippet`
- User: `swiftsnippet`
- Password: `swiftsnippet`

默认服务地址：

- API: `http://127.0.0.1:18080`
- Web: `http://127.0.0.1:13000`

### 3. Split startup if needed

```bash
make db-up      # 仅启动项目自带 postgres
make api        # 仅启动后端
make web        # 仅启动前端
make dev-all    # 一键启动前后端 + 数据库
pnpm stop       # 停止 dev 脚本启动的进程
```

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

当前核心门禁包括：

- Snippet schema / 目录结构校验
- Web type / build / e2e check
- Go API build / test
- Swift format / lint / build 检查入口

运行全部检查：

```bash
pnpm check
```

## Phase 3 Publish Flow

Phase 3 现在提供了最小可验证的供给侧闭环：

- `POST /api/v1/media/upload-url` 为 `cover` / `demo` 资产签发受约束上传地址
- `POST /api/v1/publish/snippets/{id}/review` 执行 `draft -> review`
- `POST /api/v1/publish/snippets/{id}/publish` 先做协议 + 发布准备度校验，再执行 `review -> published`，并刷新 `content/published/snippets.json`、`content/published/visibility.json`、`content/published/search-documents.json`

本地验证命令：

```bash
pnpm db:up
pnpm db:migrate
cd apps/api && go test ./internal/storage ./internal/publish ./internal/ratelimit ./internal/httpapi
pnpm check:published-index
```

如果要手动走一遍发布链路，参见 [`apps/api/README.md`](/Users/gepeng/Documents/coolweb/SwiftSnippet/apps/api/README.md) 中的 `upload-url / review / publish` `curl` 示例。

### Swift tooling note

本机需要安装：

- `swift-format`
- `swiftlint`
- `docker`（用于本地 Postgres 或作为 `psql` 缺失时的 fallback 客户端）

如果缺少任一工具，`pnpm check:swift` 会失败并提示安装。
如果本机没有 `psql`，仓库脚本会自动回退到 `postgres:16` 容器内的 `psql` 客户端。

## Phase 2/3 Contract Handoff

- Phase 2 必须复用 `packages/snippet-schema` 中定义的 manifest/types，而不是自行发明前台数据结构。
- Phase 2 的 published 内容展示必须建立在 Phase 1 定义的最小字段上：identity、classification、platform、assets、code/prompt/license metadata。
- Phase 3 必须复用数据库中的 publish state 与 asset contract，不应重新定义状态机。
- Redis、Meilisearch、上传签名、媒体处理和发布索引不在本阶段实现，只允许为它们预留扩展接口。

## Frontend Deployment Note

`apps/web` 当前通过 `VITE_API_BASE_URL` 读取外部 API 地址；本地开发未设置时继续走相对 `/api` 路径和 Vite 代理。要部署前端预览时，请同时准备：

- 一个可访问的 Go API 地址
- 对应 API 使用的 PostgreSQL
- 前端环境变量 `VITE_API_BASE_URL`
