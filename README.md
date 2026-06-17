# ZQCMS — 数据驱动的内容管理系统

一个**完全数据驱动**的 Headless CMS，所有内容（站点配置、导航、文章、首页布局）均存储在 MySQL 数据库中。一套代码，换一套数据即为全新站点。

---

## 🌟 核心特性

| 特性 | 说明 |
|------|------|
| **数据驱动** | 站点名称、Logo、联系方式、导航、文章、首页布局全部在数据库维护 |
| **SSR + SEO** | Next.js 15 服务端渲染，动态生成 meta、sitemap、Open Graph |
| **多级导航** | Category 树形结构，无限层级嵌套，拖拽排序 |
| **Markdown 内容** | 所有内容使用 Markdown 编写，前后端一体渲染 |
| **可视化首页搭建** | 7 种区块类型（Hero、Features、FAQ、CTA…），拖拽排列 |
| **统一媒体库** | 支持图片/PDF/视频上传管理，可在 Markdown 中引用 |
| **拖拽排序** | 文章、目录、首页区块均支持拖拽排序 |
| **高度可复制** | 同一套代码，换数据库即可部署多个独立站点 |

---

## 🏗️ 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **运行时** | Bun | 1.3+ |
| **后端框架** | Elysia.js | 1.x |
| **ORM** | Prisma | 6.x |
| **数据库** | MySQL | 8.0+ |
| **前台站点** | Next.js (App Router) | 15.x |
| **管理后台** | Vite + React 19 | 6.x |
| **CSS 框架** | Tailwind CSS | 4.x |
| **图标** | lucide-react | 0.475+ |
| **Markdown 渲染** | react-markdown + remark-gfm + rehype-highlight |
| **Markdown 编辑** | @uiw/react-md-editor |
| **拖拽排序** | @dnd-kit |
| **认证** | JWT (jose) |
| **密码哈希** | bcryptjs |
| **测试** | Bun Test (内置) |

---

## 📁 项目结构

```
zqcms/
├── scripts/
│   ├── init.sql            # 数据库初始化 SQL（建表 + 管理员）
│   └── setup-db.sh         # 数据库初始化脚本（交互式）
├── shared/                 # 共享类型和常量
│   ├── types.ts
│   └── constants.ts
├── packages/
│   ├── server/             # Bun + Elysia.js 后端 API（端口 11003）
│   │   ├── src/
│   │   │   ├── routes/     # REST API 路由（posts、categories、settings…）
│   │   │   ├── services/   # 业务逻辑层
│   │   │   └── middleware/ # JWT 认证中间件
│   │   └── prisma/         # Schema + 迁移 + 种子数据
│   ├── web/                # Next.js 15 前台站点（端口 11001）
│   │   └── src/
│   │       ├── app/(site)/ # 前台路由（首页、分类页、文章页）
│   │       └── components/site/ # 组件（Header、Footer、区块渲染器…）
│   └── admin/              # Vite + React 管理后台（端口 11002）
│       └── src/
│           ├── pages/      # 页面（登录、文章管理、首页搭建…）
│           └── components/ # 组件（侧边栏、Markdown编辑器、拖拽列表…）
└── docs/                   # 项目文档
    ├── ARCHITECTURE.md
    ├── API.md
    └── DEVELOPMENT.md
```

---

## 🚀 快速开始

### 前置要求

