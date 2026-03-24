# Phase 3: Publish Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 3-Publish Pipeline
**Areas discussed:** Submission entry and upload boundary, Review and publish state flow, Validation and publish gate, Safety rails and operational limits

---

## Submission entry and upload boundary

| Option | Description | Selected |
|--------|-------------|----------|
| A | 先交付后端 API，签发预签名上传 URL，后台表单后置 | ✓ |
| B | 先做完整 Web 投稿/后台上传页，再补 API | |
| C | 临时手工上传媒体，发布能力后补 | |

**User's choice:** `[auto] A`
**Notes:** Phase 3 目标是补齐供给闭环而不是扩展后台体验；预签名上传 API 最直接满足 `PIPE-01`，同时保持“调用方不持有云凭证”的核心边界。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 只覆盖 `cover` 与可选 `demo` 这两类核心 Discovery 资产 | ✓ |
| B | 做成通用附件中心，支持任意素材类别 | |
| C | 只支持 demo 视频，其他资源手工维护 | |

**User's choice:** `[auto] A`
**Notes:** 当前 Discovery 公开消费的关键媒体就是 `cover` / `demo`，先把这些资产通路打通，避免发布系统过早泛化。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 对象路径按 `snippet_id/version/asset_type` 规范化 | ✓ |
| B | 只按 snippet_id 分类，版本覆盖旧内容 | |
| C | 完全交给上传端自定义路径 | |

**User's choice:** `[auto] A`
**Notes:** 规范化路径最利于版本追踪、回滚与 CDN 缓存策略，也与 `idea.md` 的原始设想一致。

| Option | Description | Selected |
|--------|-------------|----------|
| A | API 为主，Web 表单不是 Phase 3 阻塞项 | ✓ |
| B | Web 和 API 必须同时完成 | |
| C | 只做手工脚本，不做线上 API | |

**User's choice:** `[auto] A`
**Notes:** 按 roadmap，Phase 3 重点是平台供给能力闭环，而不是额外 UI 面；API-first 更贴合阶段边界。

---

## Review and publish state flow

| Option | Description | Selected |
|--------|-------------|----------|
| A | 严格沿用 `draft -> review -> published` 三态 | ✓ |
| B | 扩展更多状态，例如 `scheduled` / `rejected` / `deprecated` | |
| C | 只保留 `draft` 和 `published` 两态 | |

**User's choice:** `[auto] A`
**Notes:** Phase 1 已锁定最小状态机，Phase 3 应先把这条路径做实，而不是重开状态设计。

| Option | Description | Selected |
|--------|-------------|----------|
| A | `review` 表示可进入自动校验和人工审核，`published` 仍需显式动作 | ✓ |
| B | 校验通过后自动发布 | |
| C | 只要切到 `review` 就对公开站可见 | |

**User's choice:** `[auto] A`
**Notes:** 这能保持人工审核与显式公开的边界，避免“工具通过即自动上线”的误发布。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 公开站只看发布产物，不直接判断原始源数据 | ✓ |
| B | 前台直接按数据库状态过滤 | |
| C | 前台直接读取内容目录，绕过发布产物 | |

**User's choice:** `[auto] A`
**Notes:** Phase 2 已经验证公开读路径建立在 `content/published` 产物上，Phase 3 不能破坏这个契约。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 发布新版本时替换公开快照，保留版本追踪与回滚基础 | ✓ |
| B | 直接在公开快照里原地修改条目 | |
| C | 每次发布都重新设计新的公开结构 | |

**User's choice:** `[auto] A`
**Notes:** 这与 `snippet_version`、`source_revision`、`content_hash` 等已有方向一致，也为回滚留下基础。

---

## Validation and publish gate

| Option | Description | Selected |
|--------|-------------|----------|
| A | 复用现有 schema/asset 校验，再补媒体与发布准备度门禁 | ✓ |
| B | 为发布单独实现一套全新 validator | |
| C | 发布时只做最轻校验，把问题留到人工审核 | |

**User's choice:** `[auto] A`
**Notes:** 复用 Phase 1 协议门禁能避免标准分裂，也最符合“小闭环优先”的阶段策略。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 发布结果要给出可定位失败原因 | ✓ |
| B | 统一返回 `publish failed` | |
| C | 失败细节只写服务日志，不给调用方 | |

**User's choice:** `[auto] A`
**Notes:** `PIPE-03` 面向维护者工作流，失败若不可定位，发布闭环就不可持续。

| Option | Description | Selected |
|--------|-------------|----------|
| A | Phase 3 先允许同步或准同步最小闭环，但边界要能演进到 worker | ✓ |
| B | 一开始就强制完整异步队列架构 | |
| C | 全部塞进单个巨大 HTTP handler，不考虑后续演进 | |

**User's choice:** `[auto] A`
**Notes:** 这在交付速度和架构演进之间最平衡，也与 `idea.md` 对 worker 的长期方向一致。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 发布动作必须输出 published snapshot、visibility registry、search documents 等明确产物 | ✓ |
| B | 只改数据库状态，公开索引手工维护 | |
| C | 先只生成 public snapshot，搜索文档完全留到后面 | |

**User's choice:** `[auto] A`
**Notes:** 这样才能真正覆盖 `PIPE-04` 和 `PIPE-05`，并保持 Phase 2 公共读路径继续可用。

---

## Safety rails and operational limits

| Option | Description | Selected |
|--------|-------------|----------|
| A | 限流优先保护上传 URL 和发布动作等资源敏感写接口 | ✓ |
| B | Phase 3 只做读接口限流 | |
| C | 所有接口一次性全量上复杂配额系统 | |

**User's choice:** `[auto] A`
**Notes:** 这最贴近 `OPS-01` 的实际风险面，也符合“先补写路径底线”的阶段目标。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 规则先按 IP / 调用方身份做最小端点级 token bucket 策略 | ✓ |
| B | 不区分端点，一刀切统一限制 | |
| C | 直接做账户级计费配额系统 | |

**User's choice:** `[auto] A`
**Notes:** 端点级最小策略更容易解释和落地，也避免把计费/商业化提前拉进来。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 发布前默认执行 mock-data / secret hygiene 底线检查 | ✓ |
| B | 只依赖人工审核判断是否含敏感信息 | |
| C | 暂时不处理，后续再加 | |

**User's choice:** `[auto] A`
**Notes:** `idea.md` 已明确媒体和 prompt 资产的敏感信息风险，Phase 3 是最自然的落点。

| Option | Description | Selected |
|--------|-------------|----------|
| A | DCO/CLA、reviewer tooling 等只保留接口意识，不做完整系统 | ✓ |
| B | 把整套贡献治理系统也纳入 Phase 3 必交付 | |
| C | 完全忽略贡献治理方向 | |

**User's choice:** `[auto] A`
**Notes:** 这样既不丢产品方向，也不把 Phase 3 范围膨胀到后台治理平台。

---

## the agent's Discretion

- 预签名 URL 的具体请求字段、哈希校验要求、和对象存储抽象层形式
- 发布动作采用同步、异步还是混合编排的最小实现
- published snapshot / search document 的文件格式和生成命令组织
- token bucket 的具体参数、键策略与 middleware 结构

## Deferred Ideas

- 完整投稿后台、review dashboard、和 richer reviewer tooling
- 搜索引擎最终定型与规模化索引架构
- 更完整的身份系统、角色权限与企业治理
- DCO/CLA 自动化和更重的合规系统
