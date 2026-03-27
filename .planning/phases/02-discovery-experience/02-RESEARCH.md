# Phase 2: Discovery Experience - Research

> Historical note: this research reflects the original frontend direction for Phase 2. `SvelteKit` mentions are historical planning context, not current implementation guidance.

**Researched:** 2026-03-24
**Domain:** Public discovery UX for published SwiftUI snippets across SvelteKit web, Go read APIs, and a published-only search/cache contract
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Feed composition and browsing feel
- **D-01:** 公开 feed 采用偏作品集感的大视觉卡片流，而不是高密度纯信息列表，优先让用户先看到效果再决定是否点入详情。
- **D-02:** 卡片除标题、摘要、标签、预览媒体外，还应直接露出 `difficulty` 与平台信息，帮助用户快速判断可用性。
- **D-03:** 卡片预览默认以静态 cover 为主；demo 播放不作为 feed 默认行为，把动态预览留给详情页或后续增强。
- **D-04:** 默认排序采用“精选优先，但保留新内容露出”的混合路线，公开 feed 需要有编辑选择感，而不是单纯按时间倒序。

### Search and facet interaction
- **D-05:** 搜索体验以独立 Explore/Search 页面为主，而不是仅在首页顶部附带一个轻量搜索框。
- **D-06:** facet 交互保持轻量，优先用顶部 chips 或 segmented controls，而不是桌面左侧重型筛选栏。
- **D-07:** 关键词与筛选都采用实时生效的交互，用户输入或点选后应立即刷新结果，不增加额外“应用筛选”步骤。
- **D-08:** 搜索零结果时，既要明确说明当前条件没有命中，也要给出替代的已发布推荐内容，避免死路体验。

### Detail page information architecture
- **D-09:** 详情页首屏优先展示 demo / 视觉预览，让用户先判断效果，再继续查看实现与提示词资产。
- **D-10:** 详情页整体采用混合结构：首屏固定展示核心信息，主体内容区使用 tabs 在 `Demo / Code / Prompt / License` 等内容间切换。
- **D-11:** Phase 2 的复制体验优先做最直接的块级复制；代码块与提示词块各自提供一键复制，不先做更复杂的聚合复制流程。
- **D-12:** license 与依赖披露放在页面后半段或对应内容区中，不要求首屏强曝光，但必须可清晰访问。

### Published-only visibility rules
- **D-13:** 公开站访问未发布 snippet slug 时，不伪装成正常内容，也不返回通用 404；应明确显示“内容未公开”这一状态。
- **D-14:** `draft` 与 `review` 内容在公开 feed 与 search 中完全不可枚举，不能以任何占位或半公开方式出现。
- **D-15:** 如果某个 `published` snippet 缺少 demo 媒体，公开前台仍可展示，但应回退到静态 cover 或明确占位样式，不能因此中断卡片流。
- **D-16:** 如果某个 `published` snippet 只具备 code 或只具备 prompt，详情页只展示已有区块，缺失区块可直接隐藏，不强制补充“暂不可用”文案。

### Claude's Discretion
- Explore 页面与首页的具体关系、是否共享同一数据流与样式骨架，由 planner 在不偏离上述交互方向的前提下决定。
- “精选优先 + 新内容露出”的具体排序信号、权重与数据来源由 research / plan 阶段确定，本阶段只锁定用户感知结果。
- 详情页 tabs 的具体命名、桌面/移动端排版细节、切换动画与滚动行为由 planner 决定。
- 对“内容未公开”页的语气、视觉样式和跳转建议由 planner 决定，但不能泄露 draft/review 元数据。

