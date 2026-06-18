# 架构设计

## 总体架构

```
                   ┌────────────────────────────────────────┐
                   │          宿主机 Nginx (80/443)           │
                   │  site1.example.com → 127.0.0.1:11001   │
                   │  site2.example.com → 127.0.0.1:11001   │
                   │  admin.example.com → 127.0.0.1:11001   │
                   └──────────────────┬─────────────────────┘
                                      │ Host 头透传
                   ┌──────────────────▼─────────────────────┐
                   │         Docker Compose 内部              │
                   │                                         │
                   │  ┌─────────────────────────────────┐   │
                   │  │        Nginx (:80)              │   │
                   │  │  admin.* → 静态文件 (admin-dist) │   │
                   │  │  *       → proxy_pass web:11001 │   │
                   │  │  /api/*  → proxy_pass server:11003│  │
                   │  └─────────────────────────────────┘   │
                   │                                         │
                   │  ┌──────────┐ ┌──────────┐ ┌────────┐ │
                   │  │  MySQL   │ │  Server  │ │  Web   │ │
                   │  │  :3306   │ │  :11003  │ │ :11001 │ │
                   │  └──────────┘ └──────────┘ └────────┘ │
                   └─────────────────────────────────────────┘
```

---

## 多站点架构

### 站点识别流程

```
浏览器请求 site1.example.com
        │
        ▼
宿主机 Nginx → proxy_pass http://127.0.0.1:11001
              → proxy_set_header Host site1.example.com
        │
        ▼
Docker Nginx → proxy_pass http://web:11001
             → proxy_set_header Host site1.example.com
        │
        ▼
Next.js middleware.ts:
  ① 读取 request.headers.get('host') → "site1.example.com"
  ② 调用 GET /api/sites/lookup?domain=site1.example.com
  ③ 后端查 Site 表 domain 字段 → { id: 1, slug: "site1" }
  ④ 设置 x-zqcms-site: site1 header
  ⑤ 写入 cookie zqcms_site=site1
        │
        ▼
所有 API 请求自动附带 ?site=site1 参数
        │
        ▼
后端 site middleware:
  优先级: X-Site-Id → ?site= → Host domain → 默认站点
        │
        ▼
数据库查询自动 WHERE siteId = 1
```

### 站点数据隔离

每个 `Site` 拥有独立的：

| 资源 | 隔离方式 |
|------|---------|
| 分类 (Category) | `siteId` 外键 |
| 文章 (Post) | `siteId` 外键 |
| 媒体 (Media) | `siteId` 外键 |
| 配置 (Site 表) | 一条记录一个站点 |
| 反馈 (Feedback) | `siteId` 外键 |

标签 (Tag) 和用户 (User) 为**全局共享**。

---

## 三层架构

### 1. 后端 API 层 (`packages/server`)

采用 **Routes → Services → Prisma** 分层架构：

```
src/
├── index.ts                   # Elysia 入口
│   ├── CORS（动态 origin）     # 支持开发/生产切换
│   ├── JWT 认证上下文           # 解析 Bearer token
│   ├── 站点识别上下文           # 注入 site + siteId
│   ├── GET /api/sites/lookup   # 域名→站点查询（公开）
│   └── GET /uploads/*          # 静态文件服务
├── routes/                    # 路由层（HTTP + 参数校验）
│   ├── auth.ts                # POST /api/auth/login
│   ├── posts.ts               # CRUD + 批量操作 + 排序
│   ├── categories.ts          # CRUD + 树形 + 排序
│   ├── sites.ts               # GET/PUT 当前站点
│   ├── sites-manage.ts        # CRUD 多站点
│   ├── tags.ts                # CRUD + 批量创建
│   ├── media.ts               # 上传 + 列表
│   ├── feedback.ts            # 公开提交 + 管理
│   ├── users.ts               # 用户管理（Admin only）
│   ├── llm.ts                 # AI 辅助配置 + 调用
│   ├── publish.ts             # 平台发布
│   └── sitemap.ts             # 动态 sitemap（已废弃，改为 Next.js 生成）
├── services/                  # 业务逻辑层
│   ├── post.service.ts
│   ├── category.service.ts
│   ├── tag.service.ts
│   ├── auth.service.ts
│   └── ...
├── middleware/                 # 中间件
│   ├── auth.ts                # JWT 解析 + beforeHandle 守卫
│   └── site.ts                # 站点识别（X-Site-Id / ?site / Host / default）
└── lib/                       # 工具库
    ├── prisma.ts              # Prisma Client 单例
    ├── jwt.ts                 # JWT 签发/验证
    └── revalidate.ts          # 前端缓存刷新通知
```

### 2. 前台站点层 (`packages/web`)

采用 Next.js 15 App Router + Server Components：

