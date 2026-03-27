---
status: partial
phase: 08-admin-studio-v1
source:
  - .planning/phases/08-admin-studio-v1/08-01-SUMMARY.md
  - .planning/phases/08-admin-studio-v1/08-02-SUMMARY.md
started: 2026-03-25T10:35:14Z
updated: 2026-03-26T10:05:00Z
---

> Historical note: this UAT file mentions the earlier `shadcn-svelte` UI shell naming. Treat that wording as historical context rather than the current stack label.

## Current Test

number: 1
name: Studio 功能回归（基于新 UI 壳）
expected: |
  由于 Studio 已迁到新的 shadcn-svelte UI 壳，Phase 08 的人工验收需要按最新页面重新跑一遍。
  先从“新建 snippet 骨架”开始，确认新的列表页 / 新建页 / 编辑页结构下，后台真实功能没有因为 UI 重构退化。
awaiting: user response

## Tests

### 1. 新建 snippet 骨架
expected: 进入 `/studio/snippets/new` 后，填写 slug、标题和基础信息并提交，应跳转到新建内容的编辑页；新条目会出现在后台列表中，并且对应的 `content/snippets/<slug>/` 目录已生成标准骨架文件。
result: pending

### 2. 编辑保存与刷新回读
expected: 在编辑页修改标题、摘要、代码、Prompt 或 license 后点击“保存草稿”，刷新页面后修改内容仍可读回，不会丢失或回退成旧值。
result: pending

### 3. 媒体上传与预览
expected: 在编辑页上传 cover 或 demo 后，媒体区能显示对应预览；如果资源缺失，应有明确的空态，不会白屏或报错。
result: pending

### 4. 校验与发布闭环
expected: 在编辑页先运行校验，再触发 Review / Publish。状态应按 `draft -> review -> published` 变化，且发布后公开站可以读到更新后的内容。
result: pending

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

- truth: "Studio 已切换到新的 shadcn-svelte 页面骨架，之前的 UAT 结果不应直接沿用"
  status: pending
  reason: "需基于最新 UI 和 Playwright 基线重新执行人工验收"
  severity: medium
  test: 1
  root_cause: ""
  artifacts: []
  missing:
    - "重新确认新建 snippet 骨架是否在最新 UI 下稳定"
    - "重新确认编辑保存、媒体上传、发布闭环是否与新的页面结构一致"
  debug_session: ""