### Deferred Ideas (OUT OF SCOPE)
- 公开 feed 的“精选”如何生产、是否来自人工运营或发布打分体系，属于排序实现与发布体系衔接问题，留到 Phase 2 planning / Phase 3 衔接时决定。
- 搜索引擎最终选型与具体索引更新机制仍保持 deferred，由 Phase 2 research / planning 结合现有约束落定。
- demo 自动播放、hover 动效、沉浸式 media 交互等 richer showcase 行为可作为 Discovery 增强项，但不是本次 discuss-phase 必锁内容。
- 对未发布内容的鉴权访问、后台预览或 reviewer-only 可见性属于 Publish Pipeline 范畴，不纳入 Phase 2 公开站范围。
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DISC-01 | User can browse a feed of published SwiftUI snippet cards with title, summary, labels, and preview media | Requires a published-only card projection, homepage/feed route, and visual card pattern driven by manifest assets and metadata |
| DISC-02 | User can filter published snippets by controlled facets including category, difficulty, platform, and media flags | Requires URL-driven search params, controlled facet schema, filterable search/index fields, and lightweight chip UI |
| DISC-03 | User can search snippets by keyword and receive ranked results | Requires a dedicated Explore route, search backend with ranking rules, and fallback ranked recommendations for zero results |
| DISC-04 | User can open a published snippet detail page from feed or search results | Requires stable slug/id detail routing, published-only detail lookup, and card-to-detail navigation contract |
| DTL-01 | User can view a snippet's demo asset, summary, metadata, and supported platforms on the detail page | Requires detail payload with media fallback, platform metadata, and hero-first IA |
| DTL-02 | User can read and copy the primary SwiftUI implementation files for a published snippet | Requires normalized code file payloads and per-block copy affordance |
| DTL-03 | User can read and copy the prompt template and acceptance checklist associated with a snippet | Requires prompt asset discovery from fixed directory contract and copyable content blocks |
| DTL-04 | User can view snippet license information and dependency disclosures before reuse | Requires license/dependency section in detail projection and a visible access path in UI |
| OPS-03 | System can serve cached feed/detail responses for published snippets without exposing draft data | Requires a published-only read model and cache boundary distinct from mutable source records |
</phase_requirements>

## Summary

Phase 2 is not just a UI pass. The planning risk is that the repo currently has only stubs plus a schema fixture that is still `draft`, while this phase promises a real public read path that enumerates only published content. The planner therefore needs to schedule a published-only read model and sample published data path before or alongside UI work. If not, feed/search/detail tasks will drift into mock data or accidental draft leakage.

The current stack direction remains valid: keep the web in SvelteKit and the API in Go `net/http`, and add only the minimum infrastructure needed to make public discovery real. Search must be treated as a product capability, not a UI-only filter. The minimum viable backend for planning is a published snippet projection, feed/detail endpoints, a dedicated search endpoint with controlled facets and ranking, and response caching at the published projection boundary.

The main planning discipline is to separate three things that are easy to conflate: source-of-truth content (`snippet.yaml` + asset folders), the published public projection, and search/cache documents. Phase 2 should consume the first through the second, but not implement the full publish pipeline from Phase 3. That separation is the core architectural guardrail for DISC-01..04, DTL-01..04, and OPS-03.

