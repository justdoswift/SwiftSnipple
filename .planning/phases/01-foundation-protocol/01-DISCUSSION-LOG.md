# Phase 1: Foundation Protocol - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 1-Foundation Protocol
**Areas discussed:** Repository shape, Content protocol boundary, Data contracts, Quality gates

---

## Repository shape

| Option | Description | Selected |
|--------|-------------|----------|
| Single-repo modular structure | Use `apps/`, `packages/`, `content/`, `infra/` with clear boundaries and shared contracts | ✓ |
| Multi-repo split from day one | Separate frontend, backend, and content into different repos | |
| Minimal flat structure | Keep everything at the root until later refactor | |

**User's choice:** [auto] Single-repo modular structure
**Notes:** Recommended default for a greenfield MVP because it keeps planning and integration overhead low while preserving clear boundaries.

---

## Content protocol boundary

| Option | Description | Selected |
|--------|-------------|----------|
| `snippet.yaml` + fixed directory structure | Manifest plus required folders for media, code, prompts, tests, and licenses | ✓ |
| Loose markdown-first protocol | Prefer human-readable docs and infer structure later | |
| Code-only protocol | Focus on SwiftUI source first and add prompt/media metadata later | |

**User's choice:** [auto] `snippet.yaml` + fixed directory structure
**Notes:** Recommended because Phase 1 exists specifically to prevent protocol drift and support CI/indexing from the start.

---

## Data contracts

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal published-content model | Focus on snippet metadata, versions, assets, search facets, and publish states | ✓ |
| Broad future-proof product model | Include subscriptions, enterprise, and community entities early | |
| Ad-hoc schema after UI work starts | Let later phases define contracts as needed | |

**User's choice:** [auto] Minimal published-content model
**Notes:** Recommended because it fits the fixed Phase 1 boundary and avoids premature expansion beyond v1.

---

## Quality gates

| Option | Description | Selected |
|--------|-------------|----------|
| Protocol + Swift quality + baseline build checks | Validate structure/schema, Swift formatting/lint, and basic build/test entry points | ✓ |
| Full release pipeline in Phase 1 | Also implement media validation, publishing, indexing, and approval workflow now | |
| Light docs-only checks | Only verify files exist and postpone deeper checks | |

**User's choice:** [auto] Protocol + Swift quality + baseline build checks
**Notes:** Recommended because it gives Phase 1 a real enforcement layer without stealing work from Phase 3.

---

## the agent's Discretion

- Concrete library choice for schema validation
- Exact local dev orchestration tooling
- Specific fixture content used to prove the protocol

## Deferred Ideas

- Full publish workflow and media processing belong to Phase 3
- Search engine implementation detail belongs to Phase 2
- Launch content batch curation belongs to Phase 4
