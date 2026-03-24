# Phase 3: Publish Pipeline - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只交付内容供给侧的最小发布闭环：媒体上传签发、snippet 的 `draft -> review -> published` 状态流转、发布前校验、published index / search document 刷新，以及资源敏感接口的速率限制底线。它不扩展公开 Discovery 体验本身，也不引入订阅、企业权限、社区协作或更重的后台系统；讨论只锁定这条供给链应如何运作，而不是扩展新的产品面。

</domain>

<decisions>
## Implementation Decisions

### Submission entry and upload boundary
- **D-01:** Phase 3 的上传入口以维护者 / 贡献者可调用的后端 API 为主，优先交付签发预签名上传 URL 的能力，而不是先做完整 Web 后台表单。
- **D-02:** 上传流程必须保持“上传者不直接接触云凭证”的边界，后端只签发带约束的上传参数，媒体实际内容直接进入对象存储路径。
- **D-03:** 媒体对象路径延续 `snippet_id/version/asset_type` 这一规范化思路，保证版本追踪、回滚和 CDN 缓存策略可依赖稳定命名。
- **D-04:** Phase 3 只覆盖平台所需的核心媒体资产通路，默认以 `cover` 和可选 `demo` 这两类 Discovery 已消费的资产为优先，不把上传面扩展成任意附件管理器。

### Review and publish state flow
- **D-05:** 发布状态严格沿用 Phase 1 已锁定的最小状态机：`draft`, `review`, `published`；本阶段不再引入更多工作流状态。
- **D-06:** 公开站能读到什么，必须只由 publish state 和生成后的 published artifacts 决定，而不是由前台直接判断原始 snippet 目录或草稿记录。
- **D-07:** 进入 `review` 代表内容已经准备接受自动校验与人工审核；进入 `published` 必须是显式发布动作，不能把“通过校验”自动等同于公开发布。
- **D-08:** 已发布条目的更新采用“发布新版本并替换公开快照”的模型，而不是在公开索引中原地手改，确保回滚和来源追踪始终可做。

### Validation and publish gate
- **D-09:** 发布前校验必须复用 Phase 1 已有的内容协议与结构门禁，并在此基础上增加媒体约束、license 完整性和“可发布准备度”检查，而不是另起一套发布专用标准。
- **D-10:** 发布失败时，系统需要给出面向维护者可定位的失败原因，优先做到“知道是哪一类门禁没过”，而不是只返回笼统失败。
- **D-11:** Publish pipeline 先以同步或准同步的最小闭环实现为目标，但校验步骤与产物生成边界要能自然演进到 worker / queue 执行，不把流程写死在单请求大事务里。
- **D-12:** 发布动作应生成明确的产物边界，包括 published snapshot / visibility registry / search documents；公开站和搜索更新都只消费这些发布产物，不直接消费草稿源数据。

### Index refresh and cache coherence
- **D-13:** 发布成功后必须刷新 public discovery 所依赖的 published index，并保持与 explicit visibility registry 同步，避免公开站出现“状态已变更但快照未对齐”的中间态。
- **D-14:** 搜索文档刷新是 Publish Pipeline 的一部分，但 Phase 3 不强制锁定最终搜索引擎；先把“发布后有可更新的 search document artifact”这一边界锁定下来。
- **D-15:** 发布产物需要具备版本或来源标识，至少能追溯到 snippet version / source revision，保证回滚时前台和搜索都能回到一致快照。
- **D-16:** Discovery 当前基于缓存化的 published response 工作，因此发布刷新必须默认考虑 cache coherence，但不要求本阶段就实现复杂分布式失效系统。

### Safety rails and operational limits
- **D-17:** 速率限制优先覆盖资源敏感且容易被滥用的写路径接口，例如上传 URL 签发和发布动作；不要求在本阶段对所有公开读接口重做一轮策略。
- **D-18:** 速率限制规则以简单明确的端点级策略为主，可先按 IP 或调用方身份实现最小底线，不在本阶段扩展到完整配额/计费体系。
- **D-19:** Demo 媒体、截图与提示词资产进入公开发布链前，必须默认遵守 mock data / secret hygiene 的底线，避免把含敏感信息的素材推进公开产物。
- **D-20:** Phase 3 聚焦“维护者可持续发布内容”的平台闭环；贡献者身份治理、DCO/CLA 细化和更重的 reviewer tooling 只保留接口意识，不作为本阶段必须交付的完整系统。

