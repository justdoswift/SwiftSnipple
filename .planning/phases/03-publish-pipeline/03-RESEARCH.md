# Phase 3: Publish Pipeline - Research

**Researched:** 2026-03-24
**Domain:** API-first publish workflow for SwiftSnippet covering signed media uploads, review/publish state transitions, publish-readiness validation, public artifact refresh, and write-path rate limiting
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 上传入口以后端 API 为主，优先交付预签名上传 URL，而不是先做完整后台表单。
- 上传者不能直接接触云凭证；媒体对象路径延续 `snippet_id/version/asset_type` 规范化路径。
- Phase 3 只优先覆盖 Discovery 真实消费的核心媒体资产：`cover` 与可选 `demo`。
- 发布状态严格沿用 `draft -> review -> published` 三态，不增加更多工作流状态。
- `review` 表示可接受自动校验与人工审核，`published` 必须是显式发布动作。
- 公开站只能消费发布产物，不能直接读取原始草稿记录或内容目录。
- 发布前校验复用现有内容协议门禁，再增加媒体、license 与发布准备度检查。
- 发布动作必须产出明确的 published snapshot / visibility registry / search documents 边界。
- 发布成功后必须刷新 public discovery 所依赖的 artifacts，并考虑 cache coherence。
- 速率限制优先保护上传 URL 与发布动作等资源敏感写接口。
- 贡献治理、完整 reviewer tooling、后台 UI、OAuth/角色系统都不属于本阶段必须闭环的内容。

### the agent's Discretion
- 预签名 URL 的参数结构、对象存储抽象层与哈希校验粒度
- 发布校验采用同步、异步还是混合编排的最小形式
- search document 的最终 artifact 组织形式
- token bucket 的参数与 middleware 组织方式

### Deferred Ideas (OUT OF SCOPE)
- 完整投稿后台、review dashboard、和 richer reviewer tooling
- 搜索引擎最终选型与规模化 indexing 架构
- 更完整的身份系统、角色权限与企业治理
- DCO/CLA 自动化和更重的合规体系
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIPE-01 | Contributor or maintainer can upload snippet media through a signed upload flow without direct cloud credentials | Requires storage-signing boundary, upload request validation, and a minimal HTTP/API contract that returns constrained upload instructions |
| PIPE-02 | Maintainer can move a snippet through draft, review, and published states | Requires a publish domain service over existing `publish_state` data plus explicit transition rules and tests |
| PIPE-03 | Publish workflow can validate media constraints, content protocol compliance, and release readiness before publication | Requires layered validation that reuses `packages/snippet-schema` checks and adds publish-only readiness rules |
| PIPE-04 | Publish workflow can generate or refresh a published index consumed by the public site | Requires an artifact compiler that emits the same public contract Discovery already consumes |
| PIPE-05 | Publish workflow can update search documents so new or changed snippets appear in discovery flows | Requires search-document generation at publish time, even if the final search engine remains deferred |
| OPS-01 | System can enforce rate limits on resource-sensitive API endpoints | Requires endpoint-level middleware around upload URL issuance and publish actions, not a whole-platform quota system |
</phase_requirements>

## Summary

Phase 3 is the first write-side phase, so the main planning risk is accidentally collapsing three separate responsibilities into one blob: content protocol validation, publish workflow state transitions, and public artifact generation. The repo already has a clean read-side boundary from Phase 2: Discovery reads `content/published/*.json` through the Go discovery service and never touches draft records. The publish phase should preserve that shape by treating “publish” as a controlled transformation from mutable snippet/version/asset state into generated public artifacts.

The strongest implementation path is API-first and artifact-first. Keep the write path in the existing Go service, use the existing PostgreSQL tables as the minimum state authority, and reuse the existing schema package for publish-readiness checks. The service should sign uploads, persist/transition state, and trigger a publish compiler that refreshes the public snapshot, visibility registry, and search payloads. This approach avoids premature admin UI scope while still satisfying all `PIPE-*` requirements.

The other important guardrail is to keep rate limiting and safety controls focused. Phase 3 does not need a full auth/quota/billing system. It only needs a defendable minimum: token-bucket style limits on expensive write endpoints, upload request validation, and publish-time checks that prevent mock-data/secret hygiene regressions from leaking into public assets.

