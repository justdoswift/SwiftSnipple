# Phase 08 Verification

> Historical note: this verification report contains references to the earlier `shadcn-svelte` convergence path. Those mentions are preserved for traceability only.

## Status

PASS (automated) / HUMAN UAT PENDING

## Automated Checks

- `cd apps/api && go test ./...`
- `pnpm -C apps/web run check`
- `pnpm -C apps/web run test`
- `pnpm -C apps/web run test:e2e`
- `pnpm -C apps/web run test:e2e -- discovery.spec.ts`
- `pnpm -C apps/web run test:e2e -- studio.spec.ts`

## Verified

- `/studio` 已受管理员 session 保护，未登录时会被重定向到 `/studio/login`
- 登录后可以进入后台总览与 snippet 列表
- 后台 API 已支持 snippet 列表、详情、创建、保存、校验和本地资产预览/上传
- Review / Publish 继续沿用现有 publish pipeline，而不是新的后台状态机
- 本地 dev 和 Playwright 已使用隔离端口与显式后台凭证，不再被旧进程或 `.env` 覆盖
- `apps/web` 已具备 Tailwind v4 + shadcn-svelte 组件基础设施，可继续扩展统一 UI 基础件
- Studio 的登录、总览、列表、新建、编辑页都已迁到 sidebar/card/table/tabs 等统一组件体系
- 公开 discovery 页面在引入新的全局样式层后，原有 smoke test 与 Playwright 用例仍保持通过
- 公开站首页、Explore、详情页现在也已收口到同一套 shadcn-svelte 基础件与尺寸体系
- 排除 `ui/` 目录后，公开站与共享业务组件已不再保留私有 `<style>` 块或旧 surface 工具类

## Human Verification Needed

- 新建一个 snippet，确认骨架目录与初始文件真的生成到 `content/snippets/<id>/`
- 在编辑页修改标题、摘要、代码、Prompt 与 license，确认刷新后仍可读回
- 上传 cover / demo，确认编辑页可预览
- 跑一次 validate -> review -> publish，确认公开站可以读到更新结果

## Follow-up

- 执行 `$gsd-verify-work 8`
- 若人工验收通过，再决定是继续扩 studio UX，还是回到 Phase 6/7 完成公开站视觉收尾
- 若继续做后台体验，优先从媒体上传反馈、发布区状态提示、脏状态提示三块开始
