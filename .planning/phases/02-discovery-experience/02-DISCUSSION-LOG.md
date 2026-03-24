# Phase 2: Discovery Experience - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 2-Discovery Experience
**Areas discussed:** Feed composition and browsing feel, Search and facet interaction, Detail page information architecture, Published-only visibility rules

---

## Feed composition and browsing feel

| Option | Description | Selected |
|--------|-------------|----------|
| A | 规则网格卡片，信息密度更高，浏览更快 | |
| B | 大视觉卡片流，媒体更抢眼，像作品集 | ✓ |
| C | 混合型：桌面端规则网格，移动端偏大卡 | |

**User's choice:** `1 B`
**Notes:** 用户希望 Discovery 首页更像作品集式浏览体验，而不是文档站或工具后台式高密度列表。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 难度 + 平台 | ✓ |
| B | 是否包含 `code` / `prompt` / `demo` | |
| C | 上面两类都露出 | |
| D | 尽量克制，进入详情再看 | |

**User's choice:** `2 A`
**Notes:** 卡片需要在进入详情前就帮助用户快速判断适用范围。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 静态封面优先，hover 或详情再看 demo | ✓ |
| B | 能动就动，优先展示 demo 预览 | |
| C | 有 demo 就动，没有就封面 | |

**User's choice:** `3 A`
**Notes:** 用户更偏克制的默认预览方式，避免 feed 过早变成自动播放画廊。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 编辑精选感，优先展示最能代表平台价值的内容 | |
| B | 最新发布优先，让内容持续有新鲜感 | |
| C | 混合排序，精选优先但保留“新内容”露出 | ✓ |

**User's choice:** `4 C`
**Notes:** 希望首页既有 curated 感，也能让新内容被看见。

---

## Search and facet interaction

| Option | Description | Selected |
|--------|-------------|----------|
| A | Feed 顶部一体化搜索栏，用户就在当前页面搜 | |
| B | 单独的 Explore/Search 页，搜索是主角 | ✓ |
| C | 首页先展示内容，点进后才进入完整搜索体验 | |

**User's choice:** `1 B`
**Notes:** 用户更倾向把搜索当作明确的探索场景，而不是首页的附属功能。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 顶部 chips/segmented controls，尽量轻量 | ✓ |
| B | 桌面端左侧筛选栏，移动端抽屉 | |
| C | 混合型：顶部只放常用项，完整筛选收进侧栏/抽屉 | |

**User's choice:** `2 A`
**Notes:** 即使 Explore 独立成页，筛选也不应做成复杂后台式控件。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 实时生效，输入和点选后立刻刷新结果 | ✓ |
| B | 关键词按回车生效，facet 点选即时生效 | |
| C | 统一点“应用筛选”后再更新结果 | |

**User's choice:** `3 A`
**Notes:** 用户偏好更顺滑、更接近消费型产品的搜索体验。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 明确空状态，并提供“清空筛选/回到推荐” | |
| B | 保留当前条件，同时推荐相近的已发布内容 | |
| C | 两者都要：先说明没结果，再给替代推荐 | ✓ |

**User's choice:** `4 C`
**Notes:** 搜索失败不能让用户走进死胡同，需要同时给解释和退路。

---

## Detail page information architecture

| Option | Description | Selected |
|--------|-------------|----------|
| A | Demo / 视觉预览优先，先确认“这个效果值不值得抄” | ✓ |
| B | 代码优先，直接进入可复制实现 | |
| C | 提示词优先，突出 AI 协作复用 | |
| D | 混合首屏：左边 demo，右边标题摘要 + 关键 metadata + 操作按钮 | |

**User's choice:** `1 A`
**Notes:** 详情页应延续“先看效果，再决定是否复用”的产品节奏。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 一页纵向阅读，按区块往下看 | |
| B | 以 tab 为主，在 `Demo / Code / Prompt / License` 间切换 | |
| C | 混合型：首屏固定信息，下面用 tab 切换主体内容 | ✓ |

**User's choice:** `2 C`
**Notes:** 用户更偏向兼顾概览和聚焦阅读的混合结构。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 每个代码块 / 提示词块各自一键复制，简单直接 | ✓ |
| B | 提供“复制主实现”与“复制提示词模板”两个主按钮，块级复制作为次要 | |
| C | 两者都要，既有主按钮也有块级复制 | |

**User's choice:** `3 A`
**Notes:** 先把最简单直接的复制路径做好，再考虑更强的复合复制动作。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 首屏就能看到一个简明摘要，详细内容在下方展开 | |
| B | 放在页面下半部分，用户需要时再看 | ✓ |
| C | 桌面端做侧边信息栏，移动端放到底部信息区 | |

**User's choice:** `4 B`
**Notes:** license 必须清晰可查，但不需要压到视觉首屏里。

---

## Published-only visibility rules

| Option | Description | Selected |
|--------|-------------|----------|
| A | 直接 `404` | |
| B | 显示“内容未公开” | ✓ |
| C | 登录后可见提示，匿名用户 `404` | |

**User's choice:** `1 B`
**Notes:** 未发布 slug 不应伪装为正常公开内容，但也不想完全伪装成不存在。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 完全不可枚举，不出现在任何公开结果里 | ✓ |
| B | 可保留占位，但不能点进详情 | |
| C | 只对某些特殊入口隐藏 | |

**User's choice:** `2 A`
**Notes:** 用户明确要求公开 Discovery 只消费真正的 published 内容。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 仍然展示，但回退到静态 cover / 占位样式 | ✓ |
| B | 不在 feed 展示，只允许直达详情 | |
| C | 公开站直接视为不可展示内容 | |

**User's choice:** `3 A`
**Notes:** published 内容即使缺 demo，也不应完全从 Discovery 中消失。

| Option | Description | Selected |
|--------|-------------|----------|
| A | 正常展示已有部分，缺失部分明确标“暂不可用” | |
| B | 只有同时具备 code 和 prompt 才允许进入公开详情 | |
| C | 缺哪个就隐藏哪个区块，不额外解释 | ✓ |

**User's choice:** `4 C`
**Notes:** 用户希望前台保持克制，不用额外文案放大缺失项。

---

## the agent's Discretion

- Explore 页与首页之间的具体路由关系
- “精选 + 新内容露出”的具体排序实现方式
- 详情页 tabs 的具体名称、布局与动画
- “内容未公开”页的具体文案和视觉表现

## Deferred Ideas

- 搜索引擎最终选型和索引更新机制留到 Phase 2 研究/规划阶段
- richer media 交互如 hover 自动播放、沉浸式 demo 浏览留待后续增强
- reviewer-only 预览、后台可见性和未发布鉴权访问属于 Phase 3
