---
status: complete
phase: 03-publish-pipeline
source:
  - 03-01-SUMMARY.md
  - 03-02-SUMMARY.md
  - 03-03-SUMMARY.md
started: 2026-03-25T02:17:17Z
updated: 2026-03-25T02:29:41Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: 停掉现有 API 进程后，从零启动 Phase 3 本地环境：数据库可连通，API 能正常启动，无启动时报错；随后访问 `GET /health` 或任一基础公开读接口会返回可用响应，而不是迁移失败、种子缺失或依赖未就绪错误。
result: pass

### 2. Request Signed Upload URL
expected: 调用 `POST /api/v1/media/upload-url` 并提交合法的 `snippetID`、`version`、`assetKind`、`contentType`、`contentLength` 后，会返回一组可用于上传的签名信息；请求只接受 `cover` 或 `demo` 资产，且对象键由服务端约束生成，不需要客户端直接持有云存储凭证。
result: pass

### 3. Move Draft Snippet to Review
expected: 调用 `POST /api/v1/publish/snippets/{id}/review` 后，处于 `draft` 的 snippet 会被明确推进到 `review`；响应应体现成功或明确说明为何不能流转，而不是静默失败或模糊 500。
result: pass

### 4. Publish Validation Failure Is Actionable
expected: 对未满足发布条件的 snippet 调用 `POST /api/v1/publish/snippets/{id}/publish` 时，接口会返回结构化、可定位的 422 类错误信息，指出协议、媒体、license 或发布准备度问题，而不是返回泛化错误。
result: pass

### 5. Successful Publish Refreshes Artifact Outputs
expected: 对已进入 `review` 且准备就绪的 snippet 执行 publish 后，请求会成功完成状态流转，并在响应中返回刷新后的公开产物信息，覆盖 `content/published/snippets.json`、`content/published/visibility.json`、`content/published/search-documents.json`。
result: pass

### 6. Discovery Reads Fresh Published State
expected: 发布成功后，不需要手动重启服务或清空进程内缓存，同进程的 discovery feed/search/detail 读路径就能看到新发布内容或最新可见性状态，而不是继续返回旧快照。
result: pass

### 7. Write Paths Are Rate Limited Without Breaking Public Reads
expected: 对 upload/review/publish 这些写接口进行快速重复调用时，会触发基础限流并得到明确的限流响应；与此同时，公开的 discovery 读接口仍保持可访问，不会被同一限流策略误伤。
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

None yet.
