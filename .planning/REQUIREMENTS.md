# Requirements: SwiftSnippet

**Defined:** 2026-03-25
**Core Value:** 用户必须能在几秒内找到一个可信、可复制、可复用的 SwiftUI 片段，并立即把它带回自己的项目或 AI 工作流中。

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
| 发布后台 / 管理台 UI 重做 | 这轮目标是公开站视觉重构，不扩散到维护者工作台 |
| Discovery / Publish 后端契约改写 | 当前后端边界已经可用，这轮优先改表现层 |
| 多语言内容源重构 | 本 milestone 先把公开站主文案中文化，内容源级国际化后置 |
| 新账号体系、社区、订阅功能 | 与这轮“公开站 UI 改版”目标无直接关系 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ART-01 | Phase 5 | Pending |
| L10N-01 | Phase 5 | Pending |
| ART-02 | Phase 6 | Pending |
| UX-01 | Phase 6 | Pending |
| L10N-02 | Phase 7 | Pending |
| UX-02 | Phase 7 | Pending |

**Coverage:**
- v1.1 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after v1.1 milestone definition*
