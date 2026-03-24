# Phase 1: Foundation Protocol - Research

**Researched:** 2026-03-24
**Domain:** greenfield monorepo foundations for SvelteKit + Go + PostgreSQL + schema-driven content contracts
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 采用单仓多应用结构，顶层按 `apps/`、`packages/`、`content/`、`infra/` 分层，避免在 Phase 1 就拆多仓或微服务。
- `content/snippets/` 作为内容主事实来源，应用代码与内容资产分离管理。
- 当前仓库按 greenfield 处理，不为兼容历史代码或历史内容结构增加迁移负担。
- 每个 snippet 必须以 `snippet.yaml` 作为结构化入口文件，并配套固定目录结构承载 Media、SwiftUI 代码、Prompt 资产、测试与 license 信息。
- Phase 1 只定义并校验协议，不尝试在本阶段完成大量真实 snippet 内容生产。
- 协议字段优先覆盖发布、索引、合规和复用所需的最小集合，避免一开始就为增长和商业化设计过宽字段。
- Phase 1 先定义 published 内容所需的核心数据模型和索引契约，不提前扩展订阅、企业权限或社区互动模型。
- 发布状态以最小状态机为目标，至少覆盖 draft、review、published 三类状态，以支撑后续发布 phase。
- 搜索与索引契约先围绕受控 facets、基础排序字段和公开展示字段设计，不在本阶段锁死高级排序算法。
- CI 门槛优先覆盖内容协议校验、Swift 格式/lint 校验和基础构建检查，作为后续所有 phase 的统一底线。
- 媒体校验、发布任务和索引刷新机制在本阶段只定义接口与校验入口，不要求完成完整发布流程。

### the agent's Discretion
- Phase 1 中具体使用哪种 schema 验证库、Go 数据访问层风格、前端样板细节和本地开发编排方式，由 planner 在遵守项目方向的前提下决定。
- 初始 fixture 与示例 snippet 的具体内容可采用最小可验证样本，只要能证明协议和 CI 可工作。

### Deferred Ideas (OUT OF SCOPE)
- Search engine final selection details
- Full publish pipeline orchestration
- Seed snippet batch definition
- Subscription, enterprise, and community capabilities
</user_constraints>

<research_summary>
## Summary

这一阶段研究的重点不是“选最潮的库”，而是把后续 phases 赖以生存的底座做得足够稳定。对于 SwiftSnippet 这种内容协议驱动项目，最标准的做法是：用一个共享 schema 包作为 manifest 权威源，用单仓目录把前端、后端、内容和基础设施明确分层，再用最小可运行 stub 证明这些边界不是纸面设计。

对当前仓库最合适的实现策略是：TypeScript + JSON Schema 负责 `snippet.yaml` 协议与 fixture 校验；SvelteKit 提供可运行的 Web stub；Go 提供清晰但极简的 API stub；PostgreSQL 用 compose + SQL migration 建立第一个真实数据库起点；CI 只阻断协议/结构、Web 构建、Go 构建和 Swift 质量检查入口，不在 Phase 1 提前做上传、索引和发布自动化。

