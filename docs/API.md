# API 参考

Base URL: `http://localhost:11003/api`

---

## 认证

所有需要认证的接口需在 Header 中附带：
```
Authorization: Bearer <token>
```

### POST /api/auth/login

管理员登录，获取 JWT Token。

**请求体**:
```json
{
  "email": "admin@zqcms.com",
  "password": "admin123"
}
```

**响应**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cm_default_admin",
    "email": "admin@zqcms.com",
    "name": "管理员",
    "role": "ADMIN"
  }
}
```

---

## 站点 (Sites)

### GET /api/site

获取当前站点配置（公开，无需认证）。站点由 Host 头 / `X-Site-Id` / `?site=` 参数自动识别。

### PUT /api/site （需认证）

更新当前站点配置。请求体中所有字段可选：
```json
{
  "name": "站点名称",
  "slug": "site-slug",
  "domain": "example.com",
  "description": "站点描述",
  "logo": "/uploads/1/logo.png",
  "favicon": "/uploads/1/favicon.ico",
  "primaryColor": "#3B82F6",
  "contactEmail": "hello@example.com",
  "contactPhone": "13800138000",
  "address": "北京市朝阳区",
  "socialLinks": { "github": "https://github.com/..." },
  "socialQRCodes": { "微信公众号": "/uploads/1/qr.png" },
  "footerText": "页脚文案",
  "copyright": "© 2026 Company",
  "gaId": "G-XXXXXXXXXX",
  "icp": "京ICP备2024000001号"
}
```

### GET /api/sites/lookup?domain=example.com

通过域名查询站点（公开，无需认证）。用于 middleware 域名→站点映射。

**响应**:
```json
{
  "id": 1,
  "slug": "site1",
  "domain": "site1.example.com"
}
```

### GET /api/sites

站点列表（管理后台使用）。

### POST /api/sites （需认证）

创建新站点：
```json
{
  "name": "新站点",
  "slug": "new-site",
  "domain": "new.example.com",
  "description": "描述",
  "isActive": true
}
```

### PUT /api/sites/:id （需认证）

更新站点。

### DELETE /api/sites/:id （需认证）

删除站点。

---

## 文章 (Posts)

### GET /api/posts

获取文章列表（公开，支持多站点隔离、分页、筛选、搜索）。

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| pageSize | number | 20 | 每页数量 |
| status | string | - | DRAFT / PUBLISHED / ARCHIVED |
| categorySlug | string | - | 按分类 slug 筛选 |
| categoryId | number | - | 按分类 ID 筛选 |
| search | string | - | 搜索关键词（标题/内容/摘要） |
| isFeatured | boolean | - | 是否精选 |
| tagSlug | string | - | 按标签 slug 筛选 |
| orderBy | string | publishedAt | 排序字段 |
| orderDir | string | desc | asc / desc |
| includeDescendants | boolean | false | 是否包含子分类文章 |

**响应**:
```json
{
  "data": [ { "id": 1, "title": "...", ... } ],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

### GET /api/posts/by-id/:id

按 ID 获取单篇文章。

### POST /api/posts （需认证）

创建文章：
```json
{
  "title": "文章标题",
  "slug": "post-slug",
  "content": "# Markdown 内容",
  "excerpt": "摘要",
  "coverImage": "/uploads/1/cover.jpg",
  "status": "DRAFT",
  "categoryId": 1,
  "seoTitle": "SEO 标题",
  "seoDesc": "SEO 描述",
  "isFeatured": false,
  "isPinned": false,
  "tagIds": [1, 2]
}
```

### PUT /api/posts/by-id/:id （需认证）

更新文章。所有字段可选。

### DELETE /api/posts/by-id/:id （需认证）

删除文章。

### POST /api/posts/batch （需认证）

批量操作文章：
```json
{
  "ids": [1, 2, 3],
  "action": "publish|unpublish|pin|unpin|feature|unfeature|delete"
}
```

---

## 分类 (Categories)

### GET /api/categories

获取分类列表（公开）。

**查询参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| all | boolean | 是否包含隐藏分类 |
| tree | boolean | 是否返回树形结构 |

### GET /api/categories/tree

获取分类树（多级嵌套）。

### GET /api/categories/:slug

获取单个分类详情。

### GET /api/categories/:slug?withPosts=true

获取分类详情及其文章（支持分页：`&page=1&pageSize=20&includeDescendants=true`）。

### POST /api/categories （需认证）

创建分类：
```json
{
  "name": "新分类",
  "slug": "new-category",
  "description": "描述",
  "icon": "BookOpen",
  "sortOrder": 0,
  "isVisible": true,
  "parentId": null
}
```

### PUT /api/categories/:id （需认证）

更新分类。

### DELETE /api/categories/:id （需认证）

删除分类。**文章不会被删除**，其 `categoryId` 自动置为 `null`（Prisma `onDelete: SetNull`）。

### POST /api/categories/reorder （需认证）

拖拽排序：
```json
{ "items": [{ "id": 1, "sortOrder": 0 }, { "id": 2, "sortOrder": 1 }] }
```

---

## 标签 (Tags)

### GET /api/tags

获取标签列表（公开）。

### GET /api/tags/by-slug/:slug

按 slug 获取标签。

### POST /api/tags （需认证）

创建标签：
```json
{ "name": "教程", "slug": "tutorial" }
```

### PUT /api/tags/:id （需认证）

更新标签。

### DELETE /api/tags/:id （需认证）

删除标签。**文章不会被删除**，仅删除关联记录（Prisma `onDelete: Cascade` 在 `PostTag` 表）。

### POST /api/tags/batch-create （需认证）

批量创建标签（已有则复用）：
```json
{ "names": ["教程", "前端", "React"] }
```

---

## 媒体 (Media)

### GET /api/media

文件列表。

**查询参数**: `page`, `pageSize`, `mimeType`

### POST /api/media/upload （需认证）

上传文件（multipart/form-data）。
- 字段名: `file`
- 支持: JPEG / PNG / GIF / WebP / SVG / PDF / MP4
- 大小: ≤ 10MB

### DELETE /api/media/:id （需认证）

删除文件。

---

## 反馈 (Feedback)

### POST /api/feedback （公开）

提交反馈：
```json
{
  "name": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "content": "建议增加暗色模式",
  "pageUrl": "/docs/quickstart"
}
```
> `phone` 或 `email` 至少提供一个。

### GET /api/feedback （需认证）

反馈列表（管理后台）。

### PUT /api/feedback/:id （需认证）

更新反馈状态：
```json
{ "status": "reviewed" }
```
状态可选: `pending` / `reviewed` / `resolved` / `closed`

### DELETE /api/feedback/:id （需认证）

删除反馈。

---

## 用户 (Users) — 仅管理员

### GET /api/users

用户列表。

### POST /api/users （需认证）

创建用户：
```json
{
  "email": "editor@example.com",
  "password": "password123",
  "name": "编辑",
  "role": "EDITOR"
}
```

### PUT /api/users/:id （需认证）

更新用户。

### DELETE /api/users/:id （需认证）

删除用户。

---

## AI 辅助 (LLM)

### GET /api/llm/configs （需认证）

LLM 配置列表。

### POST /api/llm/configs （需认证）

创建 LLM 配置：
```json
{
  "name": "GPT-4o",
  "provider": "openai",
  "apiKey": "sk-...",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4o",
  "isActive": true
}
```

### POST /api/llm/assist （需认证）

AI 辅助内容生成：
```json
{
  "action": "generate|summarize|extractTags|classify|generateTitle|format|generateSeo",
  "content": "原始内容...",
  "title": "可选标题",
  "categories": ["分类1", "分类2"],
  "existingTags": ["已有标签"]
}
```

---

## 内容发布 (Publish)

### GET /api/publish/platforms （需认证）

发布平台列表。

### POST /api/publish/platforms （需认证）

创建发布平台：
```json
{
  "name": "官方公众号",
  "platform": "wechat",
  "appId": "wx...",
  "appSecret": "..."
}
```

### POST /api/publish/submit （需认证）

提交发布：
```json
{ "postId": 1, "platformId": 1 }
```

---

## 缓存刷新 (Revalidate)

### POST /api/revalidate

通知前端刷新缓存。需要 Bearer Token 鉴权（环境变量 `REVALIDATE_TOKEN`）。

```json
{ "paths": ["/", "/docs/42"], "token": "your-revalidate-token" }
```

或通过 HTTP Header:
```
Authorization: Bearer your-revalidate-token
```

---

## 错误响应

所有错误返回统一格式：
```json
{
  "success": false,
  "error": "错误描述信息"
}
```

常见状态码：

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证（缺少或无效 JWT） |
| 404 | 资源不存在 |
| 409 | 资源冲突（唯一键重复） |
| 422 | 参数校验失败 |
| 500 | 服务器内部错误 |