**Primary recommendation:** Plan Phase 2 around a published-only read model first, then build SvelteKit feed/explore/detail routes and Go read/search endpoints on top of it.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@sveltejs/kit` | 2.55.0 | Public web routing, SSR/CSR data loading, detail/error routes | Already in repo; current official major for content-driven apps and fits URL-driven filter/search pages |
| `svelte` | 5.55.0 | Component layer for feed, tabs, copy blocks, and search UI | Already in repo; current official runtime paired with SvelteKit |
| Go `net/http` | Go 1.25.1 | Public read API endpoints for feed/detail/search | Already in repo; existing server stub uses it, so staying here avoids framework churn |
| PostgreSQL | 16.x local baseline, schema already present | Source storage for snippet metadata, versions, publish state, and assets | Already established in Phase 1 and is the authority for published-state gating |
| Meilisearch | JS client 0.56.0; engine version must be pinned during implementation | Full-text search, faceting, ranking, zero-result fallback input | Best fit for this phase because faceting/filtering is first-class and project docs already lean Meilisearch |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `svelte-check` | 4.1.6 | Type and component validation | Keep as the quickest frontend gate during route additions |
| `vite` | 6.3.5 | Web build/dev server for SvelteKit app | Already present; no build-system change needed |
| `@testing-library/svelte` | 5.3.1 | Component/route interaction tests for filters, tabs, and copy states | Add when Phase 2 begins implementing interactive UI behavior |
| `vitest` | 4.1.1 | Fast frontend unit/component test runner | Best Wave 0 candidate for web test coverage because repo currently has no JS tests |
| `@playwright/test` | 1.58.2 | Browser-level verification for feed/search/detail flows | Add for one or two smoke paths if Phase 2 needs route-level confidence |
| `github.com/meilisearch/meilisearch-go` | v0.36.1 | Go client for indexing/querying search service | Use only if Phase 2 adopts live Meilisearch instead of a DB-only interim search adapter |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Meilisearch | PostgreSQL `ILIKE` + handcrafted filters | Faster to start, but weak ranking/facet counts and likely rework for DISC-02/03 |
| Meilisearch | Typesense | Also viable for faceting/search, but repo architecture and prior docs already lean Meilisearch |
| Go `net/http` | `chi` | Cleaner route composition, but this phase does not require a router migration to ship public read APIs |
| SvelteKit server `load` + Go API | SvelteKit-only in-app server data layer | Simpler initially, but weakens the intentional frontend/backend split already locked in project direction |

**Installation:**
```bash
pnpm add -D vitest @testing-library/svelte @playwright/test
# Search client only if Phase 2 adopts Meilisearch immediately
cd apps/api && go get github.com/meilisearch/meilisearch-go@v0.36.1
```

**Version verification:** Before implementation, verify current package versions again because this stack moves quickly:
```bash
npm view @sveltejs/kit version
npm view svelte version
npm view meilisearch version
npm view vitest version
npm view @testing-library/svelte version
npm view @playwright/test version
cd apps/api && go list -m -versions github.com/meilisearch/meilisearch-go
```
Verified on 2026-03-24:
- `@sveltejs/kit` latest `2.55.0` from npm registry, modified 2026-03-12
- `svelte` latest `5.55.0` from npm registry, modified 2026-03-23
- `meilisearch` JS client latest `0.56.0` from npm registry, modified 2026-03-17
- `vitest` latest `4.1.1` from npm registry, modified 2026-03-23
- `@testing-library/svelte` latest `5.3.1` from npm registry, modified 2025-12-25
- `@playwright/test` latest `1.58.2` from npm registry, modified 2026-03-24
- `github.com/meilisearch/meilisearch-go` latest listed version `v0.36.1` from `go list -m -versions`

## Architecture Patterns

### Recommended Project Structure
```text
apps/
├── web/
│   └── src/
│       ├── lib/
│       │   ├── discovery/      # Feed/detail/search view models, API client, shared formatters
│       │   └── components/     # Cards, chips, tabs, copy blocks, empty states
│       └── routes/
│           ├── +page.(ts|svelte)         # Homepage/feed entry
│           ├── explore/+page.(ts|svelte) # Dedicated search experience
│           └── snippets/[id]/            # Public detail route + unpublished state route handling
└── api/
    └── internal/
        ├── httpapi/            # Feed/detail/search handlers
        ├── discovery/          # Published projection query service
        ├── search/             # Search adapter / index client interface
        └── cache/              # Published-only cache wrapper