**Primary recommendation:** 把 Phase 1 拆成“骨架与运行入口”“协议与 fixture 校验”“CI 与文档交接”三个执行单元，保证每一块都可独立验证。
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SvelteKit | 2.x | Web stub 与后续前台基础 | 当前项目已锁定前端方向，SvelteKit 对 SSR 和后续路由扩展最顺手 |
| Go stdlib HTTP | Go 1.25.x | API stub 与后续服务骨架 | Phase 1 只需最小接口边界，标准库足够且依赖最少 |
| PostgreSQL | 16 | 最小真实数据库基线 | 可直接承接 snippet、version、asset、publish state 四类核心实体 |
| TypeScript + JSON Schema | TS 5.x | `snippet.yaml` 权威类型与校验源 | 适合 CI、fixture 校验和未来前端/工具链复用 |
| Ajv + YAML | Ajv 8 / YAML 2 | Schema 验证与 YAML 解析 | 在 TS 环境里是 manifest 校验的标准组合 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pnpm workspaces | 10.x | Monorepo dependency management | 同时管理 Web 和 schema 包时使用 |
| svelte-check | 4.x | Web stub 类型和编译检查 | Phase 1 的 Web 核心门禁 |
| Docker Compose | 2.x | 本地 PostgreSQL 启动 | 需要一条命令起数据库时使用 |
| Swift toolchain | Swift 6.2.x | Swift fixture 构建与格式检查入口 | 用于验证 Swift snippet 样本不是空壳 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON Schema + Ajv | Zod-only runtime schema | 对 YAML manifest 和机器可共享 schema 不如 JSON Schema 标准 |
| Go stdlib HTTP | chi / gin | 后续可以加，但 Phase 1 只做 stub 时没必要先引入框架 |
| 真实 PostgreSQL migration | 只写 ERD/DDL 文档 | 会让后续 phase 重新补真实数据库起点，成本更高 |

**Installation:**
```bash
pnpm install
docker compose -f infra/postgres/docker-compose.yml up -d
cd apps/api && go build ./...
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```text
apps/
├── web/                 # SvelteKit web stub
└── api/                 # Go API stub
packages/
└── snippet-schema/      # manifest schema, types, validator, fixtures
content/
└── snippets/            # future real snippet content
infra/
└── postgres/            # compose + migrations
```

### Pattern 1: Contract-first content package
**What:** 把 manifest schema、TypeScript 类型、fixture 和校验 CLI 放在同一个共享包里。  
**When to use:** 内容协议是产品底座、后续会被多个子系统复用时。  
**Example:**
```typescript
const result = validateSnippetDirectory('fixtures/valid/basic-card-feed');
if (!result.ok) process.exit(1);
```

### Pattern 2: Runnable stubs over static scaffolds
**What:** 让 Web 和 API 在 Phase 1 就能跑起来，即便只有最小页面和最小接口。  
**When to use:** 后续 phases 会直接接这些入口，不希望留一堆“未来补”的壳。  
**Example:**
```go
mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
  writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
})
```

### Anti-Patterns to Avoid
- **先写一堆文档不落实际命令入口：** 会导致 Phase 2/3 重新探路，失去 Phase 1 的意义。
- **在协议包中同时维护两套权威 schema：** 容易漂移，Phase 1 必须只保留一个事实源。
- **把 Redis/Meilisearch/上传流程提前拉进来：** 会冲淡本阶段对协议和基础骨架的聚焦。
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML manifest validation | 手写 if/else 校验链 | JSON Schema + Ajv | 错误信息、枚举检查、结构约束更稳定 |
| Web type/build check | 自己拼 Svelte 编译命令 | `svelte-check` + `vite build` | 直接对齐 SvelteKit 标准链路 |
| DB lifecycle | 手写本地数据库说明不提供命令 | Docker Compose + SQL migrations | 后续 phases 直接复用，减少环境歧义 |

**Key insight:** Phase 1 最怕的是“看起来有结构，实际没有可执行底座”，所以尽量复用成熟工具链而不是自造流程。
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Schema source drifts from runtime validation
**What goes wrong:** 类型定义和校验逻辑并不一致，fixture 看似通过，运行时却能接收不同形状的数据。  
**Why it happens:** 同时维护手写类型和手写 validator。  
**How to avoid:** 只保留一个权威 schema，并让类型和 CLI 都围绕它组织。  
**Warning signs:** 同一个字段在类型、fixture 和校验代码里的必填性不一致。

### Pitfall 2: “Stub” 只有目录没有启动入口
**What goes wrong:** 后续 phases 需要补很多基础脚手架，Phase 1 价值大幅下降。  
**Why it happens:** 把“有目录”误当成“可运行骨架”。  
**How to avoid:** Web 和 API 至少都能本地启动并返回最小健康结果。  
**Warning signs:** README 里没有可复制命令，构建也无法单独运行。

### Pitfall 3: 把 Phase 3 的职责提前塞进 CI
**What goes wrong:** Phase 1 复杂度爆炸，核心目标反而模糊。  
**Why it happens:** 想一步到位把发布、媒体、AI 校验全加上。  
**How to avoid:** 只做核心门禁，后续流程只预留扩展位。  
**Warning signs:** CI 已经依赖对象存储、搜索引擎、复杂 secrets 配置。
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from current implementation direction:

### Protocol validation entry
```typescript
// Source: current schema package pattern
import { validateSnippetDirectory } from './validate.js';
const result = validateSnippetDirectory(snippetDir);
```

### Minimal Go health endpoint
```go
// Source: stdlib HTTP pattern used in API stub
mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
})
```

### SvelteKit load-based page stub
```typescript
// Source: apps/web route pattern
export const load = async () => ({ appMeta });
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 多数前端仓库手写 webpack/vite 配置 | SvelteKit/Vite 默认能力更完整 | 持续演进到 2024-2025 | Phase 1 不需要手写复杂前端构建 |
| 后端一开始就上重量框架 | 用标准库或轻路由先建边界 | 近几年更常见 | 基础 phase 更适合保持极简 |
| 内容协议只存在文档里 | schema + fixture + CLI 校验 | 成熟工程实践已收敛 | Phase 1 必须以可验证协议交付 |

