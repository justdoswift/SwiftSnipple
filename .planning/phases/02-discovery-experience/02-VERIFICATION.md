---
phase: 02-discovery-experience
verified: 2026-03-24T08:40:19Z
status: human_needed
score: 9/9 must-haves verified
human_verification:
  - test: "首页与 Explore 的真实浏览流"
    expected: "用户能在首页看到两张已发布卡片，点入后进入对应 /snippets/{id} 详情；Explore 输入关键词或点 facet 后结果立即刷新且 URL 同步变化。"
    why_human: "自动化已验证路由连线与 URL 参数逻辑，但无法确认真实浏览器中的视觉层级、交互手感和导航连贯性。"
  - test: "详情页 Demo / Code / Prompt / License 标签切换与复制体验"
    expected: "有 demo 的条目优先展示视频；无 demo 的条目回退到 cover；Code 和 Prompt 的每个区块都有可点击复制按钮，且 Prompt 缺失时标签完全隐藏。"
    why_human: "现有测试覆盖文案与隐藏逻辑，但未在真实浏览器中验证视频控件、剪贴板权限、标签切换和移动端布局表现。"
  - test: "未公开 slug 的阻断态"
    expected: "直接访问 /snippets/review-only-meter 时显示“内容未公开”，不会显示详情内容，也不会被公开 feed 或搜索枚举出来。"
    why_human: "API 与页面加载逻辑已通过自动验证，但阻断页的文案清晰度和用户理解成本需要人工确认。"
---

> Historical note: this verification report references the earlier `SvelteKit` file structure that existed during Phase 2. Treat those paths and stack mentions as historical record only.

# Phase 2: Discovery Experience Verification Report