### the agent's Discretion
- 预签名上传请求的精确参数结构、哈希校验粒度、以及对象存储适配层的抽象方式由 research / planning 阶段决定，只要不突破“调用方不持有云凭证”的边界。
- 发布校验是同步 HTTP 处理、后台 job 触发，还是二者混合的最小实现，由 planner 结合当前 Go 服务结构与 Phase 3 风险控制来定。
- published index 与 search document 的具体文件格式、生成命令组织和落盘位置由 planner 决定，但必须与现有 `content/published/*.json` 读模型兼容。
- 速率限制的桶参数、键粒度和中间件组织方式由 planner 决定，但必须明确保护上传 URL 和发布入口。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and phase requirements
- `.planning/PROJECT.md` — 项目核心价值、v1 范围边界，以及 Phase 3 仍需保持 SwiftUI-first 与 MVP 闭环的约束
- `.planning/REQUIREMENTS.md` — Phase 3 对应的 `PIPE-01` 到 `PIPE-05` 与 `OPS-01` requirement 定义
- `.planning/ROADMAP.md` — Phase 3 的目标、成功标准、与“先消费后供给”的阶段边界
- `.planning/STATE.md` — 当前项目位置、Phase 2 已完成事实、以及对 Phase 3 的现有 blocker/concern

### Prior phase decisions and existing verification
- `.planning/phases/01-foundation-protocol/01-CONTEXT.md` — 已锁定的仓库结构、`snippet.yaml` 协议、最小状态机与 CI 底线
- `.planning/phases/01-foundation-protocol/01-RESEARCH.md` — Phase 1 对“先定义协议、后接发布”的研究结论
- `.planning/phases/02-discovery-experience/02-CONTEXT.md` — Discovery 当前消费 published-only artifacts 的方式与 visibility 边界
- `.planning/phases/02-discovery-experience/02-RESEARCH.md` — Phase 2 对 published projection、search document 和 cache boundary 的研究结论
- `.planning/phases/02-discovery-experience/02-VERIFICATION.md` — 已验证公开站只消费 `content/published` 产物，Phase 3 不能破坏该读边界

### Source idea and product architecture
- `idea.md` §API 设计框架 — `POST /v1/media/upload-url`、读写边界与服务职责的原始设想
- `idea.md` §数据存储、媒体与 CDN 策略 — 对象存储路径规范、预签名上传、CDN 缓存语义
- `idea.md` §缓存、扩展性、鉴权与速率限制 — token bucket 思路与资源敏感接口的限流底线
- `idea.md` §版本与发布 — `version`、`status`、`published_at`、`source_commit`、`content_hash` 等发布所需字段
- `idea.md` §CI/CD 与自动化 — 发布流水线分阶段门禁、发布与回滚策略
- `idea.md` §贡献与审核流程 — DCO / 合规扫描 / 审核入口的产品方向，供 planner 识别哪些只需留接口意识

