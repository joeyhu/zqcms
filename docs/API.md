# API 参考

Base URL: `http://localhost:11003/api`

---

## 认证

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

**后续请求**：在 Header 中附带 `Authorization: Bearer <token>`

---

## 文章 (Posts)

### GET /api/posts

获取文章列表（支持分页、筛选、搜索）。

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| pageSize | number | 20 | 每页数量 |
| status | string | - | DRAFT / PUBLISHED / ARCHIVED |
| featured | boolean | - | 是否特色文章 |
| categorySlug | string | - | 按分类筛选 |
| search | string | - | 搜索关键词（标题/内容/摘要） |
| tagId | number | - | 按标签筛选 |

**响应**:
```json
{
  "data": [
    {
      "id": 1,
      "title": "快速开始指南",
      "slug": "quickstart",
      "content": "# 快速开始...",
      "excerpt": "5分钟快速上手...",
      "coverImage": null,
      "status": "PUBLISHED",
      "sortOrder": 1,
      "categoryId": 1,
      "category": { "id": 1, "name": "产品文档", "slug": "docs" },
      "author": { "id": "...", "name": "管理员", "email": "admin@zqcms.com" },
      "tags": [
        { "tag": { "id": 1, "name": "教程", "slug": "tutorial" } }
      ],
      "seoTitle": "快速开始 - ZQCMS",
      "seoDesc": "5分钟快速上手...",
      "viewCount": 1024,
      "isFeatured": true,
      "publishedAt": "2026-06-15T10:00:00.000Z",
      "createdAt": "2026-06-15T10:00:00.000Z",
      "updatedAt": "2026-06-15T10:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

### GET /api/posts/featured

获取特色文章列表（最多 10 篇）。

### GET /api/posts/:categorySlug/:slug

按分类 slug + 文章 slug 获取单篇文章。

**示例**: `GET /api/posts/docs/quickstart`

### GET /api/posts/by-id/:id

按 ID 获取文章（管理后台使用）。

---

### POST /api/posts （需认证）

创建文章。

**请求体**:
```json
{
  "title": "新文章标题",
  "slug": "new-post",
  "content": "# 标题\n\nMarkdown 内容...",
  "excerpt": "文章摘要",
  "coverImage": "https://example.com/image.jpg",
  "status": "DRAFT",
  "sortOrder": 0,
  "categoryId": 1,
  "seoTitle": "SEO 标题",
  "seoDesc": "SEO 描述",
  "isFeatured": false,
  "tagIds": [1, 2]
}
```

### PUT /api/posts/by-id/:id （需认证）

更新文章。请求体与创建相同（所有字段可选）。

### DELETE /api/posts/by-id/:id （需认证）

删除文章（不可恢复）。

### POST /api/posts/reorder （需认证）

文章拖拽排序（批量更新 sortOrder）。

**请求体**:
```json
{
  "items": [
    { "id": 1, "sortOrder": 0 },
    { "id": 3, "sortOrder": 1 },
    { "id": 2, "sortOrder": 2 }
  ]
}
```

---

## 分类 (Categories)

### GET /api/categories

获取分类列表。

**查询参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| tree | boolean | 是否返回树形结构 |
| all | boolean | 是否包含隐藏分类 |
| withPosts | boolean | 是否附带文章列表 |

### GET /api/categories/tree

获取分类树（多级嵌套结构）。

**响应**:
```json
[
  {
    "id": 1,
    "name": "产品文档",
    "slug": "docs",
    "sortOrder": 1,
    "isVisible": true,
    "children": [
      {
        "id": 7,
        "name": "快速开始",
        "slug": "docs/getting-started",
        "children": []
      }
    ]
  }
]
```

### GET /api/categories/:slug

获取单个分类详情。

### GET /api/categories/:slug?withPosts=true

获取分类详情及其下的所有文章。

---

### POST /api/categories （需认证）

创建分类。

**请求体**:
```json
{
  "name": "新分类",
  "slug": "new-category",
  "description": "分类描述",
  "icon": "BookOpen",
  "sortOrder": 0,
  "isVisible": true,
  "parentId": null
}
```

### PUT /api/categories/:id （需认证）

更新分类。请求体与创建相同（所有字段可选）。

### DELETE /api/categories/:id （需认证）

删除分类。注意：该分类下的文章也会被级联删除。

### POST /api/categories/reorder （需认证）

分类拖拽排序（批量更新 sortOrder）。请求格式与文章排序相同。

---

## 站点配置 (Settings)

### GET /api/settings

获取站点全局配置。

**响应**:
```json
{
  "id": 1,
  "siteName": "ZQCMS - 内容管理系统",
  "siteDescription": "快速构建产品内容站点...",
  "logo": null,
  "favicon": null,
  "primaryColor": "#3B82F6",
  "contactEmail": "hello@zqcms.com",
  "contactPhone": null,
  "address": null,
  "socialLinks": { "github": "https://github.com/zqcms" },
  "footerText": "用技术让内容管理更简单",
  "copyright": "© 2026 ZQCMS",
  "gaId": null
}
```

### PUT /api/settings （需认证）

更新站点配置。所有字段可选。

---

## 首页区块 (Page Blocks)

### GET /api/page-blocks?pageType=home

获取指定页面的区块列表（按 sortOrder 排序）。

### GET /api/page-blocks/:id

获取单个区块详情。

---

### POST /api/page-blocks （需认证）

创建新区块。

**请求体**:
```json
{
  "pageType": "home",
  "blockType": "HERO",
  "title": "首页横幅",
  "config": {
    "title": "快速构建内容站点",
    "subtitle": "数据驱动的 CMS...",
    "ctaText": "查看文档",
    "ctaLink": "/docs"
  },
  "sortOrder": 0,
  "isVisible": true
}
```

### PUT /api/page-blocks/:id （需认证）

更新区块。所有字段可选。

### DELETE /api/page-blocks/:id （需认证）

删除区块。

### POST /api/page-blocks/reorder （需认证）

区块拖拽排序。请求格式与文章排序相同。

### BlockType 枚举

```
HERO          - 全宽横幅
FEATURES      - 特性列表
CTA           - 行动号召
POST_LIST     - 文章列表
CATEGORY_LIST - 分类列表
FAQ           - 折叠问答
MARKDOWN      - 自由 Markdown 内容
TESTIMONIALS  - 客户评价（预留）
CONTACT       - 联系方式（预留）
DIVIDER       - 分割线（预留）
```

---

## 标签 (Tags)

### GET /api/tags

获取所有标签。

### POST /api/tags （需认证）

创建标签。

```json
{ "name": "教程", "slug": "tutorial" }
```

### DELETE /api/tags/:id （需认证）

删除标签。

---

## 媒体 (Media)

### GET /api/media

获取上传文件列表。

**查询参数**: `page`, `pageSize`, `mimeType`

### POST /api/media/upload （需认证）

上传文件（multipart/form-data）。

**表单字段**: `file` — 文件

**支持格式**: JPEG, PNG, GIF, WebP, SVG, PDF, MP4
**大小限制**: 10MB

### DELETE /api/media/:id （需认证）

删除文件。

---

## 站点地图 (Sitemap)

### GET /api/sitemap

返回 XML 格式的站点地图。

---

## 错误响应格式

所有错误返回统一格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

常见 HTTP 状态码：

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证（缺少或无效 JWT） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