**Primary recommendation:** Plan Phase 3 as three sequential deliverables: publish domain + upload primitives, publish validation + artifact compiler, then HTTP wiring/integration/rate-limit coverage.

<standard_stack>
## Standard Stack

### Core
| Library / Module | Purpose | Why Standard Here |
|------------------|---------|-------------------|
| Go stdlib `net/http` | HTTP routing for upload and publish endpoints | Already anchors the API service; Phase 3 can extend it without framework churn |
| Existing PostgreSQL schema (`snippet`, `snippet_version`, `publish_state`, `snippet_asset`) | Source-of-truth state for versions, assets, and publish status | Already present from Phase 1 and sufficient for a minimum publish workflow |
| `packages/snippet-schema/src/validate.ts` | Base protocol and asset-path validation | Already the repo’s content-contract authority; publish checks should build on it |
| `packages/snippet-schema/src/published-index.ts` | Public artifact contract for snapshot/visibility/search projections | Already consumed by Discovery; publish should emit exactly this contract family |
| In-process token bucket middleware | Rate limiting for write endpoints | Matches the current single-service phase and avoids introducing Redis or gateways too early |

### Supporting
| Library / Module | Purpose | When to Use |
|------------------|---------|-------------|
| `apps/api/internal/config/config.go` | New storage/rate-limit/publish config knobs | Extend with environment-driven defaults rather than inventing new config patterns |
| `content/published/snippets.json` + `visibility.json` | Canonical public artifacts | Treat as outputs of the publish compiler, not hand-maintained fixtures |
| `apps/api/internal/cache/memory.go` | Cache boundary reference for artifact refresh invalidation | Useful when publish completes and Discovery caches need deterministic refresh behavior |
| `apps/api/internal/httpapi/server_test.go` | Route-level behavior coverage | Extend for write-path success/failure/rate-limit cases |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| API-first signed upload endpoint | Admin UI upload workflow first | More product-visible, but expands scope and delays the actual backend publish contract |
| In-process rate limiting | Redis-backed distributed counters | Better for scale, but unnecessary before multiple API nodes or external traffic patterns |
| Reusing existing published snapshot contract | New publish-only internal artifact format + later remap | Creates unnecessary indirection and risk of read/write contract drift |
| Synchronous or mixed publish orchestration | Full queue/worker pipeline from day one | Better for future scale, but too much platform work for the current phase scope |
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```text
apps/api/internal/
├── httpapi/          # upload/publish handlers and middleware wiring
├── publish/          # state transitions, validation, artifact compiler
├── storage/          # presign adapter / object path helpers
├── ratelimit/        # token-bucket middleware for write endpoints
└── discovery/        # existing public read side (must remain artifact-driven)

content/published/
├── snippets.json
├── visibility.json
└── search-documents.json   # recommended Phase 3 search artifact
```

### Pattern 1: Publish Compiles Artifacts, Discovery Reads Artifacts
**What:** Treat publish as a compile step from mutable source records into deterministic public artifacts.  
**When to use:** Always, for any action that changes public visibility.  
**Example:**
```go
type PublishArtifacts struct {
    SnapshotPath   string
    VisibilityPath string
    SearchPath     string
}

func (s *Service) Publish(ctx context.Context, snippetID string, version string) (PublishArtifacts, error) {
    // validate readiness -> transition state -> compile public artifacts
}
```

### Pattern 2: Layered Validation Instead of a Second Schema System
**What:** Reuse manifest validation, then add publish-only checks for media specs, license completeness, and release readiness.  
**When to use:** Before any `review -> published` transition.  
**Example:**
```go
func (v *PublishValidator) ValidateReady(ctx context.Context, input Candidate) []Issue {
    issues := v.protocol.ValidateSnippetDir(input.SnippetDir)
    issues = append(issues, v.media.Validate(input.Assets)...)
    issues = append(issues, v.release.Validate(input.Metadata)...)
    return issues
}
```

### Pattern 3: Explicit State Transitions with Guardrails
**What:** Model `draft -> review -> published` as explicit domain operations with allowed transitions and failure reasons.  
**When to use:** Every write endpoint that touches `publish_state`.  
**Example:**
```go
func (s *StateService) MoveToReview(ctx context.Context, snippetID string) error
func (s *StateService) PublishVersion(ctx context.Context, snippetID string, version string) error
```

