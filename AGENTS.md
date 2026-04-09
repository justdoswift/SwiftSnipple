# AGENTS.md

This file is for AI agents working in the `SwiftSnipple` repository.

## Mission

SwiftSnipple is a curated platform for sharing delightful and useful SwiftUI implementations.

The product is not only about code. It also treats prompts, implementation notes, reusable patterns, and editorial explanation as first-class content. The goal is to create an archive that feels thoughtful, inspiring, and practically useful for people who enjoy SwiftUI, interface craft, and AI-assisted building.

## Audience

Optimize for readers who:

- care about polished SwiftUI UI and interaction design
- want real examples instead of abstract theory
- are interested in how prompts and code can work together
- may eventually pay for deeper access to the archive

## Product Direction

When making changes, preserve these truths:

- SwiftSnipple is a platform and archive, not just a snippet dump
- code, prompts, and teaching context should feel equally important
- the experience should feel editorial and curated, not generic
- Stripe-backed membership and premium access are future roadmap items
- do not present membership, payments, or gated content as already shipped unless the code actually implements them

## UI and Brand Guardrails

- Preserve the archive/editorial visual language already present in the project
- Prefer strong typography, clear hierarchy, generous spacing, and restrained monochrome surfaces
- Avoid turning pages into a generic SaaS dashboard unless the task is explicitly about admin tooling
- Even admin surfaces should still feel like part of the same publication
- Treat interaction polish and motion as supporting tools, not decoration for its own sake

## Content Modeling Rules

When adding or editing content-oriented features:

- treat SwiftUI code, prompts, notes, and metadata as core domain entities
- prefer structures that support rich case-study style entries
- keep room for premium/member-only access in future data and routing decisions
- avoid hard-coding assumptions that all content is free forever

## Repo Orientation

Current high-level structure:

- `apps/web/src/pages` contains public-facing pages
- `apps/web/src/pages/admin` contains the editorial/admin workspace
- `apps/web/src/components` contains shared UI
- `apps/web/src/components/admin` contains admin-specific UI
- `apps/api` contains the Go API, database access, and migrations
- `infra/caddy` contains production reverse-proxy configuration
- content data should prefer API-backed flows over browser-local persistence

## Working Style for Agents

- Make changes that strengthen the product identity, not just technical correctness
- Prefer product-facing copy that sounds intentional, concise, and design-aware
- When implementing UI, keep it aligned with the existing archive tone
- When adding future membership-related work, keep the architecture compatible with Stripe and gated access without inventing fake completed behavior
- Avoid introducing placeholder marketing claims that the product cannot support yet
- Prefer monorepo-friendly changes that keep frontend and backend responsibilities clearly separated

## Verification Expectations

After meaningful code changes, validate with the existing project commands when relevant:

```bash
cd apps/web && npm run lint
cd apps/web && npm run build
```

For documentation changes, verify that:

- product positioning matches the actual repository direction
- roadmap language is aspirational but truthful
- no stale references to generic starter templates remain

## Default Assumption

If a request is ambiguous, favor decisions that make SwiftSnipple feel more like a high-quality SwiftUI archive and less like a generic template app.