**New tools/patterns to consider:**
- `svelte-check`: 在 stub 阶段就提供高信噪比类型/模板检查
- JSON Schema + fixture folders: 对内容平台尤其适合作为协议门禁

**Deprecated/outdated:**
- 纯文档驱动协议，没有可执行校验入口
- 只做目录 scaffold，不做可启动验证
</sota_updates>

<open_questions>
## Open Questions

1. **SwiftLint 安装策略**
   - What we know: 当前机器未安装 `swiftlint`
   - What's unclear: 是在仓库脚本中保持“缺失即失败”，还是后续补自动安装脚本
   - Recommendation: 先保持缺失即失败的明确提示，避免在仓库里隐式安装工具

2. **数据库连接在 Phase 1 的深度**
   - What we know: migration 和本地 PostgreSQL 已是强约束
   - What's unclear: API 是否需要在本阶段就实际 ping 数据库
   - Recommendation: 以“配置和运行入口就绪”为最低线，连接探测可留到后续 refinement
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` - 项目范围与核心价值
- `.planning/REQUIREMENTS.md` - Phase 1 requirement IDs
- `.planning/phases/01-foundation-protocol/01-CONTEXT.md` - 锁定决策
- `idea.md` - 协议、架构、CI 原始设想

### Secondary (MEDIUM confidence)
- 当前仓库已实现的 Phase 1 骨架代码与命令链路

### Tertiary (LOW confidence - needs validation)
- SwiftLint 的本地安装方式，因当前机器未安装需要后续环境验证
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: SvelteKit, Go, PostgreSQL, JSON Schema
- Ecosystem: pnpm workspaces, Ajv, Docker Compose, Swift toolchain
- Patterns: contract-first package, runnable stubs, minimal core gates
- Pitfalls: schema drift, non-runnable stubs, overbuilt Phase 1 CI

**Confidence breakdown:**
- Standard stack: HIGH - 已和当前实现方向对齐
- Architecture: HIGH - 目录和运行入口都已验证
- Pitfalls: HIGH - 与当前 phase 目标直接相关
- Code examples: HIGH - 来自现有仓库实现

**Research date:** 2026-03-24
**Valid until:** 2026-04-23
</metadata>

---

*Phase: 01-foundation-protocol*
*Research completed: 2026-03-24*
*Ready for planning: yes*
