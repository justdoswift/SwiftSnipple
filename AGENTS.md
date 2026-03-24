# SwiftSnippet Agent Guide

## Project Snapshot

- Product: SwiftSnippet
- Core value: 用户必须能在几秒内找到一个可信、可复制、可复用的 SwiftUI 片段，并立即把它带回自己的项目或 AI 工作流中。
- Current phase: Phase 2 - Discovery Experience
- Planning source of truth: `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`

## Working Rules

- Start implementation work through a GSD command whenever possible so planning artifacts and execution context stay aligned.
- For small fixes or local edits, prefer `$gsd-quick`.
- For debugging and investigations, prefer `$gsd-debug`.
- For planned roadmap work, continue with `$gsd-plan-phase <n>` or `$gsd-discuss-phase <n>`.
- Treat `.planning/` as project memory. Read it before changing code or scope.

## Current Constraints

- v1 stays focused on content discovery, content protocol, publishing, and launch content.
- Do not expand scope into subscriptions, enterprise features, or community systems unless the user explicitly reprioritizes.
- Preserve the SwiftUI-first content strategy. Do not generalize the platform to multiple tech stacks during v1.

## Architecture Direction

- Frontend: SvelteKit web application
- Backend: Go API and background worker
- Data: PostgreSQL, Redis, Meilisearch, object storage
- Content model: `snippet.yaml` + fixed snippet directory structure + published index

## Next Command

Run `$gsd-discuss-phase 2` to capture Discovery Experience context, or `$gsd-plan-phase 2` if Phase 2 context is already locked.
