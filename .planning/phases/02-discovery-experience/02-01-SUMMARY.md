---
phase: 02-discovery-experience
plan: 01
subsystem: api
tags: [typescript, json, discovery, published-index, validation]
requires:
  - phase: 01-foundation-protocol
    provides: snippet manifest schema, fixture validation CLI, and content protocol types
provides:
  - published-only discovery snapshot contracts for feed, detail, and search
  - machine-validated published snapshot and visibility registry seed data
  - root and package scripts for published index verification
affects: [02-02-PLAN, 02-03-PLAN, public-api, sveltekit-discovery]
tech-stack:
  added: []
  patterns: [published snapshot envelope plus visibility registry, parser-level duplicate and visibility enforcement]
key-files:
  created:
    - packages/snippet-schema/src/published-index.ts
    - packages/snippet-schema/src/check-published-index.ts
    - content/published/snippets.json
    - content/published/visibility.json
  modified:
    - package.json
    - packages/snippet-schema/package.json
    - packages/snippet-schema/src/run-tests.ts
key-decisions:
  - "Published snapshot records embed visibility: published so downstream consumers can validate self-contained public records."
  - "Visibility checks are enforced both within parsers and through a separate registry assertion to support explicit not_public slug handling without public enumeration."
patterns-established:
  - "Public discovery data lives in generatedAt/items envelopes for both content and visibility snapshots."
  - "Published detail payloads hide absent prompt or demo sections by encoding hasPrompt/hasDemo flags alongside concrete blocks."
requirements-completed: [DISC-01, DISC-04, DTL-01, DTL-02, DTL-03, DTL-04, OPS-03]
duration: 8min
completed: 2026-03-24
---

# Phase 2 Plan 1: Discovery Snapshot Summary

**Published-only discovery contracts with parser-enforced visibility rules and two realistic seed records for feed, detail, and not-public slug handling**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-24T07:52:08Z
- **Completed:** 2026-03-24T08:01:56Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added `PublishedSnippetCard`, `PublishedSnippetDetail`, `PublishedSnippetSearchDocument`, envelope types, and strict parsing helpers in the snippet schema package.
- Added a CLI validator plus test coverage for curated snapshot acceptance, duplicate published ids, and missing visibility registry entries.
- Seeded `content/published` with two published snippets and one explicit `not_public` slug to support public-only enumeration and unpublished-state handling.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define the published discovery snapshot contract and validator** - `e58a0c6` (feat)
2. **Task 2: Seed the published-only snapshot and explicit visibility registry** - `5f72a65` (feat)

## Files Created/Modified

- `packages/snippet-schema/src/published-index.ts` - Defines published feed/detail/search types and strict JSON parsing helpers.
- `packages/snippet-schema/src/check-published-index.ts` - Validates the published content snapshot and visibility registry from the repo root.
- `packages/snippet-schema/src/run-tests.ts` - Extends protocol tests to cover snapshot validation success and failure modes.
- `packages/snippet-schema/package.json` - Adds `verify:published-index` script for package-local validation.
- `package.json` - Adds root `check:published-index` script for plan-level verification.
- `content/published/snippets.json` - Seeds two published records with card/detail/search payloads, demo fallback, and prompt availability variants.
- `content/published/visibility.json` - Seeds the published visibility registry including one `not_public` slug with no leaked metadata.

## Decisions Made

- Embedded `visibility: "published"` into each published snapshot record so the public contract is self-describing and parser validation does not rely on external assumptions.
- Kept unpublished lookup handling in a separate `visibility.json` registry so APIs can distinguish known-not-public slugs from missing slugs without enumerating draft or review metadata.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 API work can import `parsePublishedIndex`, `parseVisibilityIndex`, and the published record types directly instead of inventing its own JSON contract.
- Phase 2 web work has realistic sample data for demo fallback, hidden prompt tabs, and explicit unpublished slug states.

## Self-Check: PASSED

- FOUND: `.planning/phases/02-discovery-experience/02-01-SUMMARY.md`
- FOUND: `e58a0c6`
- FOUND: `5f72a65`

---
*Phase: 02-discovery-experience*
*Completed: 2026-03-24*
