# Roadmap: SwiftSnippet

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 shipped 2026-03-25. Archive: [v1.0-ROADMAP.md](/Users/gepeng/Documents/coolweb/SwiftSnippet/.planning/milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 视觉重构** — Phases 5-7 planned

## Overview

v1.0 已完成并归档。v1.1 不再扩平台能力，而是把公开站改造成更有辨识度的深色中文体验：先建立统一视觉系统与中文化基线，再重做首页与 Explore，最后把详情页、代码区块和响应式体验拉齐。

## Current Status

- 统一的 `snippet.yaml` 内容协议与校验链路
- published-only feed / search / detail 公开发现体验
- signed upload、review / publish、artifact refresh、rate limit 的发布闭环
- 12 条已发布首发内容，覆盖 UI、interaction、state、AI template 四类场景

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

## Next Up

`$gsd-plan-phase 5`

从 Phase 5 开始把视觉系统和中文化基线锁住，再逐步推进公开站三块页面。

---
*v1.1 planned: 2026-03-25*
