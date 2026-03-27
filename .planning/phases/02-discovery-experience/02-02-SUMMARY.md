---
phase: 02-discovery-experience
plan: 02
subsystem: api
tags: [go, net-http, discovery, cache, published-index, search]
requires:
  - phase: 02-discovery-experience
    provides: published-only snapshot contracts, visibility registry, and seeded discovery content
provides:
  - cached Go discovery feed, search, and detail APIs over the published snapshot
  - published-only repository and service boundary with explicit not_public handling
  - in-memory TTL caching for feed, search, and detail responses after visibility filtering
affects: [02-03-PLAN, public-api, sveltekit-discovery, publish-invalidation]
tech-stack:
  added: []
  patterns: [published snapshot repository in Go, cache-after-visibility service boundary, lightweight ranked search with facet filtering]
key-files:
  created:
    - apps/api/internal/discovery/types.go
    - apps/api/internal/discovery/repository.go
    - apps/api/internal/cache/memory.go
    - apps/api/internal/discovery/service.go
    - apps/api/internal/discovery/service_test.go
  modified:
    - apps/api/internal/config/config.go
    - apps/api/internal/httpapi/server.go
    - apps/api/internal/httpapi/server_test.go
key-decisions:
  - "Public discovery reads are normalized from content/published JSON envelopes once per process instead of branching across raw manifest data."
  - "Caching lives in the discovery service after published visibility checks so not_public and missing ids are never cached as public payloads."
patterns-established:
  - "Feed ordering is featuredRank ascending, then publishedAt descending, preserving editorial priority with freshness fallback."
  - "Search combines exact facet filters with simple keyword scoring and returns up to three published feed fallbacks on zero-result queries."
requirements-completed: [DISC-02, DISC-03, DISC-04, OPS-03]
duration: 10min
completed: 2026-03-24
---

> Historical note: this summary still references the contemporaneous `SvelteKit` frontend path. Read those stack mentions as historical only.

# Phase 2 Plan 2: Discovery API Summary

**Go discovery endpoints for published feed, ranked facet search, and explicit not_public detail handling backed by TTL-cached snapshot reads**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-24T08:03:30Z
- **Completed:** 2026-03-24T08:12:58Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added discovery-specific config, repository types, and snapshot loading so the API now reads only the curated published index and visibility registry.
- Implemented a cache-backed discovery service with feed sorting, keyword-plus-facet search, zero-result fallback recommendations, and explicit unpublished-state behavior.
- Replaced the Phase 1 placeholder route with concrete `feed`, `search`, and `detail` endpoints plus tests covering published-only enumeration and 403/404 detail states.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define discovery repository and response contracts for the published snapshot** - `c97e26c` (feat)
2. **Task 2: Implement cached feed, search, and detail handlers with unpublished-state behavior** - `3c2885e` (feat)

## Files Created/Modified

- `apps/api/internal/config/config.go` - Adds published snapshot paths and discovery cache TTL configuration.
- `apps/api/internal/discovery/types.go` - Defines feed, search, detail, facet, and not-public API contracts.
- `apps/api/internal/discovery/repository.go` - Loads `content/published/snippets.json` and `content/published/visibility.json` into in-memory published records.
- `apps/api/internal/cache/memory.go` - Provides a minimal TTL memory cache for published discovery responses.
- `apps/api/internal/discovery/service.go` - Applies feed ranking, search scoring, facet filtering, fallback behavior, and cache boundaries.
- `apps/api/internal/discovery/service_test.go` - Verifies published-only feed/search/detail behavior and not-public handling.
- `apps/api/internal/httpapi/server.go` - Exposes `GET /api/v1/discovery/feed`, `GET /api/v1/discovery/search`, and `GET /api/v1/discovery/snippets/{id}`.
- `apps/api/internal/httpapi/server_test.go` - Covers HTTP-level feed/search/detail responses, fallback payloads, and 403/404 states.

## Decisions Made

- Reused the Phase 2 published snapshot as the only repository source so Discovery reads stay independent from Phase 3 publishing mechanics.
- Kept cache keys aligned to public response identity (`feed`, query-string search variants, and detail id) and avoided caching raw visibility checks or unpublished records.
- Treated `review-only-meter` as an explicit product state returning `403 not_public`, while unknown ids still return `404 not_found`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 web routes can call stable public discovery endpoints without reimplementing ranking, filtering, or visibility checks in SvelteKit.
- Phase 3 publish work can invalidate cache keys safely because feed/search/detail caching now lives above the published snapshot boundary.

## Self-Check: PASSED

- FOUND: `.planning/phases/02-discovery-experience/02-02-SUMMARY.md`
- FOUND: `c97e26c`
- FOUND: `3c2885e`

---
*Phase: 02-discovery-experience*
*Completed: 2026-03-24*
