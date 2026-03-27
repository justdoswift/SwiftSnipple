---
phase: 08-admin-studio-v1
plan: 02
subsystem: studio-ui-foundation
tags: [studio, shadcn-svelte, tailwind-v4, ui-system, playwright]
requires:
  - phase: 08-admin-studio-v1
    provides: authenticated studio routes, file-backed editor data, and publish workflow
provides:
  - Tailwind v4 and shadcn-svelte foundation for `apps/web`
  - Sidebar-based Studio shell with shared UI primitives
  - Playwright-verified Studio page redesign on top of the existing admin data flow
affects: [internal-tooling, design-system, studio-ux]
tech-stack:
  added: [tailwindcss-v4, shadcn-svelte, bits-ui]
  patterns: [global-token-layer, component-system-first-studio-ui, playwright-visual-hardening]
key-files:
  created:
    - apps/web/components.json
    - apps/web/src/routes/layout.css
    - apps/web/src/lib/utils.ts
    - apps/web/src/lib/components/ui/
    - apps/web/src/lib/components/studio/StudioSidebar.svelte
  modified:
    - apps/web/package.json
    - apps/web/vite.config.ts
    - apps/web/tsconfig.json
    - apps/web/src/routes/+layout.svelte
    - apps/web/src/routes/studio/+layout.svelte
    - apps/web/src/routes/studio/+page.svelte
    - apps/web/src/routes/studio/login/+page.svelte
    - apps/web/src/routes/studio/snippets/+page.svelte
    - apps/web/src/routes/studio/snippets/new/+page.svelte
    - apps/web/src/routes/studio/snippets/[id]/+page.svelte
    - apps/web/src/lib/discovery/discovery.smoke.test.ts
    - apps/web/e2e/studio.spec.ts
key-decisions:
  - "Studio 先完整迁到 shadcn-svelte，公开站只做 token 共存和兼容，不在本轮全面改版。"
  - "Tailwind v4 全局样式层承接 token、字体和基础 utility，layout 组件回归结构职责。"
  - "Playwright 继续作为 Studio UI 调整后的最终回归基线，而不是只看静态代码。"
patterns-established:
  - "内部运营台使用 sidebar/card/tabs/table 等基础件组合，而不是继续堆手写 panel 类。"
  - "公开站与 Studio 可以共享同一全局 token 层，同时保留不同的版式和品牌气质。"
requirements-completed: [OPS-01, OPS-04]
duration: same-session retroactive sync
completed: 2026-03-26
---

> Historical note: this summary preserves the Phase 8 UI migration language from that moment. `shadcn-svelte` references are historical rather than current stack guidance.

# Phase 8 Plan 2: Studio shadcn-svelte Foundation Summary

**Studio 现在已经站到统一组件体系上了，后续后台 UI 不需要再靠一套套手写 panel 往前堆。**

## Accomplishments

- `apps/web` 已接入 Tailwind v4、`components.json`、`$lib/components/ui/*` 与 `$lib/utils.ts`，后续可以直接继续按 shadcn-svelte 官方路径扩展组件。
- 全局 `layout.css` 已接管 token、字体、基础 utility 和公开站 / Studio 兼容层，原先散落在 layout 中的全局职责开始收口到样式层。
- `/studio` 已重构为 sidebar-backed shell：登录、总览、列表、新建、编辑页全部迁到统一的 card / button / input / textarea / table / tabs / alert 体系。
- Playwright 已继续覆盖 Studio 主路径，并针对新结构调整了断言，保证 UI 迭代后仍有真实页面回归保护。

## Verification

- `pnpm -C apps/web run check`
- `pnpm -C apps/web run test`
- `pnpm -C apps/web run test:e2e`

## Issues Encountered

- `bits-ui` 依赖在当前工程配置下缺少 `csstype`，并且第三方声明检查过严；已通过补充 `csstype` 与 `skipLibCheck` 修复。
- Studio 新壳增加了多个同名入口，导致旧 Playwright 断言进入 strict mode；已改成明确点击正文 CTA，避免和侧边栏快捷入口冲突。
- 公开站 discovery 的一条旧单测假设首页标题只出现一次；在新的门面卡结构下改成按 heading 角色断言后恢复稳定。

## Follow-up

- 下一步优先继续补 Studio 第二轮 UX：媒体上传状态、发布反馈、未保存提示、字段分组和错误提示都还能再精修。
- 公开站后续若继续迁到 shadcn-svelte，应以“基础件替换 + 品牌化封面保留”的方式渐进推进，而不是一次性重写。