packages/
└── snippet-schema/             # Existing source-of-truth manifest types/schema
```

### Pattern 1: Published Projection Before UI
**What:** Introduce an explicit public read model that contains only published snippets and exactly the fields needed for feed/detail/search.
**When to use:** Immediately, before building real routes or caches.
**Example:**
```ts
// Source: repo schema + Phase 2 constraints
export type PublishedSnippetCard = {
  id: string;
  title: string;
  summary: string;
  categoryPrimary: string;
  difficulty: 'easy' | 'medium' | 'hard';
  platforms: Array<{ os: string; minVersion: string }>;
  tags: string[];
  coverUrl: string;
  demoUrl?: string;
  hasPrompt: boolean;
  hasDemo: boolean;
};
```

### Pattern 2: URL-Driven Explore State
**What:** Treat keyword and facet state as URL query params, not local-only component state.
**When to use:** Explore page and any homepage feed controls that should deep-link or refresh server data.
**Example:**
```ts
// apps/web/src/routes/explore/+page.ts
export const load = async ({ fetch, url }) => {
  const params = new URLSearchParams(url.searchParams);
  const response = await fetch(`/api/discovery/search?${params.toString()}`);
  return {
    search: await response.json(),
    query: Object.fromEntries(params)
  };
};
```

### Pattern 3: Detail Payload by Content Block, Not Raw Filesystem Dump
**What:** Normalize detail data into display blocks: hero metadata, code files, prompt docs, and license/disclosures.
**When to use:** Detail API and route loaders.
**Example:**
```ts
// Shape only; planner should keep the payload minimal
export type SnippetDetail = {
  id: string;
  title: string;
  summary: string;
  platforms: Array<{ os: string; minVersion: string }>;
  media: { coverUrl: string; demoUrl?: string };
  codeBlocks: Array<{ path: string; language: 'swift'; content: string }>;
  promptBlocks: Array<{ path: string; kind: 'prompt' | 'acceptance'; content: string }>;
  license: { code: string; media: string; thirdPartyNotice: string };
};
```

### Pattern 4: Cache Only Published Responses
**What:** Cache feed/detail/search responses after published-state filtering, never raw mutable records.
**When to use:** OPS-03 implementation.
**Example:**
```go
// Source: project requirement OPS-03
func (s *Service) GetPublishedDetail(ctx context.Context, id string) (Detail, error) {
    if cached, ok := s.cache.Get(detailCacheKey(id)); ok {
        return cached, nil
    }
    detail, err := s.repo.LoadPublishedDetail(ctx, id)
    if err != nil {
        return Detail{}, err
    }
    s.cache.Set(detailCacheKey(id), detail, s.ttl)
    return detail, nil
}
```

### Pattern 5: Explicit Unpublished Route State
**What:** Treat unpublished detail access as an expected product state with its own UI, not a generic missing-resource case.
**When to use:** Public detail route for non-published slugs.
**Example:**
```go
func (h *Handler) GetSnippetDetail(w http.ResponseWriter, r *http.Request) {
    detail, err := h.discovery.LoadPublishedDetail(r.Context(), snippetIDFromRequest(r))
    if errors.Is(err, discovery.ErrNotPublic) {
        writeJSON(w, http.StatusForbidden, map[string]string{"message": "内容未公开"})
        return
    }
    if err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "internal error"})
        return
    }
    writeJSON(w, http.StatusOK, detail)
}
```

### Anti-Patterns to Avoid
- **UI-first fake data implementation:** If feed/detail pages ship against static mocks first, planner will miss the published-only boundary and rework is likely.
- **Using raw manifest shape directly in UI:** `snippet.yaml` is the source protocol, not the view contract. Introduce mapping layers so published rules and fallback logic stay centralized.
- **Draft-aware public handlers:** Any public API that branches on `draft`/`review` is a leak risk. Public handlers should only know “published” or “not public”.
- **Client-only search state:** Local component state without URL params breaks shareable Explore links and server-side loading consistency.
- **One endpoint doing feed + search + detail:** Keep read concerns separated; otherwise caching and response evolution become brittle.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text ranking + facets | Ad hoc SQL scoring and manual facet counting | Meilisearch filtering/faceting/ranking | DISC-02/03 need query relevance and facet counts; hand-rolled ranking degrades quickly |
| Route-level search state sync | Custom browser history sync layer | URL query params + SvelteKit route loads | Deep-linking, refresh behavior, and SSR are built around URL-driven state |
| Block copy UX | Complex multi-block clipboard orchestration first | Per-code-block / per-prompt-block copy buttons | Matches locked Phase 2 decision and minimizes UI complexity |
| Public visibility rules | Conditional hiding in templates only | Published-only projection/service boundary | Security and correctness belong in backend/read model, not just UI rendering |
| Draft fallback detail handling | Generic 404 or leaking metadata | Explicit unpublished state page/response | User decision already locks “内容未公开” behavior |

**Key insight:** The deceptively hard part of this phase is not card layout. It is preserving a strict published-only read boundary while still shipping real search, detail, and caching behavior.

## Common Pitfalls

### Pitfall 1: Treating `status` in the manifest as sufficient public gating
**What goes wrong:** UI or API reads directly from manifest-derived records and accidentally enumerates `draft` or `review` items.
**Why it happens:** Teams assume a simple `WHERE status='published'` is enough everywhere, but cache/index/test fixtures often bypass that rule.
**How to avoid:** Define one published projection/repository boundary and make feed/detail/search all consume it.
**Warning signs:** Different handlers each reimplement their own visibility checks; fixtures remain `draft` while pages still render content.

### Pitfall 2: Planning search as “frontend filter UI” only
**What goes wrong:** Explore page looks interactive but cannot provide ranked results, facet counts, or zero-result recommendations.
**Why it happens:** The planner delays backend/index work and assumes the current DB plus client filtering can cover the phase.
**How to avoid:** Treat search index schema, filterable fields, and result ranking as first-class Phase 2 tasks.
**Warning signs:** Search tasks mention chips and inputs but not backend query shape, index fields, or ranking signals.

### Pitfall 3: Mixing homepage feed and Explore into one overloaded page contract
**What goes wrong:** One route tries to satisfy editorial feed, keyword search, and all facets, resulting in tangled state and awkward UX.
**Why it happens:** Reusing a single loader seems cheaper up front.
**How to avoid:** Share the underlying query service, but let homepage feed and Explore have separate page contracts.
**Warning signs:** Homepage starts carrying every search param; planner cannot explain when to use homepage versus Explore.

### Pitfall 4: Reading detail assets directly from filesystem shape in templates
**What goes wrong:** UI is coupled to folder names and fails on missing demo/prompt blocks.
**Why it happens:** The fixed content protocol tempts direct consumption.
**How to avoid:** Normalize assets/content blocks in the API/service layer and encode fallback/hide rules there.
**Warning signs:** Svelte components contain path-building logic or knowledge of `Code/Vibe`, `LICENSES`, and similar folder details.

### Pitfall 5: Adding cache before defining the invalidation boundary
**What goes wrong:** Cached draft data leaks or stale published responses linger after updates.
**Why it happens:** OPS-03 is read as “just add Redis” without deciding what is cacheable.
**How to avoid:** Cache only published projection responses and declare invalidation hooks for the future publish pipeline.
**Warning signs:** Cache keys are built from raw snippet IDs without version/published context; no mention of future publish invalidation.

## Code Examples

Verified and anchored patterns from repo plus official guidance:

### Homepage/feed loader skeleton
```ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const response = await fetch('/api/discovery/feed');
  return {
    feed: await response.json()
  };
};
```

### Explore loader with real-time facet state in the URL
```ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
  const query = url.searchParams.toString();
  const response = await fetch(`/api/discovery/search?${query}`);

  return {
    results: await response.json(),
    activeQuery: url.searchParams.get('q') ?? ''
  };
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static content sites with local-only filtering | URL-driven hybrid SSR/CSR content discovery with dedicated search backends | Matured across modern app frameworks; current through 2025-2026 docs ecosystem | Planner should model search as backend capability plus route state, not just frontend UI |
| Dense admin-style facet sidebars | Lightweight chip/segmented facet controls for consumer discovery surfaces | Current product pattern for portfolio/discovery UIs | Matches locked decision to keep Explore light and immediate |
| Rendering full detail pages even for missing assets | Conditional content blocks with fallback cover/hidden tabs | Common content-product pattern as content completeness varies | Directly supports D-15 and D-16 without fake placeholder copy |

