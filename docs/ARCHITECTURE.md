# 架构设计

## 总体架构

```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器                             │
│   访问 /docs/getting-started  →  获取完整 HTML           │
└──────────────┬──────────────────────────────────────────┘
               │ HTTP Request
┌──────────────▼──────────────────────────────────────────┐
│           Next.js 前端站点 (端口 11001)                   │
│                                                         │
│  Server Components 在服务端执行：                         │
│  ① 并行请求 Bun API 获取数据                             │
│  ② generateMetadata() 生成 SEO 元数据                    │
│  ③ 渲染 Layout + Navbar + Article + Footer              │
│  ④ 返回完整 HTML（含内联 CSS / 不含 JS 空白页）           │
│                                                         │
│  渲染流程：                                              │
│  fetch('http://localhost:11003/api/settings')           │
│  fetch('http://localhost:11003/api/categories')         │
│  fetch('http://localhost:11003/api/posts/...')          │
│     ↓                                                   │
│  Layout → Header → Navbar(categories) → Article → Footer│
└──────────────┬──────────────────────────────────────────┘
               │ HTTP (服务端 fetch)
┌──────────────▼──────────────────────────────────────────┐
│        Bun + Elysia.js API 服务 (端口 11003)             │
│                                                         │
│  Routes (路由层)  →  Services (业务逻辑)  →  Prisma ORM  │
│                                                         │
│  Middleware: JWT 认证、CORS、错误处理                     │
└──────────────┬──────────────────────────────────────────┘
               │ Prisma Client
┌──────────────▼──────────────────────────────────────────┐
│                  MySQL 8.0 数据库                        │
│  表: SiteSettings / Category / Post / User /            │
│      Tag / PostTag / PageBlock / Media                  │
└─────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────┐
│        Vite + React 管理后台 (端口 11002)                 │
│                                                         │
│  纯 SPA 应用，浏览器端直接请求 API                         │
│  Vite 开发代理: /api → http://localhost:11003            │
│                                                         │
│  认证流程:                                               │
│  ① POST /api/auth/login → 返回 JWT                     │
│  ② 存储到 localStorage                                  │
│  ③ 后续请求 Header: Authorization: Bearer <token>       │
└──────────────────────────────────────────────────────────┘
```

---

## 三层架构

### 1. 后端 API 层 (`packages/server`)

采用 **Routes → Services → Prisma** 分层架构：

```
src/
├── index.ts              # Elysia 入口，注册所有路由和中间件
├── routes/               # 路由层：定义 HTTP 方法和参数校验
│   ├── auth.ts           # POST /api/auth/login
│   ├── posts.ts          # CRUD + 排序 + slug 查询
│   ├── categories.ts     # CRUD + 树形结构 + 排序
│   ├── settings.ts       # GET/PUT 站点配置
│   ├── media.ts          # 文件上传和列表
│   ├── page-blocks.ts    # 首页区块 CRUD + 排序
│   ├── tags.ts           # 标签管理
│   └── sitemap.ts        # 动态站点地图
├── services/             # 业务逻辑层：数据查询、校验、事务
│   ├── post.service.ts
│   ├── category.service.ts
│   ├── auth.service.ts
│   ├── settings.service.ts
│   ├── media.service.ts
│   ├── page-block.service.ts
│   └── tag.service.ts
├── middleware/            # 中间件
│   └── auth.ts           # JWT 解析和认证守卫
└── lib/                  # 工具库
    ├── prisma.ts         # Prisma Client 单例
    └── jwt.ts            # JWT 签发和验证
```

**关键设计决策**：
- 文章路由使用 `/posts/:categorySlug/:slug` 和 `/posts/by-id/:id` 避免路由冲突
- 排序接口统一为 `POST /reorder`，接收 `{ items: [{ id, sortOrder }] }` 批量更新
- 分类支持无限层级嵌套（`parentId` 自引用）

### 2. 前台站点层 (`packages/web`)

采用 Next.js 15 App Router + Server Components：

```
src/app/
├── layout.tsx                    # 根布局（字体、全局样式、metadata）
├── (site)/
│   ├── layout.tsx                # ★ 站点唯一布局
│   │   ├── fetchAPI('/settings')     → SiteSettings
│   │   ├── fetchAPI('/categories')   → 导航菜单
│   │   └── 返回: <Header> + {children} + <Footer>
│   ├── page.tsx                  # 首页
│   │   ├── fetchAPI('/page-blocks?pageType=home')
│   │   └── 遍历 blocks 渲染对应区块组件
│   └── [...slug]/page.tsx        # ★ 动态路由（统一处理）
│       ├── slug.length === 1 → 分类页（描述 + 文章列表）
│       ├── slug.length === 2 → 文章页（Markdown 渲染）
│       └── 或 → 嵌套分类页
```

