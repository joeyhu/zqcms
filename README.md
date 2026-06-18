# ZQCMS — 多站点 Headless CMS

一个**完全数据驱动**的 Headless CMS，支持多站点、多子域名。所有内容（站点配置、导航、文章、首页布局）均存储在 MySQL 数据库中。一套代码，换一套数据即为全新站点。

---

## 核心特性

| 特性 | 说明 |
|------|------|
| **多站点** | 支持无限子域名，每个站点独立数据、独立域名、独立 SEO |
| **数据驱动** | 站点名称、Logo、联系方式、导航、文章、首页布局全部在数据库维护 |
| **SSR + SEO** | Next.js 15 服务端渲染，JSON-LD 结构化数据、sitemap.xml、RSS feed |
| **Docker 部署** | 一键 `docker compose up`，包含 MySQL + API + Web + Nginx |
| **多级导航** | Category 树形结构，无限层级嵌套，拖拽排序 |
| **Markdown 内容** | 所有内容使用 Markdown 编写，前后端一体渲染 |
| **可视化首页搭建** | 7 种区块类型（Hero、Features、FAQ、CTA…），拖拽排列 |
| **统一媒体库** | 支持图片/PDF/视频上传管理，可在 Markdown 中引用 |
| **拖拽排序** | 文章、目录、首页区块均支持拖拽排序 |
| **AI 辅助** | 集成 LLM，支持内容生成、摘要、SEO 优化、标签提取 |

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **运行时** | Bun | 1.3+ |
| **后端框架** | Elysia.js | 1.x |
| **ORM** | Prisma | 6.x |
| **数据库** | MySQL | 8.0+ |
| **前台站点** | Next.js (App Router) | 15.x |
| **管理后台** | Vite + React 19 | 6.x |
| **CSS 框架** | Tailwind CSS | 4.x |
| **反向代理** | Nginx (Docker 内置) | alpine |
| **认证** | JWT (jose) | 5.x |
| **测试** | Bun Test (内置) | - |

---

## 项目结构

```
zqcms/
├── scripts/                  # 运维脚本
├── shared/                   # 共享类型和常量
│   ├── types.ts              # 全栈 TypeScript 类型
│   └── constants.ts          # 常量定义
├── docker/                   # Docker 配置
│   ├── server.Dockerfile     # Bun 后端镜像
│   ├── web.Dockerfile        # Next.js 前端镜像（standalone）
│   ├── nginx.Dockerfile      # Nginx + Admin SPA（多阶段构建）
│   └── nginx.conf            # 内部路由（admin 子域名分流）
├── docker-compose.yml        # 四服务编排
├── .env.production           # 生产环境变量模板
├── packages/
│   ├── server/               # Bun + Elysia.js 后端 API（端口 11003）
│   │   ├── src/
│   │   │   ├── index.ts      # 入口（路由注册、CORS、中间件）
│   │   │   ├── routes/       # REST API 路由
│   │   │   ├── services/     # 业务逻辑层
│   │   │   ├── middleware/   # JWT 认证 + 站点识别
│   │   │   └── lib/          # 工具库
│   │   └── prisma/           # Schema + 迁移 + 种子数据
│   ├── web/                  # Next.js 15 前台站点（端口 11001）
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx          # 根布局（meta/GA/skip-link）
│   │       │   ├── robots.ts           # robots.txt
│   │       │   ├── sitemap.ts          # 动态 sitemap.xml
│   │       │   ├── rss.xml/route.ts    # RSS 2.0 feed
│   │       │   ├── (site)/             # 前台路由
│   │       │   └── api/revalidate/     # 缓存刷新 API
│   │       ├── middleware.ts           # 站点识别（Host/域名/cookie）
│   │       └── components/site/        # 前台组件
│   └── admin/                # Vite + React 管理后台（端口 11002）
│       └── src/
│           ├── pages/        # 页面组件
│           └── components/   # UI 组件
└── docs/                     # 项目文档
    ├── README.md
    ├── ARCHITECTURE.md
    ├── API.md
    └── DEVELOPMENT.md
```

---

## 快速开始

### 前置要求

- **Bun** ≥ 1.3.x
- **MySQL** 8.0+（本地运行中，或使用 Docker）

### 方式一：Docker 部署（推荐生产环境）

```bash
# 1. 克隆项目
git clone git@github.com:joeyhu/zqcms.git
cd zqcms

# 2. 复制环境变量
cp .env.production .env
# 编辑 .env 填入 JWT_SECRET 和 SITE_URL

# 3. 启动
docker compose up -d --build

# 4. 初始化数据库（首次）
docker compose exec server bunx prisma db push
docker compose exec server bun run prisma/seed.ts
```