**Deprecated/outdated:**
- Client-only filtering over a full downloaded catalog for public discovery: outdated here because it cannot satisfy published-only gating, ranking, or scalable facets.
- Generic 404 for all missing detail routes: outdated for this phase because the user decision explicitly requires a distinct unpublished state.

## Open Questions

1. **Search backend timing: Meilisearch in Phase 2, or a DB-backed interim search adapter?**
   - What we know: project direction leans Meilisearch; DISC-02/03 need real facets and ranking; infra currently has no Meilisearch service.
   - What's unclear: whether the planner should absorb search service bootstrap in this phase or create an abstraction with a temporary DB fallback.
   - Recommendation: Prefer Meilisearch in the Phase 2 plan if the team can accept a small infra addition; otherwise enforce a search adapter interface so the DB fallback can be replaced without touching routes/components.

2. **Published read model source: DB projection, generated JSON index, or hybrid?**
   - What we know: Phase 3 owns the full publish/index generation flow, but Phase 2 still needs published-only reads now.
   - What's unclear: whether to project directly from current tables/content fixtures or generate a minimal interim published snapshot.
   - Recommendation: Plan an interim published projection service in Phase 2 that can later be fed by Phase 3 publish jobs.

3. **How many sample published snippets are needed to validate UX honestly?**
   - What we know: the repo currently has no `content/snippets` files and the only valid fixture is `draft`.
   - What's unclear: whether Phase 2 should include 1-3 published demo items solely for UI/contract validation.
   - Recommendation: Include at least one realistic published sample and one unpublished slug test case in the phase plan; otherwise DISC/DTL verification is weak.

