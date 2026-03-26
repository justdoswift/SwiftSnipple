# Roadmap: SwiftSnippet

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 shipped 2026-03-25. Archive: [v1.0-ROADMAP.md](/Users/gepeng/Documents/coolweb/SwiftSnippet/.planning/milestones/v1.0-ROADMAP.md)
- ⏸️ **v1.1 视觉重构** — Phase 5 done, Phases 6-7 paused after direction reset
- 🚧 **v1.2 内容运营后台** — Phase 8 implemented, Studio 与公开站已收口到统一组件体系，verification pending

## Overview

v1.0 已完成并归档。v1.1 的公开站视觉重构已经打下浅色作品库基线，但在 Phase 5 后被临时让位给更高优先级的内容运营后台。当前进入 v1.2，目标是把已经落地的 `/studio` 内部运营台正式纳入 GSD 记录，并围绕内容录入、文件协议编辑、Review / Publish 闭环继续推进。

## Current Status

- 统一的 `snippet.yaml` 内容协议与校验链路
- published-only feed / search / detail 公开发现体验
- signed upload、review / publish、artifact refresh、rate limit 的发布闭环
- 12 条已发布首发内容，覆盖 UI、interaction、state、AI template 四类场景
- `/studio` 内部运营台已具备登录、列表、新建、编辑、校验、Review、Publish 的基础闭环
- `apps/web` 已接入 Tailwind v4 + shadcn-svelte，Studio 与公开 discovery 页面都已迁到统一组件体系

## Phase 5: Visual System Reset

**Goal:** 为公开站建立统一的深色编辑部风格视觉系统和中文文案基线，让后续页面改版共享同一套气质与信息层级。

**Requirements:** ART-01, L10N-01

**Success criteria:**
1. 首页、Explore、详情页共享同一套全局色板、排版、背景节奏和强调色
2. 公开站的导航、章节标题、按钮、零状态和辅助文案以中文为主，而不是英文占位语气
3. 改版后的首屏在桌面端具有明确的海报感和品牌记忆点
4. 公共组件层不再混用多套视觉语言

**Why first:**  
没有统一的 art direction 和中文文案基线，后续首页 / Explore / 详情页会继续各改各的，最终还是割裂。

## Phase 6: Discovery Surface Redesign

**Goal:** 重做首页与 Explore，使浏览入口更接近作品集式展示，同时保持现有 discovery 能力不退化。

**Requirements:** ART-02, UX-01

**Success criteria:**
1. 首页具备更强的首屏层级、媒体展示和品牌导向，而不是普通卡片列表
2. Explore 的筛选、结果列表和返回路径在新视觉里仍然高效易扫
3. 首页与 Explore 之间的跳转关系清晰，不会让用户丢失浏览上下文
4. 现有 feed/search 行为在 UI 重构后仍可正常消费

**Why here:**  
首页和 Explore 是公开站最常用的入口，先把这两块做对，才能决定详情页该怎么承接视觉语言。

## Phase 7: Detail & Responsive Polish

**Goal:** 把 snippet 详情页、代码 / prompt 展示区块和响应式表现拉齐到新视觉系统，完成公开站改版闭环。

**Requirements:** L10N-02, UX-02

**Success criteria:**
1. 详情页的 demo、code、prompt、license 区块与首页 / Explore 共用一致的深色视觉语言
2. 本地化标签足以帮助用户快速理解分类、难度、Prompt / Demo 可用性和复用动作
3. 公开站在桌面和移动端都没有明显的裁切、拥挤或不可点击问题
4. smoke / check 测试能覆盖改版后的关键文案与主浏览路径

**Why last:**  
详情页承担“真正决定要不要复用”的最后一步，必须建立在前两阶段的整体视觉和浏览节奏已经稳定之后。

## Phase 8: Admin Studio v1

**Goal:** 为维护者提供一个可直接编辑文件协议、运行校验并触发 Review / Publish 的内部运营后台，而不是继续手写 `content/snippets`。

**Requirements:** OPS-01, OPS-02, OPS-03, OPS-04

**Success criteria:**
1. 维护者可以通过单管理员密码进入 `/studio`，并访问受保护的后台页面与后台 API
2. 新建 snippet 时会生成标准目录骨架，并能通过后台保存 `snippet.yaml`、代码、Prompt、license 与平台信息
3. 后台可以运行 publish-ready 校验，并沿用现有 `draft -> review -> published` 状态机
4. Playwright 与 API 测试能覆盖登录、列表、保存与发布基础链路

**Why now:**  
内容供给已经变成当前瓶颈。没有后台，后续 snippet 批量录入、媒体补齐和发布都会继续依赖手工改文件，运营效率太差；而没有统一组件体系，Studio 的第二轮体验优化也很难高质量持续推进。

## Next Up

`$gsd-verify-work 8`

先对已经落地的后台链路和新的 Studio UI 壳做一轮 GSD 验收，再决定是继续补后台编辑体验，还是回到 Phase 6/7 完成公开站视觉收尾。

---
*Roadmap updated: 2026-03-26*