```
src/app/
├── layout.tsx                     # 根布局（meta/OG/Twitter/GA/skip-link）
├── robots.ts                      # robots.txt（Next.js 约定）
├── sitemap.ts                     # 动态 sitemap.xml（按站点生成）
├── rss.xml/route.ts               # RSS 2.0 Feed（GET handler）
├── api/revalidate/route.ts        # 缓存刷新（POST + Bearer 鉴权）
└── (site)/
    ├── layout.tsx                 # 站点布局
    │   ├── fetchAPI('/site')           → SiteSettings
    │   ├── fetchAPI('/categories')     → 导航菜单
    │   └── <Header> + <Breadcrumb> + <main> + <Footer>
    ├── page.tsx                   # 首页（热门文章 + 标签云 + 分类）
    ├── [...slug]/page.tsx         # ★ 统一路由
    │   ├── 末段为数字 → 文章页（Markdown + JSON-LD + OG）
    │   └── 否则     → 分类页（描述 + 文章列表）
    ├── search/page.tsx            # 搜索页（noindex）
    └── tag/
        ├── page.tsx               # 标签云（noindex）
        └── [slug]/page.tsx        # 标签文章列表
```

**SSR 数据流**：
1. 请求到达 → Next.js Server
2. `middleware.ts` 识别站点（Host → `/api/sites/lookup`）
3. Server Component 并行调用 `fetchAPI()` 获取数据
4. 渲染 HTML + 执行 `generateMetadata()` 生成 SEO 标签
5. 返回完整 HTML（含 JSON-LD 结构化数据）

**isr（增量静态再生成）**：
- API Client 中 `fetch` 设置 `next: { revalidate: 5 }`
- 每 5 秒自动检查数据更新

### 3. 管理后台层 (`packages/admin`)

Vite + React 19 SPA，通过 `X-Site-Id` header 切换管理站点：

```
src/
├── App.tsx                      # React Router 路由
├── pages/
│   ├── LoginPage.tsx            # 登录
│   ├── DashboardPage.tsx        # 仪表盘
│   ├── PostListPage.tsx         # 文章管理（过滤/分页/批量操作）
│   ├── PostFormPage.tsx         # 文章编辑（Markdown）
│   ├── CategoryListPage.tsx     # 分类管理（树形拖拽）
│   ├── TagListPage.tsx          # 标签管理（搜索/分页）
│   ├── SitesPage.tsx            # 站点管理
│   ├── SiteFormPage.tsx         # 站点配置
│   ├── SettingsPage.tsx         # 站点设置
│   ├── MediaPage.tsx            # 媒体库
│   ├── FeedbackListPage.tsx     # 反馈管理
│   ├── LlmConfigPage.tsx        # AI 配置
│   ├── PublishPlatformPage.tsx  # 发布平台
│   └── UserListPage.tsx         # 用户管理
├── components/
│   ├── layout/AdminLayout.tsx   # 侧边栏 + 站点切换器
│   └── ui/                      # Tooltip, ConfirmDialog 等
└── lib/
    ├── api-client.ts            # fetch 封装（自动 JWT + X-Site-Id）
    └── auth.ts                  # Token/User 管理
```

**认证流程**：
1. 登录 → `POST /api/auth/login` → 获取 JWT
2. JWT 存储到 `localStorage('zqcms_token')`
3. 所有请求自动附加 `Authorization: Bearer <token>` + `X-Site-Id: <id>`
4. 后端 `authBeforeHandle` 守卫验证

---

## 文章路由策略

使用 `[...slug]` catch-all 统一处理，通过 URL 末段是否为数字区分文章/分类：

```
/                           → 首页
/docs                       → 分类页（docs 分类）
/docs/42                    → 文章页（id=42，分类 docs 下）
/docs/guide                 → 子分类页（docs/guide 分类）
/docs/guide/99              → 文章页（id=99，分类 docs/guide 下）
```

路由判断：
1. `slug` 最后一段为纯数字 → 调用 `/api/posts/by-id/:id` 渲染文章
2. 否则 → 调用 `/api/categories/:fullSlug` 渲染分类页

---

## JSON-LD 结构化数据

文章页输出两类结构化数据：

**Article**：
```json
{
  "@type": "Article",
  "headline": "文章标题",
  "description": "摘要",
  "image": ["封面图"],
  "datePublished": "2026-06-15T10:00:00Z",
  "dateModified": "2026-06-16T08:00:00Z",
  "author": { "@type": "Person", "name": "作者" },
  "publisher": { "@type": "Organization", "name": "ZQCMS" },
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://..." }
}
```

**BreadcrumbList**：
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "首页", "item": "https://..." },
    { "@type": "ListItem", "position": 2, "name": "分类名", "item": "https://..." },
    { "@type": "ListItem", "position": 3, "name": "文章标题" }
  ]
}
```

---

## Docker 部署架构

```
docker compose up
├── mysql (3306)           — MySQL 8.0，持久化 mysql_data 卷
├── server (11003)         — Bun API，依赖 mysql，挂载 uploads_data 卷
├── web (11001)            — Next.js standalone，依赖 server
└── nginx (80→宿主机11001)  — 多阶段构建(admin SPA + nginx)，依赖 web+server
```

Docker 内部网络 `zqcms-net` 为 bridge 模式，服务间通过容器名通信：
- `server:11003` — API 地址
- `web:11001` — 前端地址
- `mysql:3306` — 数据库地址

---

## 前端代码分割

重型交互组件采用 `next/dynamic` 懒加载，减少首屏 JS：

| 组件 | 加载策略 |
|------|---------|
| SiteSwitcher | dynamic import（仅在 hover 时渲染） |
| FeedbackButton | dynamic import |
| SearchPanel | 已在 header 中，按需渲染（⌘K 触发） |
| TableOfContents | 文章页按需渲染 |