### Current implementation anchors
- `infra/postgres/migrations/001_init.sql` — 当前 `snippet`、`snippet_version`、`publish_state`、`snippet_asset` 的数据库基线
- `packages/snippet-schema/src/types.ts` — 当前 manifest、状态枚举与资产字段的权威类型
- `packages/snippet-schema/src/schema.ts` — `snippet.yaml` 的权威 schema，发布前校验必须复用其字段边界
- `packages/snippet-schema/src/validate.ts` — 现有内容协议与资产路径校验入口
- `packages/snippet-schema/src/published-index.ts` — 已定义的 published snapshot / visibility registry / search projection contract
- `packages/snippet-schema/src/check-published-index.ts` — 当前 published artifacts 的机器校验入口
- `content/published/snippets.json` — Discovery 当前公开消费的 published snapshot 示例
- `content/published/visibility.json` — Discovery 当前用于 `not_public` 判断的显式可见性注册表
- `apps/api/internal/discovery/repository.go` — 当前 Go 读路径如何加载 published artifacts
- `apps/api/internal/discovery/service.go` — 当前公开 feed / search / detail 如何围绕 published-only 数据与缓存工作
- `apps/api/internal/httpapi/server.go` — 当前 Go HTTP 边界，Phase 3 写路径与限流优先在此边界扩展
- `apps/api/internal/config/config.go` — 当前 API 配置模式，新增写路径配置应沿用同一环境变量风格

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `infra/postgres/migrations/001_init.sql`: 已有 `publish_state` 与 `snippet_asset` 表，可直接作为 Phase 3 的最小工作流数据底座，而不是重新设计状态存储。
- `packages/snippet-schema/src/validate.ts`: 已有 manifest 和资产路径校验入口，发布门禁应优先复用而非重写第二套协议校验器。
- `packages/snippet-schema/src/published-index.ts` 与 `src/check-published-index.ts`: 已经定义并验证 published snapshot / visibility registry 的契约，是 Phase 3 发布产物生成的直接目标格式。
- `content/published/snippets.json` 与 `content/published/visibility.json`: 提供了当前公开站实际消费的产物形态，可作为 index refresh 的最小目标输出。
- `apps/api/internal/httpapi/server.go`: 现有 Go 服务已承载 discovery 公开接口，上传 URL、发布动作和限流中间件都可从这一 HTTP 边界增补。
- `apps/api/internal/config/config.go`: 当前配置风格是环境变量 + 默认值，Phase 3 的对象存储、限流或发布配置应保持同样风格。

### Established Patterns
- 单仓结构与 `apps/` / `packages/` / `content/` / `infra/` 分层已锁定，发布链实现需要尊重“协议包、产物、API 边界”分层，而不是把逻辑散到各处。
- Discovery 已经建立“公开站只消费 published-only artifacts”的事实，因此 Publish Pipeline 必须生成并刷新这些 artifacts，而不是让前台去读取 mutable source records。
- 状态机目前只有 `draft | review | published` 三态；Phase 3 应沿用这条最小路径，避免工作流状态膨胀。
- 当前 Go API 仍以标准库 `net/http` 为骨架，说明 Phase 3 更适合在现有服务上补最小写路径和 middleware，而不是引入框架迁移。

### Integration Points
- 上传 URL 签发、发布动作、review/publish 状态流转、以及限流 middleware 优先接入 `apps/api/internal/httpapi/server.go` 的路由边界。
- 发布前校验应复用 `packages/snippet-schema` 的现有验证入口，并补充 media / compliance / publish-readiness 检查。
- 发布成功后的 artifact refresh 需要产出与 `content/published/*.json` 兼容的 snapshot / visibility / search documents，供现有 discovery repository 继续读取。
- 速率限制应优先包住写路径接口，不影响 Phase 2 已稳定的公开 feed / search / detail 行为。

</code_context>

<specifics>
## Specific Ideas

- [auto] Submission entry and upload boundary — 选择“先做后端签发的预签名上传 API，而不是完整后台表单”，因为它最直接满足 `PIPE-01` 且不把本阶段拖进重 UI 范围。
- [auto] Review and publish state flow — 保持 `draft -> review -> published` 三态工作流，且 `published` 必须是显式动作，不把校验通过自动视为公开。
- [auto] Validation and publish gate — 发布前继续复用协议校验，并把发布动作建模成“生成 published artifacts + 刷新搜索文档”的清晰产物边界。
- [auto] Safety rails and operational limits — 限流优先放在上传 URL 和发布动作等资源敏感写接口，而不是重做整站读接口策略。

</specifics>

<deferred>
## Deferred Ideas

- 贡献者自助后台、完整 reviewer dashboard、以及更丰富的审核协作界面属于后续运营/后台增强，不纳入 Phase 3 MVP。
- 搜索引擎最终选型、搜索服务独立化、以及规模化 indexing 架构仍保持 deferred；Phase 3 只锁定“发布会刷新 search documents”的边界。
- 更完整的身份系统、OAuth 登录和细粒度角色权限属于更大的后台与安全能力，不是本阶段必须闭环的前置条件。
- DCO/CLA 自动化、企业授权治理与更重的合规流程只保留方向，不作为本阶段必须完成的全量系统。

</deferred>

---

*Phase: 03-publish-pipeline*
*Context gathered: 2026-03-24*
