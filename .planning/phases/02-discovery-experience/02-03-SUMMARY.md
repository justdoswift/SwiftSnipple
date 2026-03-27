---
phase: 02-discovery-experience
plan: 03
subsystem: ui
tags: [sveltekit, svelte5, discovery, ui, vitest, testing-library]
requires:
  - phase: 02-discovery-experience
    provides: cached Go feed/search/detail APIs with published-only visibility handling
provides:
  - portfolio-style homepage feed backed by the Phase 2 discovery API
  - dedicated Explore page with URL-driven keyword and facet filtering plus zero-result fallbacks
  - published snippet detail route with demo/code/prompt/license tabs and explicit not_public state
affects: [phase-03-publish, public-discovery-ui, sveltekit-discovery]
tech-stack:
  added: [vitest, @testing-library/svelte, jsdom]
  patterns: [URL query as discovery state source, reusable discovery UI blocks, API-shaped frontend contracts]
key-files:
  created:
    - apps/web/src/lib/discovery/types.ts
    - apps/web/src/lib/discovery/api.ts
    - apps/web/src/lib/discovery/query.ts
    - apps/web/src/lib/components/SnippetCard.svelte
    - apps/web/src/lib/components/FacetChips.svelte
    - apps/web/src/lib/components/CodeBlock.svelte
    - apps/web/src/lib/components/PromptBlock.svelte
    - apps/web/src/routes/explore/+page.ts
    - apps/web/src/routes/explore/+page.svelte
    - apps/web/src/routes/snippets/[id]/+page.ts
    - apps/web/src/routes/snippets/[id]/+page.svelte
    - apps/web/src/lib/discovery/discovery.smoke.test.ts
    - apps/web/vitest.config.ts
  modified:
    - apps/web/package.json
    - apps/web/src/routes/+page.ts
    - apps/web/src/routes/+page.svelte
    - pnpm-lock.yaml
key-decisions:
  - "Frontend types and facet readers follow the already-committed Go API keys (`category`, `difficulty`, `platform`) rather than the older pluralized draft in the plan text."
  - "Explore treats URL params as the only discovery state source and rewrites them immediately through `goto(..., { replaceState: true })` instead of keeping a parallel client store."
  - "Snippet detail converts `403 not_public` API responses into a dedicated blocked page and hides absent prompt content instead of rendering placeholder tabs."
patterns-established:
  - "Discovery pages consume shared `loadFeed`, `loadSearch`, and `loadSnippetDetail` helpers so route code stays thin and API-shaped."
  - "Reusable `SnippetCard`, `FacetChips`, `CodeBlock`, and `PromptBlock` components define the public discovery visual language and copy affordances."
requirements-completed: [DISC-01, DISC-02, DISC-03, DISC-04, DTL-01, DTL-02, DTL-03, DTL-04]
duration: 16min
completed: 2026-03-24
---

> Historical note: this summary documents the Phase 2 frontend path as it existed then. `SvelteKit` references are historical and not the current stack.

# Phase 2 Plan 3: Discovery Web Summary

**SvelteKit public discovery surfaces with portfolio feed cards, live Explore filters, and demo-first snippet details over the published Phase 2 APIs**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-24T08:15:30Z
- **Completed:** 2026-03-24T08:31:32Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- Added shared discovery frontend contracts, fetch helpers, query-param serialization, and reusable visual/copy blocks for cards, chips, code, and prompt assets.
- Replaced the homepage stub with a published feed, added a dedicated `/explore` route with live URL-driven filters and zero-result recommendations, and wired both surfaces to concrete `/snippets/{id}` detail links.
- Built a demo-first detail route with `Demo`, `Code`, `Prompt`, and `License` tabs, explicit `内容未公开` handling for unpublished ids, and smoke tests that cover query serialization, fallback rendering, copy labels, prompt-tab hiding, and cover fallback behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the shared discovery web client and reusable UI blocks** - `7d418fc` (feat)
2. **Task 2: Build the home, explore, and detail routes with explicit not-public handling** - `9dedd8e` (feat)

## Files Created/Modified

