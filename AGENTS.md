# AGENTS.md

This file is for AI agents working in the `SwiftSnipple` repository.

## Mission

SwiftSnipple is a curated SwiftUI snippet showcase and implementation library.

The product exists to collect useful, delightful, and reusable SwiftUI builds, then present them in a way that helps other builders quickly understand, copy, adapt, and remix them. Prompts, notes, and references matter, but they support the snippet rather than replacing it.

## Audience

Optimize for people who:

- build with SwiftUI and want better implementation references
- care about polished UI, motion, layout, and interaction detail
- like browsing strong examples instead of reading abstract theory
- are interested in using AI prompts as part of the implementation workflow
- may eventually pay for deeper access to the library

## Product Direction

When making changes, preserve these truths:

- SwiftSnipple is a snippet library and showcase, not a Substack-style publishing product
- the core unit is a SwiftUI implementation, pattern, or reusable build
- code should stay more important than long-form editorial framing
- prompts, notes, metadata, and screenshots are supporting content
- Stripe-backed membership is a future roadmap item
- do not present payments, premium access, or gated content as already shipped unless the code actually implements them

## UI and Brand Guardrails

- Preserve the current restrained monochrome visual language
- Prefer strong hierarchy, clear spacing, and product-focused presentation
- Keep the public experience feeling like a well-curated showcase, not a blog CMS
- Avoid turning the site into a generic SaaS dashboard unless the task is explicitly about admin tooling
- Even admin surfaces should still feel connected to the same product

## Content Modeling Rules

When adding or editing content-oriented features:

- treat snippets, prompts, notes, tags, and references as core domain elements
- prefer structures that support browsing, filtering, and reusing implementations
- avoid assuming every entry needs to behave like a long-form article
- keep room for future premium access without pretending it already exists
- favor naming that reflects snippets, showcases, patterns, or entries over editorial/archive metaphors unless the product really needs them

## Repo Orientation

Current high-level structure:

- `apps/web/src/pages` contains public-facing pages
- `apps/web/src/pages/admin` contains the publishing workspace
- `apps/web/src/components` contains shared UI
- `apps/web/src/components/admin` contains admin-specific UI
- `apps/api` contains the Go API, database access, and migrations
- `infra/caddy` contains production reverse-proxy configuration
- content data should prefer API-backed flows over browser-local persistence

## Working Style for Agents

- Make changes that strengthen the idea of a high-quality SwiftUI snippet library
- Prefer concise, intentional product copy over publication-style framing
- When implementing UI, optimize for browsing and discovering snippets
- When adding metadata, make it more useful for reuse, search, and adaptation
- When working on future membership-related code, keep it compatible with Stripe and gated access without inventing fake completed behavior
- Avoid placeholder marketing language that makes the product sound like a newsletter or essay platform if that is not actually the goal
- Prefer monorepo-friendly changes that keep frontend and backend responsibilities clearly separated

## Verification Expectations

After meaningful code changes, validate with the existing project commands when relevant:

```bash
cd apps/web && npm run lint
cd apps/web && npm run build
```

For documentation changes, verify that:

- product positioning matches the actual repository direction
- snippet-library language is used where it matters
- roadmap language is aspirational but truthful
- no stale starter-template or publication-platform framing remains where it would mislead future work

## Default Assumption

If a request is ambiguous, favor decisions that make SwiftSnipple feel more like a strong SwiftUI snippet showcase and less like a publishing or archive product.