## Sources

### Primary (HIGH confidence)
- Repo source files and planning artifacts in this workspace:
  - `.planning/phases/02-discovery-experience/02-CONTEXT.md`
  - `.planning/REQUIREMENTS.md`
  - `.planning/ROADMAP.md`
  - `.planning/STATE.md`
  - `.planning/PROJECT.md`
  - `apps/web/src/routes/+page.svelte`
  - `apps/web/src/routes/+page.ts`
  - `apps/api/internal/httpapi/server.go`
  - `apps/api/internal/httpapi/server_test.go`
  - `infra/postgres/migrations/001_init.sql`
  - `packages/snippet-schema/src/types.ts`
  - `packages/snippet-schema/src/schema.ts`
  - `packages/snippet-schema/fixtures/valid/basic-card-feed/snippet.yaml`
- Official docs:
  - SvelteKit Loading data: https://svelte.dev/docs/kit/load
    - Confirms `load` receives `url`, and changes to `url.searchParams.get(...)` rerun `load`
  - SvelteKit Errors: https://svelte.dev/docs/kit/errors
    - Confirms expected errors should use the `error` helper rather than ad hoc exceptions
  - Meilisearch Filter search results: https://www.meilisearch.com/docs/learn/filtering_and_sorting/filter_search_results
    - Confirms filtering requires explicit `filterableAttributes` configuration
  - Meilisearch Search with facets: https://www.meilisearch.com/docs/learn/filtering_and_sorting/search_with_facet_filters
    - Confirms `facets` queries return `facetDistribution` / `facetStats`
- npm and Go registry metadata:
  - `@sveltejs/kit` latest `2.55.0`
  - `svelte` latest `5.55.0`
  - `meilisearch` JS client latest `0.56.0`
  - `vitest` latest `4.1.1`
  - `@testing-library/svelte` latest `5.3.1`
  - `@playwright/test` latest `1.58.2`
  - `github.com/meilisearch/meilisearch-go` latest listed `v0.36.1`

### Secondary (MEDIUM confidence)
- `idea.md` sections on API design, search/facet intent, card protocol, and routing/deployment assumptions. Useful product/architecture context, but not a substitute for official docs.

### Tertiary (LOW confidence)
- None beyond clearly marked inferences from the repo and official docs.

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - repo anchors are strong, but Meilisearch engine selection and new test tooling are not yet installed locally
- Architecture: HIGH - driven by locked user decisions plus current repo structure and requirement boundaries
- Pitfalls: HIGH - directly inferred from the mismatch between current stubs and Phase 2 promises

**Research date:** 2026-03-24
**Valid until:** 2026-04-07
