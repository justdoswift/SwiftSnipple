---
status: partial
phase: 02-discovery-experience
source:
  - 02-VERIFICATION.md
started: 2026-03-24T08:43:12Z
updated: 2026-03-24T08:43:12Z
---

## Current Test

awaiting human testing

## Tests

### 1. 首页与 Explore 的真实浏览流
expected: 用户能在首页看到两张已发布卡片，点入后进入对应 `/snippets/{id}` 详情；Explore 输入关键词或点 facet 后结果立即刷新且 URL 同步变化。
result: pending

### 2. 详情页 Demo / Code / Prompt / License 标签切换与复制体验
expected: 有 demo 的条目优先展示视频；无 demo 的条目回退到 cover；Code 和 Prompt 的每个区块都有可点击复制按钮，且 Prompt 缺失时标签完全隐藏。
result: pending

### 3. 未公开 slug 的阻断态
expected: 直接访问 `/snippets/review-only-meter` 时显示“内容未公开”，不会显示详情内容，也不会被公开 feed 或搜索枚举出来。
result: pending

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

None yet.