### Pattern 4: Endpoint-Level Rate Limiting on Expensive Writes
**What:** Apply a dedicated limiter to upload URL issuance and publish actions, separate from public read traffic.  
**When to use:** At the HTTP boundary in `server.go`.  
**Example:**
```go
uploadHandler := limitMiddleware(uploadLimiter, handleUploadURL)
publishHandler := limitMiddleware(publishLimiter, handlePublish)
```

### Pattern 5: Search Artifact as a Publish Output, Not a Read-Time Derivation
**What:** Generate search payloads during publish so Discovery/search stays fast and deterministic.  
**When to use:** On every publish refresh.  
**Example:**
```json
{
  "generatedAt": "2026-03-24T00:00:00Z",
  "items": [
    { "id": "basic-card-feed", "title": "Basic Card Feed", "tags": ["feed", "cards"] }
  ]
}
```

### Anti-Patterns to Avoid
- **Letting publish endpoints write directly to Discovery responses:** This breaks the clean read/write boundary established in Phase 2.
- **Duplicating schema rules inside the publish service:** Two validators will drift and create “passes CI, fails publish” inconsistency.
- **Treating `review` as publicly visible:** This would undermine the explicit published-only visibility model already verified.
- **Adding admin UI before backend contracts stabilize:** It multiplies surface area without proving the actual supply pipeline.
- **Global one-size-fits-all rate limiting:** It obscures which write actions are expensive and risks punishing benign read traffic.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Publish contract parsing | New ad hoc JSON parsing in publish code | `packages/snippet-schema/src/published-index.ts` contract helpers | Keeps read/write artifact shape aligned |
| Content protocol revalidation | A second publish-only schema language | Existing `validate.ts` + layered readiness checks | Reduces drift and duplicate logic |
| Rate limiting | Custom timestamp math in handlers | Small reusable token-bucket limiter package | Easier to test and reason about endpoint policies |
| Search refresh | Recompute search payload on every user query | Publish-time search artifact generation | Makes discovery deterministic and cheaper at runtime |
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Publishing Changes State but Not Artifacts
**What goes wrong:** `publish_state` says `published`, but `content/published/*.json` still points at old content.  
**Why it happens:** Status transitions and artifact refresh are implemented as separate, weakly-coupled steps.  
**How to avoid:** Make the publish service own both the state transition and artifact generation outcome.  
**Warning signs:** Tests only assert DB state and never inspect updated public artifacts.

### Pitfall 2: Signed Upload Endpoint Becomes a Generic Storage Proxy
**What goes wrong:** The system starts accepting arbitrary files or paths and loses version/path discipline.  
**Why it happens:** The upload request schema is too loose.  
**How to avoid:** Restrict asset kinds, MIME types, object path format, and expected file size/hash early.  
**Warning signs:** Client chooses the final object key or arbitrary bucket path.

### Pitfall 3: Publish Validation Forks from Base Content Validation
**What goes wrong:** Snippet passes CI but fails publish for surprising reasons, or vice versa.  
**Why it happens:** Publish code reimplements protocol rules instead of calling the existing validator.  
**How to avoid:** Layer publish-only checks on top of base protocol validation instead of replacing it.  
**Warning signs:** Two modules validate the same asset fields independently.

### Pitfall 4: Search Refresh Is Treated as an Optional Afterthought
**What goes wrong:** Newly published snippets appear in detail lookups but not in search/facet flows.  
**Why it happens:** Snapshot refresh and search refresh are decoupled without a contract.  
**How to avoid:** Make search-document generation part of the same publish artifact pass.  
**Warning signs:** Publish tests never verify search payload changes.

### Pitfall 5: Rate Limits Attach to Public Read Paths Instead of Writes
**What goes wrong:** The most abuse-prone write paths remain exposed while harmless read traffic gets throttled.  
**Why it happens:** Limits are added generically instead of by endpoint cost.  
**How to avoid:** Start with upload/publish endpoints, then expand later only if needed.  
**Warning signs:** `/feed` gets a limiter before `/media/upload-url`.
</common_pitfalls>

<code_examples>
## Code Examples

### Existing discovery read boundary
```go
// apps/api/internal/discovery/repository.go
const (
    defaultPublishedIndexPath  = "content/published/snippets.json"
    defaultVisibilityIndexPath = "content/published/visibility.json"
)
```
This is the contract Phase 3 must keep feeding.

