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
- If a task uses HeroUI React v3, consult `HEROUI-AGENTS.md` for the downloaded official docs index before implementation.

## Current Constraints

- v1 stays focused on content discovery, content protocol, publishing, and launch content.
- Do not expand scope into subscriptions, enterprise features, or community systems unless the user explicitly reprioritizes.
- Preserve the SwiftUI-first content strategy. Do not generalize the platform to multiple tech stacks during v1.
- UI/UX 默认优先降低心智压力：宁可留白更多，也不要把信息和控件堆得过密；后续所有页面打磨都应先检查“是否过密”，而不是先担心“是否太空”。
- 所有 UI 文案都必须像真实产品文案，直接面向用户；不要写解释性文案、开发说明、组件功能描述或任何占位味很重的文字。
- 所有 UI 尺寸都必须有统一章法：标题层级、正文、按钮高度、输入框高度、圆角、间距必须复用稳定 token 或共享组件尺寸，不能在页面里各写各的任意值。
- 既然接入了 `shadcn-svelte`，后续 UI 必须真实收敛到共享组件体系；不能只用组件骨架，再在页面层大面积覆写成另一套不一致的按钮、表单、卡片和 tabs 视觉。

## Architecture Direction

- Frontend: SvelteKit web application
- Backend: Go API and background worker
- Data: PostgreSQL, Redis, Meilisearch, object storage
- Content model: `snippet.yaml` + fixed snippet directory structure + published index

## Next Command

Run `$gsd-discuss-phase 2` to capture Discovery Experience context, or `$gsd-plan-phase 2` if Phase 2 context is already locked.