- `apps/web/src/lib/discovery/types.ts` - Mirrors the published discovery API contracts for feed, search, detail, facets, and route-level filter state.
- `apps/web/src/lib/discovery/api.ts` - Centralizes `loadFeed`, `loadSearch`, and `loadSnippetDetail` with normalized API error handling.
- `apps/web/src/lib/discovery/query.ts` - Defines exact `q/category/difficulty/platform/hasDemo/hasPrompt` URL param serialization.
- `apps/web/src/lib/components/SnippetCard.svelte` - Renders the cover-first published card with difficulty, platform pills, tags, and `/snippets/{id}` navigation.
- `apps/web/src/lib/components/FacetChips.svelte` - Implements lightweight chip-style facet controls for Explore.
- `apps/web/src/lib/components/CodeBlock.svelte` - Provides per-block code rendering with `Copy code`.
- `apps/web/src/lib/components/PromptBlock.svelte` - Provides per-block prompt rendering with `Copy prompt`.
- `apps/web/src/routes/+page.ts` - Loads the published feed from `/api/v1/discovery/feed`.
- `apps/web/src/routes/+page.svelte` - Replaces the Phase 1 stub with a portfolio-style public feed and Explore entry point.
- `apps/web/src/routes/explore/+page.ts` - Reads `url.searchParams` and fetches live discovery search results.
- `apps/web/src/routes/explore/+page.svelte` - Renders live query input, facet chips, zero-result messaging, and fallback recommendations.
- `apps/web/src/routes/snippets/[id]/+page.ts` - Maps API detail and `403 not_public` responses into page data states.
- `apps/web/src/routes/snippets/[id]/+page.svelte` - Implements the demo-first detail page, tabs, copy blocks, cover fallback, and blocked unpublished state.
- `apps/web/src/lib/discovery/discovery.smoke.test.ts` - Covers the required smoke behaviors for query params, fallback cards, copy labels, prompt hiding, and cover fallback.
- `apps/web/package.json` - Adds the `test` script and minimal web test dependencies.
- `apps/web/vitest.config.ts` - Enables Svelte Testing Library’s Vitest integration with jsdom.
- `pnpm-lock.yaml` - Locks the added test dependencies.

## Decisions Made

- Matched the frontend facet contract to the actual Go API payload from `02-02` instead of the older pluralized field names in the plan text, preventing an integration mismatch.
- Kept Explore stateless beyond the URL so shared links, reloads, and browser navigation all reproduce the same filtered result set.
- Treated missing prompt/demo assets as absence-driven UI states: hide the Prompt tab when unavailable and reuse `coverUrl` whenever `demoUrl` is absent.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Svelte Testing Library Vitest plugin wiring**
- **Found during:** Task 2 (Build the home, explore, and detail routes with explicit not-public handling)
- **Issue:** Component smoke tests failed in jsdom because Vitest was mounting the server build path without the official `svelteTesting()` integration.
- **Fix:** Added `@testing-library/svelte/vite` to `apps/web/vitest.config.ts` so component tests run against the proper browser-aware setup.
- **Files modified:** `apps/web/vitest.config.ts`
- **Verification:** `pnpm --filter @swiftsnippet/web test`
- **Committed in:** `9dedd8e`

**2. [Rule 1 - Bug] Added caption tracks to snippet detail video elements**
- **Found during:** Task 2 (Build the home, explore, and detail routes with explicit not-public handling)
- **Issue:** The detail page built successfully but emitted Svelte accessibility warnings because both `<video>` elements lacked caption tracks.
- **Fix:** Added lightweight caption `<track>` elements to the hero and tabbed demo players.
- **Files modified:** `apps/web/src/routes/snippets/[id]/+page.svelte`
- **Verification:** `pnpm --filter @swiftsnippet/web check` and `pnpm --filter @swiftsnippet/web build`
- **Committed in:** `9dedd8e`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were required to satisfy the plan’s verification gates cleanly. No scope creep beyond the committed discovery UX.

## Issues Encountered

- `zsh` treated `apps/web/src/routes/snippets/[id]/+page.svelte` as a glob during `svelte-autofixer`; quoting the path resolved it without code changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 can now invalidate or extend one consistent public discovery UI surface instead of replacing stubs.
- Publish pipeline work only needs to keep the existing feed/search/detail API contracts stable for the frontend to continue working.
- Seed content work can validate real snippet quality directly against the shipped homepage, Explore filters, and detail copy flows.

## Self-Check: PASSED

- FOUND: `.planning/phases/02-discovery-experience/02-03-SUMMARY.md`
- FOUND: `7d418fc`
- FOUND: `9dedd8e`

---
*Phase: 02-discovery-experience*
*Completed: 2026-03-24*