### Existing config style
```go
func Load() Config {
    return Config{
        Address: envOrDefault("API_ADDRESS", ":8080"),
        DiscoveryCacheTTL: durationOrDefault("DISCOVERY_CACHE_TTL", 30*time.Second),
    }
}
```
Phase 3 config should extend this pattern rather than invent a second config system.

### Existing content validation boundary
```ts
// packages/snippet-schema/src/validate.ts
if (valid && manifest.assets.cover && !fs.existsSync(path.join(snippetDir, manifest.assets.cover))) {
  errors.push({ path: manifest.assets.cover, message: 'cover asset path does not exist' });
}
```
Publish validation should layer on top of this, not replace it.
</code_examples>

<sota_updates>
## State of the Art (Project-Level)

| Old Approach | Current Project-Appropriate Approach | Impact |
|--------------|--------------------------------------|--------|
| Public site reads mutable source records directly | Public site reads generated published artifacts | Matches the verified Discovery boundary and simplifies visibility guarantees |
| Publish as a manual content-editing step | Publish as a deterministic artifact-generation step | Makes rollback and search refresh testable |
| Blanket API limits | Endpoint-focused write-path protection | Fits MVP operations without full platform gating |

**New patterns to consider inside this repo:**
- Artifact compiler package under `apps/api/internal/publish/`
- Small storage presign adapter under `apps/api/internal/storage/`
- Lightweight rate-limit middleware package under `apps/api/internal/ratelimit/`

**Outdated for this project phase:**
- Hand-maintained `content/published/*.json` files
- Publish state changes without a paired public artifact refresh
</sota_updates>

<open_questions>
## Open Questions

1. **Search artifact file shape**
   - What we know: Phase 3 must refresh search documents, but final search engine remains intentionally deferred.
   - What's unclear: Search payload should be a standalone `search-documents.json` artifact or stay embedded-only inside `snippets.json`.
   - Recommendation: Generate a standalone search artifact in addition to any embedded snapshot search fields so later search backends have a clear ingestion boundary.

2. **Publish orchestration mode**
   - What we know: Phase 3 should stay small, but long-running publish logic should be evolvable toward workers.
   - What's unclear: First implementation should be synchronous in-process or trigger a background job even in MVP.
   - Recommendation: Keep orchestration synchronous or mixed for the first implementation, but separate validation/compiler logic into services that can move behind a worker later.

3. **Storage adapter depth**
   - What we know: Uploads must be signed and the caller must not receive direct cloud credentials.
   - What's unclear: Whether Phase 3 should integrate a real cloud SDK immediately or start with a deterministic/local signing stub for repository-first development.
   - Recommendation: Plan the adapter seam first; choose the concrete provider in execution based on available environment and fastest verifiable path.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- `.planning/phases/03-publish-pipeline/03-CONTEXT.md` — Locked Phase 3 decisions and scope
- `.planning/ROADMAP.md` — Phase 3 goal and requirement boundary
- `.planning/REQUIREMENTS.md` — `PIPE-*` and `OPS-01` definitions
- `.planning/phases/02-discovery-experience/02-VERIFICATION.md` — Verified read-side artifact boundary
- `idea.md` — Upload, publish, indexing, rollback, and rate-limit direction

### Secondary (HIGH confidence)
- `infra/postgres/migrations/001_init.sql` — Existing data model
- `packages/snippet-schema/src/validate.ts` — Existing content validation entrypoint
- `packages/snippet-schema/src/published-index.ts` — Existing public artifact contract
- `apps/api/internal/discovery/repository.go` and `service.go` — Existing read-side consumers
- `apps/api/internal/httpapi/server.go` — Current HTTP extension point

### Tertiary (MEDIUM confidence)
- Current repo patterns from Phase 1/2 planning and implementation summaries
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Go API, PostgreSQL state model, TypeScript schema package
- Capability areas: signed upload, publish workflow, artifact generation, search refresh, rate limiting
- Patterns: artifact-first publishing, layered validation, endpoint-focused operational safety
- Pitfalls: contract drift, partial publish, weak upload boundaries, misplaced rate limiting

**Confidence breakdown:**
- Scope and requirements: HIGH
- Existing architecture fit: HIGH
- Operational/safety direction: HIGH
- Concrete provider choices (storage/search): MEDIUM
</metadata>

---

*Phase: 03-publish-pipeline*
*Researched: 2026-03-24*