**SSR 数据流**：
1. 浏览器请求 `GET /docs/getting-started`
2. Next.js Server 执行 `CatchAllPage` Server Component
3. 服务端 `fetch()` 调用 Bun API（并行请求）
4. 获取数据后渲染 HTML 字符串
5. 同时执行 `generateMetadata()` 生成 SEO 标签
6. 返回完整 HTML 到浏览器

**ISR（增量静态再生成）**：
- API Client 中 `fetch` 设置 `next: { revalidate: 60 }` 
- 每 60 秒自动检查数据更新，重新生成静态页面

### 3. 管理后台层 (`packages/admin`)

采用 Vite + React 19 SPA 架构：

```
src/
├── main.tsx                    # ReactDOM 入口
├── App.tsx                     # React Router 路由配置
├── pages/                      # 页面组件
│   ├── LoginPage.tsx           # 登录
│   ├── DashboardPage.tsx       # 仪表盘（统计卡片）
│   ├── PostListPage.tsx        # 文章列表（分页 + 删除）
│   ├── PostFormPage.tsx        # 文章编辑（Markdown 编辑器）
│   ├── CategoryListPage.tsx    # 目录列表（树形结构）
│   ├── CategoryFormPage.tsx    # 目录表单
│   ├── PageBuilderPage.tsx     # ★ 首页可视化搭建
│   ├── SettingsPage.tsx        # 站点配置表单
│   └── MediaPage.tsx           # 媒体库（上传/复制/删除）
├── components/
│   ├── layout/AdminLayout.tsx  # 侧边栏 + 顶部栏布局
│   ├── editor/MarkdownEditor.tsx # @uiw/react-md-editor 封装
│   └── sortable/               # 拖拽排序组件（预留）
└── lib/
    ├── api-client.ts           # fetch 封装（自动添加 JWT）
    └── auth.ts                 # Token/User 管理工具
```

**认证流程**：
1. 登录 → POST `/api/auth/login` → 获取 JWT
2. JWT 存储到 `localStorage('zqcms_token')`
3. 所有 API 请求自动附加 `Authorization: Bearer <token>`
4. 后端中间件验证 JWT，拒绝未认证请求

---

## 首页可视化搭建

### 区块系统

首页由一组可排序的 **PageBlock** 组成，每个区块有类型和配置：

```
PageBlock {
  id: number
  pageType: "home"
  blockType: BlockType  ← HERO | FEATURES | CTA | POST_LIST | FAQ | MARKDOWN | CATEGORY_LIST
  title: string?
  config: JSON           ← 各类型自定义配置
  sortOrder: number
  isVisible: boolean
}
```

### 区块类型及配置

| 类型 | config 结构 | 渲染方式 |
|------|------------|----------|
| **HERO** | `{ title, subtitle, ctaText, ctaLink, alignment }` | 全宽横幅，渐变背景 |
| **FEATURES** | `{ columns, items: [{ icon, title, desc }] }` | 网格图标列表 |
| **CTA** | `{ title, desc, btnText, btnLink, bgColor }` | 居中行动号召 |
| **POST_LIST** | `{ categoryId?, limit, layout, columns }` | **服务端 fetch 文章列表** |
| **CATEGORY_LIST** | `{ columns, showCount }` | **服务端 fetch 分类列表** |
| **FAQ** | `{ items: [{ question, answer }] }` | 折叠面板 |
| **MARKDOWN** | `{ content: string }` | 自由 Markdown 内容 |

### 前台渲染流程

```typescript
// app/(site)/page.tsx
export default async function HomePage() {
  const blocks = await fetchAPI('/page-blocks?pageType=home');
  
  return blocks.filter(b => b.isVisible).map(block => (
    <PageBlockRenderer key={block.id} block={block} />
  ));
}
```

- Hero、Features、CTA、FAQ、Markdown → 纯客户端组件，直接渲染 config
- POST_LIST、CATEGORY_LIST → **服务端组件**，再次 fetch API 获取实时数据
- 所有渲染在服务端完成，保证 SSR

---

## 数据驱动设计

### 站点可复制性

换一个新站点只需：
1. 新建数据库 `zqcms_site2`
2. 执行 `init.sql` 创建表结构
3. 修改 `SiteSettings` 表中的站点名称、Logo、联系方式
4. 创建新的 Category 导航和 Post 文章

同一套代码即可部署无限个独立站点。

### 页面路由策略

使用 `[...slug]` catch-all 路由统一处理所有前台页面：

```
/                       → HomePage（首页区块渲染）
/docs                   → CategoryPage（分类描述 + 文章列表）
/docs/getting-started   → PostPage（Markdown 文章）
/docs/api/rest          → 子分类页 或 查看文章
```

路由判断逻辑：
1. 1 段 slug → 尝试匹配 Category → 展示分类页
2. 2 段 slug → 尝试匹配 Category + Post → 展示文章页
3. N 段 slug → 尝试匹配嵌套 Category
