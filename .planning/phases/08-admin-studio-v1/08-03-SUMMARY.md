---
phase: 08-admin-studio-v1
plan: 03
subsystem: shared-ui-convergence
tags: [studio, discovery, shadcn-svelte, tailwind-v4, ui-cleanup, playwright]
requires:
  - phase: 08-admin-studio-v1
    provides: shadcn-svelte foundation, studio shell, and playwright-backed UI regression path
provides:
  - Shared component convergence across Studio and public discovery routes
  - Removal of legacy custom surface utilities and page-level private styles outside `ui/`
  - Playwright-verified unified UI layer for both internal and public surfaces
affects: [internal-tooling, public-discovery, design-system]
tech-stack:
  reused: [tailwindcss-v4, shadcn-svelte, bits-ui, playwright]
  patterns: [component-system-first, tailwind-inline-layout, minimal-private-css]
key-files:
  modified:
    - apps/web/src/routes/+layout.svelte
    - apps/web/src/routes/+page.svelte
    - apps/web/src/routes/explore/+page.svelte
    - apps/web/src/routes/snippets/[id]/+page.svelte
    - apps/web/src/lib/components/CopyActionButton.svelte
    - apps/web/src/lib/components/FacetChips.svelte
    - apps/web/src/lib/components/CodeBlock.svelte
    - apps/web/src/lib/components/PromptBlock.svelte
    - apps/web/src/lib/components/SnippetCard.svelte
    - apps/web/src/lib/components/SnippetPreviewMedia.svelte
    - apps/web/src/routes/layout.css
key-decisions:
  - "整站统一继续按 shadcn-svelte 共享组件体系推进，不再接受公开站保留一套平行的私有控件视觉。"
  - "页面层尽量改用 Tailwind 原子类表达布局，只让 `ui/` 目录持有组件自身样式。"
  - "封面构图允许保留必要的内容表现，但优先改成组件组合与原子类，而不是继续维护大段私有 CSS。"
patterns-established:
  - "控件视觉交给 Button / Badge / Card / Tabs / Input 等共享件，业务组件只负责组合。"
  - "页面级 `<style>` 不是默认选项；先用 Tailwind 和共享组件，只有在确有必要时才保留最小私有样式。"
requirements-completed: [UX-05, UX-06]
duration: same-session retroactive sync
completed: 2026-03-26
---

> Historical note: this summary reflects the naming and stack assumptions at the time. `shadcn-svelte` mentions are historical context only.

# Phase 8 Plan 3: Full shadcn-svelte Convergence Summary

**这轮把“Studio 用 shadcn-svelte、公开站还保留另一套表皮”的状态彻底收口了。**

## Accomplishments

- 公开站首页、Explore、详情页的按钮、标签、Tabs、表单输入、卡片动作都回到了 `shadcn-svelte` 共享组件体系。
- `CopyActionButton`、`FacetChips`、`CodeBlock`、`PromptBlock`、`SnippetCard`、`SnippetPreviewMedia` 不再依赖大段私有 `<style>`，而是以共享组件和 Tailwind 原子类表达。
- `apps/web/src/routes/layout.css` 里已经清掉旧的 `liquid-glass`、`glass-panel`、`content-surface`、`studio-surface` 这类遗留 surface 工具，避免再次长出一套平行视觉语言。
- 排除 `ui/` 组件源码后，公开站与共享业务组件已经不再保留私有 `<style>` 块，整站 UI 基础层明显更统一。

## Verification

- `pnpm -C apps/web run check`
- `pnpm -C apps/web run test:e2e -- discovery.spec.ts`
- `pnpm -C apps/web run test:e2e -- studio.spec.ts`
- `rg -n "<style>|style>" apps/web/src/routes apps/web/src/lib/components | sed '/src\\/routes\\/studio/d' | sed '/src\\/lib\\/components\\/ui/d'`

## Issues Encountered

- Playwright 在同一轮里并行跑 `discovery` 和 `studio` 时会抢占同一个 stub 端口，导致假性失败；已改回串行确认结果。
- 组件化后，一些局部样式因为 Svelte 组件边界不再自动命中根节点，导致“代码改了但实际没生效”；已统一改成共享组件类名或原子类，不再依赖这类脆弱选择器。

## Follow-up

- 如果后续还要继续精修 UI，默认先从信息结构和内容表达入手，而不是重新引入私有 surface 样式。
- 下一步可以进入 Phase 08 的人工验收，确认录入、保存、上传、Review、Publish 这些真实工作流在新 UI 上仍然顺手。
