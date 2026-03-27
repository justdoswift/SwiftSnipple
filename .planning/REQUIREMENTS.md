# Requirements: SwiftSnippet

**Defined:** 2026-03-25
**Core Value:** 用户必须能在几秒内找到一个可信、可复制、可复用的 SwiftUI 片段，并立即把它带回自己的项目或 AI 工作流中。

## v1.2 Requirements

### Admin Access

- [ ] **OPS-01**: 维护者可以通过单管理员密码进入 `/studio`，并访问受保护的后台页面与后台写接口

### Content Operations

- [ ] **OPS-02**: 维护者可以在后台创建 snippet 骨架，并直接编辑 `snippet.yaml`、代码、Prompt、license、平台与标签
- [ ] **OPS-03**: 维护者可以在后台运行校验，并沿用现有 `draft -> review -> published` 状态机完成发布
- [ ] **OPS-04**: 维护者可以在后台补充 cover / demo 媒体，并看到明确的预览与错误反馈

## v1.1 Requirements

### Art Direction

- [ ] **ART-01**: 用户打开公开站时，能立即感知到统一的深色编辑部风格视觉身份，而不是通用卡片站样式
- [ ] **ART-02**: 用户在首页与 Explore 中看到一致的卡片、筛选、元信息和媒体展示语言

### Localization

- [ ] **L10N-01**: 用户在首页、Explore、详情页的导航、标题、状态与操作文案中看到中文主文案
- [ ] **L10N-02**: 用户能通过本地化标签快速理解 snippet 的难度、分类、Demo / Prompt 可用性与复用入口

### Usability

- [ ] **UX-01**: 用户可以在首页、Explore、snippet 详情页之间顺畅往返，不会在浏览流中迷路
- [ ] **UX-02**: 用户在桌面和移动端浏览改版后的首页、Explore 和详情页时，不会遇到裁切媒体、重叠文本或难以点击的控件
- [ ] **UX-03**: 公开站与 `/studio` 的页面默认优先留白、克制密度和较低心智压力，不为了填满画面而堆叠过多信息或控件
- [ ] **UX-04**: 所有公开站与 `/studio` 的 UI 文案都必须是真实、自然、面向用户的产品语言，不能出现解释性说明、开发备注或组件占位文字
- [ ] **UX-05**: 公开站与 `/studio` 的标题、正文、按钮高度、输入框高度、圆角和间距必须遵守统一尺寸体系，不能在页面里零散定义导致视觉层级失控
- [ ] **UX-06**: 已接入的 `HeroUI React + Tailwind` 组件必须被作为真实共享设计系统使用；页面层只能做有限品牌化调整，不能大面积覆写成另一套不一致的按钮、表单、卡片和 tabs 视觉

## v1.2+ Requirements

### Internationalization

- **I18N-01**: 内容源本身支持多语言 title / summary，而不只是在 UI 层做中文化
- **I18N-02**: 用户可以切换站点语言并保持浏览上下文

### Public Growth

- **GROW-01**: 用户可以收藏 snippet 并返回个人收集列表
- **GROW-02**: 用户可以导出片段包或分享整理后的 snippet 集合

## Out of Scope

| Feature | Reason |
|---------|--------|
| 多用户账号体系、角色权限、审计日志 | v1 后台先服务单管理员，不提前把运营台做成企业后台 |
| Git commit / PR / merge 工作流可视化 | 这轮只解决录入与发布闭环，不把代码审阅体系搬进后台 |
| Discovery / Publish 公共 API 改写 | 公开站消费边界已可用，这轮只新增 admin 保护写接口 |
| 多语言内容源重构 | 内容源级国际化后置，后台先围绕当前中文/SwiftUI 内容生产闭环 |
| 新账号体系、社区、订阅功能 | 与当前“内部运营台”目标无直接关系 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| OPS-01 | Phase 8 | Pending verification |
| OPS-02 | Phase 8 | Pending verification |
| OPS-03 | Phase 8 | Pending verification |
| OPS-04 | Phase 8 | Pending verification |
| ART-01 | Phase 5 | Pending |
| L10N-01 | Phase 5 | Pending |
| ART-02 | Phase 6 | Pending |
| UX-01 | Phase 6 | Pending |
| L10N-02 | Phase 7 | Pending |
| UX-02 | Phase 7 | Pending |
| UX-03 | Cross-phase UI work | Active |
| UX-04 | Cross-phase UI work | Active |
| UX-05 | Cross-phase UI work | Active |
| UX-06 | Cross-phase UI work | Active |

**Coverage:**
- v1.2 requirements: 4 total
- v1.1 requirements: 8 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-27 after current-stack documentation cleanup*
