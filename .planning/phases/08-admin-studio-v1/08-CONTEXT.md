# Phase 08 Context — Admin Studio v1

## Why This Phase Exists

公开站 UI 已经完成一轮收口，但新的内容录入仍然依赖直接改仓库文件，导致新增 snippet、补媒体、跑校验和触发发布都很低效。当前优先级因此从公开站视觉收尾切到内部运营效率：先把维护者工作流包进一个受保护的 `/studio` 运营后台。

## Locked Decisions

- 后台对象是内部运营台，不做外部创作者平台
- 内容源继续以 `snippet.yaml` + 固定目录结构为权威边界
- 登录方式为单管理员密码 + `httpOnly` session cookie
- `/studio` 承载在现有 `apps/web` 中，不另起新前端
- Review / Publish 继续复用现有 Go publish pipeline，而不是重写状态机

## Scope

- `/studio/login`、`/studio`、`/studio/snippets`、`/studio/snippets/new`、`/studio/snippets/[id]`
- 受保护的 admin session / snippets API
- snippet 骨架生成
- 文件协议读写、校验、媒体上传预览、Review / Publish 触发

## Non-Goals

- 多用户、角色权限、审计日志
- Git 提交、PR、merge 可视化
- Monaco / 富代码编辑器
- 对外投稿与社区工作流

## Verification Focus

- 登录是否稳定
- 列表 / 新建 / 编辑 / 校验 / Review / Publish 是否形成闭环
- 后台写入是否真的回到仓库文件，而不是停留在内存或临时状态
- 公开站和现有 discovery 行为不能因为后台接入而退化