- **Bun** ≥ 1.3.x（[安装指南](https://bun.sh)）
- **MySQL** 8.0+（本地运行中）
- **Node.js** ≥ 18（Next.js 需要）

### 1. 克隆项目

```bash
git clone <your-repo> zqcms
cd zqcms
```

### 2. 安装依赖

```bash
bun install
```

### 3. 初始化数据库

```bash
# 方式一：交互式（推荐）
bash scripts/setup-db.sh

# 方式二：使用环境变量
export MYSQL_ROOT_PASSWORD=你的密码
bash scripts/setup-db.sh
```

该脚本会自动创建：
- 数据库 `zqcms`
- 用户 `zqcms@localhost`
- 9 张数据表
- 管理员账号 `admin@zqcms.com / admin123`

### 4. 导入种子数据

```bash
bun run db:seed
```

种子数据包含：
- 6 个内容分类（产品文档、API 文档、使用场景、使用说明、FAQ、行业新闻）
- 3 篇示例文章
- 4 个首页区块（Hero + Features + PostList + CategoryList）

### 5. 启动开发

```bash
bun run dev
```

三个服务同时启动：

| 服务 | 地址 | 框架 |
|------|------|------|
| API Server | http://localhost:11003 | Bun + Elysia.js |
| 前台站点 | http://localhost:11001 | Next.js 15 |
| 管理后台 | http://localhost:11002 | Vite + React |

### 6. 登录管理后台

访问 `http://localhost:11002/login`

- 邮箱：`admin@zqcms.com`
- 密码：`admin123`

---

## 📖 数据模型

### 数据库表关系

```
┌─────────────────┐
│  SiteSettings   │  ← 站点全局配置（名称、Logo、联系方式…）
└─────────────────┘
         │
┌─────────────────┐       ┌─────────────┐
│   Category      │←──────│    Post     │
│  (多级导航)     │ 1:N   │  (文章)     │
│  sortOrder      │       │  status     │
│  parentId       │       │  content    │ ← Markdown 源码
└─────────────────┘       └──────┬──────┘
                                 │ N:M
                          ┌──────┴──────┐
                          │  PostTag    │
                          └──────┬──────┘
                                 │
                          ┌──────┴──────┐
                          │    Tag      │  ← 标签
                          └─────────────┘

┌─────────────────┐       ┌─────────────┐
│  PageBlock      │       │    User     │
│  (首页区块)     │       │  (管理员)   │
│  blockType      │       │  role       │
│  config (JSON)  │       └─────────────┘
│  sortOrder      │
└─────────────────┘

┌─────────────────┐
│    Media        │  ← 上传文件
└─────────────────┘
```

### 7 张核心表

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `SiteSettings` | 站点配置 | siteName, logo, contactEmail, primaryColor |
| `Category` | 导航目录 | slug, parentId, sortOrder, isVisible |
| `Post` | 文章 | slug, content (Markdown), status, sortOrder |
| `User` | 管理员 | email, password (bcrypt), role |
| `Tag` | 标签 | name, slug |
| `PostTag` | 文章-标签关联 | postId, tagId |
| `PageBlock` | 首页区块 | blockType, config (JSON), sortOrder |
| `Media` | 媒体文件 | filename, url, mimeType, size |

---

## 🔌 API 概览

### 公开接口（前台使用）

```
GET  /api/posts?page=1&pageSize=20        # 文章列表
GET  /api/posts?featured=true              # 特色文章
GET  /api/posts/:categorySlug/:slug        # 按分类+slug 获取文章
GET  /api/categories                        # 分类列表
GET  /api/categories/tree                   # 分类树（多级嵌套）
GET  /api/categories/:slug?withPosts=true  # 分类详情 + 文章
GET  /api/settings                          # 站点配置
GET  /api/tags                              # 标签列表
GET  /api/page-blocks?pageType=home        # 首页区块
GET  /api/sitemap                           # 动态 sitemap
```

### 认证接口（需 JWT Token）

```
POST /api/auth/login      # 登录获取 token
PUT  /api/settings        # 更新站点配置
POST /api/posts           # 创建文章
PUT  /api/posts/by-id/:id # 更新文章
DELETE /api/posts/by-id/:id # 删除文章
POST /api/posts/reorder   # 文章拖拽排序
POST /api/categories       # 创建分类
PUT  /api/categories/:id  # 更新分类
DELETE /api/categories/:id # 删除分类
POST /api/categories/reorder # 分类拖拽排序
POST /api/page-blocks      # 创建首页区块
PUT  /api/page-blocks/:id  # 更新区块
DELETE /api/page-blocks/:id # 删除区块
POST /api/page-blocks/reorder # 区块拖拽排序
POST /api/media/upload     # 上传文件
DELETE /api/media/:id       # 删除文件
```

---

## 🧪 测试

项目包含 **133 个单元测试**，覆盖全栈核心逻辑。

```bash
bun test                # 运行全部测试（133 个）
bun run test:server     # 仅后端测试（72 个）
bun run test:web        # 仅前台测试（34 个）
bun run test:admin      # 仅后台测试（22 个）
```

测试覆盖范围：

| 包 | 测试内容 |
|----|----------|
| server | JWT 认证、Auth 登录、Post 分页排序、Category 树构建、Settings 验证、Media 处理 |
| web | API Client、PostCard、FAQ Block、Block Registry |
| admin | Token 管理、认证流程、API 请求构建 |

---

## 🛠️ 常用命令

| 命令 | 说明 |
|------|------|
| `bun run dev` | 启动所有服务（API + Web + Admin） |
| `bun run setup` | 首次安装完整流程 |
| `bun run db:init` | 初始化数据库 |
| `bun run db:seed` | 导入种子数据 |
| `bun run db:reset` | 清空并重建数据库 |
| `bun run db:studio` | 打开 Prisma Studio |
| `bun run db:push` | 同步 Prisma Schema 到数据库 |
| `bun run db:generate` | 重新生成 Prisma Client |
| `bun test` | 运行全部测试 |

---

## 📚 详细文档

| 文档 | 说明 |
|------|------|
| [架构设计](docs/ARCHITECTURE.md) | 系统架构、数据流、SSR 渲染流程 |
| [API 参考](docs/API.md) | 完整 API 接口文档 |
| [开发指南](docs/DEVELOPMENT.md) | 开发规范、目录说明、调试技巧 |