**Phase Goal:** 交付用户真正可使用的公开浏览体验，包括卡片流、详情页与可筛选搜索。  
**Verified:** 2026-03-24T08:40:19Z  
**Status:** human_needed  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Public discovery reads from a published-only snapshot instead of raw mutable snippet records | ✓ VERIFIED | `packages/snippet-schema/src/published-index.ts` defines strict published contracts and rejects `status`; `content/published/snippets.json` contains only two `visibility: "published"` items; `apps/api/internal/discovery/repository.go` loads `content/published/snippets.json` and `content/published/visibility.json` only |
| 2 | The published snapshot contains enough card, detail, code, prompt, and license data for the web experience without exposing draft metadata | ✓ VERIFIED | `content/published/snippets.json` includes card/detail/search payloads, `codeBlocks`, `promptBlocks`, `license`, `dependencies`, `hasDemo`, `hasPrompt`; `review-only-meter` appears only in `content/published/visibility.json` with no leaked metadata |
| 3 | Direct slug checks distinguish known unpublished snippets from missing slugs without making unpublished items enumerable | ✓ VERIFIED | `apps/api/internal/discovery/service.go` calls `CheckVisibility` before `LoadDetail`; `/api/v1/discovery/snippets/{id}` returns `403 {code:not_public}` for `review-only-meter` and `404 {code:not_found}` for unknown ids in `apps/api/internal/httpapi/server.go` and matching tests |
| 4 | Feed, search, and detail APIs return only published records from the shared snapshot | ✓ VERIFIED | `apps/api/internal/discovery/repository.go` only materializes records whose `Visibility == "published"`; `apps/api/internal/discovery/service_test.go` and `apps/api/internal/httpapi/server_test.go` assert `review-only-meter` is excluded from feed/search and blocked on detail |
| 5 | Search supports keyword plus controlled facets and returns ranked results with fallback recommendations on zero results | ✓ VERIFIED | `apps/api/internal/discovery/types.go` exposes `Q`, `Category`, `Difficulty`, `Platform`, `HasDemo`, `HasPrompt`; `apps/api/internal/discovery/service.go` applies scoring and `firstN(feed, 3)` fallback; `apps/web/src/routes/explore/+page.ts` reads `url.searchParams`; `apps/web/src/routes/explore/+page.svelte` updates URL immediately and renders fallback cards |
| 6 | Users can browse a large-card public feed exposing title, summary, tags, difficulty, platform, and cover-first media | ✓ VERIFIED | `apps/web/src/routes/+page.ts` loads `/api/v1/discovery/feed`; `apps/web/src/routes/+page.svelte` renders the published feed; `apps/web/src/lib/components/SnippetCard.svelte` shows cover image, title, summary, tags, difficulty, and platform pills |
| 7 | Users can use a dedicated Explore page with URL-driven keyword and facet filtering plus zero-result recommendations | ✓ VERIFIED | `apps/web/src/lib/discovery/query.ts` serializes exact `q/category/difficulty/platform/hasDemo/hasPrompt` params; `apps/web/src/routes/explore/+page.svelte` rewrites the URL with `goto(..., { replaceState: true })`; smoke test verifies zero-result messaging and fallback card rendering |
| 8 | Users can open a detail page, see demo-first media, switch tabs, and copy code/prompt blocks | ✓ VERIFIED | `apps/web/src/routes/snippets/[id]/+page.ts` loads the real detail API; `apps/web/src/routes/snippets/[id]/+page.svelte` renders `Demo`, `Code`, optional `Prompt`, and `License`; `apps/web/src/lib/components/CodeBlock.svelte` and `PromptBlock.svelte` provide per-block copy buttons; smoke test verifies copy labels and Prompt hiding |
| 9 | Public feed/detail/search responses are cached without exposing draft data | ✓ VERIFIED | `apps/api/internal/cache/memory.go` implements TTL cache; `apps/api/internal/discovery/service.go` caches `feed`, `search:*`, and `detail:*` responses only after published filtering / visibility checks; `not_public` and `not_found` branches are not cached as public detail payloads |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/snippet-schema/src/published-index.ts` | published discovery contracts and validators | ✓ VERIFIED | Exports `PublishedSnippetCard`, `PublishedSnippetDetail`, `PublishedSnippetSearchDocument`, `PublishedIndexEnvelope`, `SnippetVisibilityRecord`, `parsePublishedIndex`, `parseVisibilityIndex`, and visibility assertions |
| `content/published/snippets.json` | published-only feed/search/detail snapshot | ✓ VERIFIED | Contains exactly two published records with media, ranking, code, prompt, license, and dependency data; no `review-only-meter` entry |
| `content/published/visibility.json` | explicit visibility registry | ✓ VERIFIED | Contains two `published` ids and one `not_public` id without leaking title/summary/tags |
| `apps/api/internal/discovery/service.go` | published-only query and ranking service | ✓ VERIFIED | Implements feed ordering, keyword scoring, facet filtering, zero-result fallback, detail visibility handling, and cache keys |
| `apps/api/internal/httpapi/server.go` | public discovery HTTP endpoints | ✓ VERIFIED | Serves `GET /api/v1/discovery/feed`, `GET /api/v1/discovery/search`, and `GET /api/v1/discovery/snippets/{id}` with correct 200/403/404 behavior |
| `apps/api/internal/cache/memory.go` | cache boundary for published responses | ✓ VERIFIED | Provides in-memory TTL cache used by discovery service |
| `apps/web/src/routes/+page.svelte` | homepage feed | ✓ VERIFIED | Renders portfolio-style hero and card grid from loaded published feed |
| `apps/web/src/routes/explore/+page.svelte` | dedicated search and facet page | ✓ VERIFIED | Renders keyword field, chips for all required facets, result cards, and zero-result fallback state |
| `apps/web/src/routes/snippets/[id]/+page.svelte` | detail page and not-public state | ✓ VERIFIED | Renders demo-first hero, tabbed detail content, cover fallback, prompt hiding, and explicit “内容未公开” blocked state |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `packages/snippet-schema/src/check-published-index.ts` | `content/published/snippets.json` | validator CLI reads snapshot and visibility registry before downstream use | ✓ WIRED | `checkPublishedIndex()` reads both JSON files and runs `parsePublishedIndex`, `parseVisibilityIndex`, `assertPublishedIndexVisibility`; `pnpm --filter @swiftsnippet/snippet-schema verify:published-index` passed |
| `content/published/visibility.json` | `content/published/snippets.json` | shared ids must agree while unpublished items remain absent from published snapshot | ✓ WIRED | `assertPublishedIndexVisibility()` enforces every published item exists in visibility registry as `published`; `review-only-meter` exists only in visibility registry |
| `apps/api/internal/discovery/repository.go` | `content/published/snippets.json` | repository load + normalization | ✓ WIRED | Repository resolves and reads the published snapshot and turns it into in-memory feed, detail, and search docs |
| `apps/api/internal/httpapi/server.go` | `apps/api/internal/discovery/service.go` | handlers delegate to shared discovery service | ✓ WIRED | `NewServer()` constructs repo + service once and every discovery handler calls `service.Feed`, `service.Search`, or `service.Detail` |
| `apps/web/src/lib/components/SnippetCard.svelte` | `/snippets/{id}` | card anchor href | ✓ WIRED | Component default `href` is `/snippets/${snippet.id}`; homepage and Explore both pass concrete detail hrefs |
| `apps/web/src/lib/discovery/api.ts` | `/api/v1/discovery/search` | `loadSearch(fetch, params)` | ✓ WIRED | Explore `+page.ts` passes `url.searchParams` to `loadSearch`, so server-ranked results drive the page |
| `apps/web/src/routes/snippets/[id]/+page.ts` | `/api/v1/discovery/snippets/{id}` | `loadSnippetDetail(fetch, params.id)` | ✓ WIRED | Loader consumes the detail API, converts `403 not_public` into `{ notPublic: true }`, and throws proper 404 for unknown ids |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `DISC-01` | `02-01`, `02-03` | User can browse a feed of published SwiftUI snippet cards with title, summary, labels, and preview media | ✓ SATISFIED | Published snapshot provides card fields; homepage loads feed and renders `SnippetCard` with media/title/summary/tags/difficulty/platform |
| `DISC-02` | `02-02`, `02-03` | User can filter published snippets by controlled facets including category, difficulty, platform, and media flags | ✓ SATISFIED | API `SearchQuery` supports all required facets; Explore UI exposes chips for `category`, `difficulty`, `platform`, `hasDemo`, and `hasPrompt` |
| `DISC-03` | `02-02`, `02-03` | User can search snippets by keyword and receive ranked results | ✓ SATISFIED | API scoring logic ranks title/tag/summary matches; search tests verify `q=card`; Explore consumes live search endpoint |
| `DISC-04` | `02-01`, `02-02`, `02-03` | User can open a published snippet detail page from feed or search results | ✓ SATISFIED | Homepage and Explore cards both link to `/snippets/{id}`; detail route loader calls the published detail API |
| `DTL-01` | `02-01`, `02-03` | User can view a snippet's demo asset, summary, metadata, and supported platforms on the detail page | ✓ SATISFIED | Detail payload includes media/summary/platforms; detail page shows demo-first hero or cover fallback plus metadata badges and platform pills |
| `DTL-02` | `02-01`, `02-03` | User can read and copy the primary SwiftUI implementation files for a published snippet | ✓ SATISFIED | Published snapshot includes `codeBlocks`; detail page renders `CodeBlock` per block with `Copy code`; smoke test verifies label |
| `DTL-03` | `02-01`, `02-03` | User can read and copy the prompt template and acceptance checklist associated with a snippet | ✓ SATISFIED | Published snapshot includes `promptBlocks`; detail page renders prompt and acceptance blocks with `Copy prompt`; prompt tab hides when unavailable |
| `DTL-04` | `02-01`, `02-03` | User can view snippet license information and dependency disclosures before reuse | ✓ SATISFIED | Snapshot includes `license` and `dependencies`; detail page `License` tab renders both reuse terms and dependencies |
| `OPS-03` | `02-01`, `02-02` | System can serve cached feed/detail responses for published snippets without exposing draft data | ✓ SATISFIED | Published-only snapshot contract excludes draft metadata; discovery service caches only public feed/search/detail responses after visibility checks |

Requirement set declared across `02-01`, `02-02`, and `02-03` exactly matches the requested Phase 2 IDs: `DISC-01`, `DISC-02`, `DISC-03`, `DISC-04`, `DTL-01`, `DTL-02`, `DTL-03`, `DTL-04`, `OPS-03`. No orphaned Phase 2 requirement IDs were found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| None | - | No TODO / FIXME / placeholder / empty implementation patterns found in scanned phase files | ℹ️ Info | No blocker or warning-level stub indicators detected in the verified implementation set |

### Human Verification Required

### 1. 首页与 Explore 的真实浏览流

**Test:** 在真实浏览器打开 `/` 和 `/explore`，观察首页卡片、Explore 搜索框与 facet chips；输入关键词、切换 facet，并点击结果卡片进入详情页。  
**Expected:** 首页与 Explore 都只展示已发布条目；查询和 facet 会立刻刷新结果并同步 URL；卡片点击可进入对应详情页。  
**Why human:** 自动验证已确认代码连线与构建通过，但无法评估视觉层级、交互响应感和导航体验。

### 2. 详情页标签切换与复制

**Test:** 打开一个有 demo/prompt 的详情页和一个无 demo/无 prompt 的详情页，分别切换 `Demo`、`Code`、`Prompt`、`License` 标签并点击复制按钮。  
**Expected:** 有 demo 时显示视频，无 demo 时显示 cover；`Copy code` / `Copy prompt` 在真实浏览器中可用；无 prompt 时不出现 `Prompt` 标签。  
**Why human:** 现有 smoke test 只验证结构和文案，不能覆盖浏览器剪贴板权限、视频播放控件和移动端排版。

### 3. 未公开 slug 的阻断态

**Test:** 直接访问 `/snippets/review-only-meter`。  
**Expected:** 页面显示“内容未公开”阻断态，而不是正常详情或通用 404；公开 feed 和搜索中仍然找不到该 slug。  
**Why human:** 自动验证已确认 API/loader 分支正确，但最终阻断文案是否足够清晰、是否符合产品预期仍需人工确认。

### Gaps Summary

自动化验证没有发现阻断 Phase 2 目标的缺口。发布快照、Go discovery API、SvelteKit 首页 / Explore / 详情页、显式 `not_public` 行为、以及已发布数据缓存边界都已落地，并且相关协议测试、Go 测试、Svelte 检查、前端构建和 smoke test 全部通过。

当前未直接标记为 `passed` 的唯一原因是仍有少量浏览器层面的用户体验事项无法通过静态读码和现有自动化测试完全证明，包括真实点击导航、视频与复制交互、以及阻断页的最终可理解性。这些属于人工验收项，不构成已知代码缺口。

---

_Verified: 2026-03-24T08:40:19Z_  
_Verifier: Claude (gsd-verifier)_