访问：
- 前台站点：`http://localhost:11001`
- 管理后台：`http://admin.localhost:11001`

### 方式二：本地开发

```bash
# 1. 克隆 + 安装
git clone git@github.com:joeyhu/zqcms.git
cd zqcms
bun install

# 2. 初始化数据库
bash scripts/setup-db.sh
bun run db:seed

# 3. 启动
bun run dev
```

| 服务 | 地址 |
|------|------|
| API Server | http://localhost:11003 |
| 前台站点 | http://localhost:11001 |
| 管理后台 | http://localhost:11002 |

默认管理员：`admin@zqcms.com` / `admin123`

---

## 多站点架构

每个子域名自动映射到一个站点数据库记录：

```
site1.example.com  →  Site { domain: "site1.example.com", slug: "site1" }
site2.example.com  →  Site { domain: "site2.example.com", slug: "site2" }
admin.example.com  →  管理后台（独立子域名）
```

**工作原理**：
1. 宿主机 Nginx 透传 `Host` 头到 Docker
2. Web middleware 读取 Host 头，调用 `/api/sites/lookup` 查询站点
3. 所有 API 请求自动附带站点上下文（`?site=slug` 或 `X-Site-Id` header）
4. 数据库查询自动按站点过滤（文章、分类、标签均绑定 `siteId`）

---

## SEO 特性

| 功能 | 说明 |
|------|------|
| **JSON-LD** | 文章页包含 Article + BreadcrumbList 结构化数据 |
| **sitemap.xml** | 动态生成，自动包含当前站点的文章/分类/标签 |
| **RSS 2.0** | `/rss.xml` 输出最新 50 篇文章，支持 RSS 阅读器订阅 |
| **Open Graph** | 所有页面包含 OG 标签（标题、描述、图片、类型） |
| **Twitter Card** | `summary_large_image` 卡片支持 |
| **Canonical URL** | 全局规范链接，避免重复内容 |
| **robots.txt** | 禁止抓取搜索页、API 路径 |
| **Google Analytics** | 从站点配置 `gaId` 自动注入 |

---

## API 概览

### 公开接口（49 个端点）

| 模块 | 端点 | 说明 |
|------|------|------|
| 站点 | `GET /api/site` | 当前站点配置 |
| 站点 | `GET /api/sites/lookup?domain=` | 域名查站点 |
| 站点 | `GET /api/sites` | 站点列表 |
| 文章 | `GET /api/posts` | 文章列表（分页/筛选/搜索） |
| 文章 | `GET /api/posts/by-id/:id` | 文章详情 |
| 文章 | `POST /api/posts` | 创建文章（需认证） |
| 文章 | `PUT /api/posts/by-id/:id` | 更新文章（需认证） |
| 文章 | `DELETE /api/posts/by-id/:id` | 删除文章（需认证） |
| 文章 | `POST /api/posts/batch` | 批量操作（需认证） |
| 分类 | `GET /api/categories` | 分类列表/树 |
| 分类 | `GET /api/categories/:slug` | 分类详情+文章 |
| 标签 | `GET /api/tags` | 标签列表 |
| 媒体 | `POST /api/media/upload` | 上传文件（需认证） |
| 认证 | `POST /api/auth/login` | 登录 |
| 反馈 | `POST /api/feedback` | 提交反馈（公开） |
| LLM | `POST /api/llm/assist` | AI 辅助（需认证） |
| 发布 | `POST /api/publish/submit` | 发布到平台（需认证） |

> 完整 API 文档见 [docs/API.md](docs/API.md)

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `bun run dev` | 启动所有服务（API + Web + Admin） |
| `bun run build` | 构建所有包 |
| `bun run setup` | 首次安装完整流程 |
| `docker compose up -d --build` | Docker 启动 |
| `docker compose logs -f` | 查看 Docker 日志 |
| `bun run db:init` | 初始化数据库 |
| `bun run db:seed` | 导入种子数据 |
| `bun run db:reset` | 清空并重建数据库 |
| `bun run db:studio` | 打开 Prisma Studio |
| `bun test` | 运行全部测试 |

---

## 详细文档

| 文档 | 说明 |
|------|------|
| [架构设计](docs/ARCHITECTURE.md) | 系统架构、多站点数据流、Docker 部署、SSR 渲染流程 |
| [API 参考](docs/API.md) | 完整 49 个 API 接口文档 |
| [开发指南](docs/DEVELOPMENT.md) | 开发规范、环境变量、Docker 开发、生产部署 |
