# 开发指南

## 开发环境搭建

### 前置要求

- **Bun** ≥ 1.3.x
- **MySQL** 8.0+（本地运行）
- **Node.js** ≥ 18（Next.js 兼容）

### 首次安装

```bash
# 1. 克隆项目
git clone <repo-url> zqcms
cd zqcms

# 2. 安装依赖
bun install

# 3. 初始化数据库
bash scripts/setup-db.sh

# 4. 导入种子数据
bun run db:seed

# 5. 启动开发
bun run dev
```

---

## 目录结构详解

### `scripts/` — 运维脚本

| 文件 | 说明 |
|------|------|
| `init.sql` | 数据库初始化 SQL（建库、建表、创建用户、插入管理员） |
| `setup-db.sh` | 交互式数据库初始化脚本（支持 `MYSQL_ROOT_PASSWORD` 环境变量） |

### `shared/` — 共享代码

| 文件 | 说明 |
|------|------|
| `types.ts` | 全栈共享 TypeScript 类型（Post、Category、PageBlock…） |
| `constants.ts` | 常量定义（BlockType 标签、API URL、分页默认值） |

### `packages/server/` — 后端

| 目录/文件 | 说明 |
|-----------|------|
| `src/index.ts` | Elysia 入口，注册所有路由和中间件 |
| `src/routes/` | 路由定义（HTTP 方法 + 参数校验） |
| `src/services/` | 业务逻辑（Prisma 查询、事务处理） |
| `src/middleware/` | 中间件（JWT 认证） |
| `src/lib/` | 工具库（Prisma Client 单例、JWT 工具） |
| `prisma/schema.prisma` | 数据库 Schema 定义 |
| `prisma/seed.ts` | 种子数据 |
| `uploads/` | 上传文件存储目录（自动创建） |

### `packages/web/` — 前台

| 目录/文件 | 说明 |
|-----------|------|
| `src/app/layout.tsx` | 根布局（元数据、字体） |
| `src/app/(site)/layout.tsx` | 站点唯一布局（Header + Footer） |
| `src/app/(site)/page.tsx` | 首页（PageBlock 渲染） |
| `src/app/(site)/[...slug]/page.tsx` | 动态路由（分类/文章/嵌套） |
| `src/components/site/` | 站点组件（Header、Footer、PostCard…） |
| `src/components/site/blocks/` | 区块渲染器（HeroBlock、FeaturesBlock…） |
| `src/lib/api-client.ts` | API 请求封装（SSR fetch + ISR revalidate） |

### `packages/admin/` — 管理后台

| 目录/文件 | 说明 |
|-----------|------|
| `src/App.tsx` | React Router 路由配置 |
| `src/pages/` | 页面组件 |
| `src/components/layout/` | AdminLayout（侧边栏导航） |
| `src/components/editor/` | Markdown 编辑器封装 |
| `src/lib/api-client.ts` | API 请求封装（自动附加 JWT） |
| `src/lib/auth.ts` | 认证工具（Token 存储、登录/登出） |

---

## 开发工作流

### 启动开发服务器

```bash
bun run dev
```

同时启动三个服务，支持热更新：
- Server: `bun --watch` 自动重启
- Web: Next.js Fast Refresh
- Admin: Vite HMR

### 数据库变更

当修改 `prisma/schema.prisma` 后：

```bash
# 1. 推送到数据库（开发环境推荐）
bun run db:push

# 2. 或创建迁移文件（生产环境推荐）
cd packages/server && bunx prisma migrate dev --name describe_change

# 3. 重新生成 Prisma Client
bun run db:generate
```

### 添加新 API 路由

1. 在 `src/services/` 中创建或扩展 service
2. 在 `src/routes/` 中创建路由文件
3. 在 `src/index.ts` 中注册路由

```typescript
// src/routes/example.ts
import { Elysia, t } from 'elysia';

export const exampleRoutes = new Elysia({ prefix: '/api/example' })
  .get('/', async () => {
    return { message: 'Hello' };
  });
```

```typescript
// src/index.ts — 注册新路由
import { exampleRoutes } from './routes/example';
app.use(exampleRoutes);
```

### 添加新前台页面

前台使用 `[...slug]` 动态路由，新页面通过数据库配置：

1. **新增分类页**：在后台创建新 Category，自动生成 `/category-slug` 路由
2. **新增文章页**：在分类下创建新 Post，自动生成 `/category-slug/post-slug` 路由
3. **修改首页**：在后台「首页搭建」中添加/编辑区块

### 添加新首页区块类型

1. 在 `shared/types.ts` 的 `BlockType` 枚举中添加新类型
2. 在 `prisma/schema.prisma` 的 `BlockType` 枚举中同步添加
3. 在 `packages/web/src/components/site/blocks/` 中创建区块组件
4. 在 `packages/web/src/components/site/blocks/index.tsx` 的 `PageBlockRenderer` 中添加 case
5. 在 `packages/admin/src/pages/PageBuilderPage.tsx` 中添加编辑表单
6. 在 `shared/constants.ts` 中添加标签

---

## 测试

### 运行测试

```bash
bun test                # 全部 133 个测试
bun test --watch        # 监听模式
bun test -t "JWT"       # 按名称筛选
```

### 测试文件命名

```
__tests__/
├── lib/
│   └── jwt.test.ts         # 工具函数测试
├── services/
│   ├── auth.service.test.ts
│   └── post.service.test.ts
└── routes/
    └── posts.test.ts       # 路由集成测试（预留）
```

### 测试原则

- **纯逻辑测试**：所有测试均为纯函数测试，不依赖数据库连接
- Mock 外部依赖（Prisma、fetch）
- 测试边界条件（空值、无效输入、极端值）

---

## 调试

### 后端调试

```bash
# 查看 API 日志
cd packages/server && bun run dev
# 终端会打印所有请求和错误

# Prisma 查询日志
# 在 src/lib/prisma.ts 中添加:
export const prisma = new PrismaClient({ log: ['query'] });
```

### 前台调试

```bash
cd packages/web && bun run dev
# 访问 http://localhost:11001
# Next.js 在终端和浏览器控制台都会输出错误
```

### 管理后台调试

```bash
cd packages/admin && bun run dev
# 访问 http://localhost:11002
# Vite 提供 Source Map，浏览器 DevTools 可直接调试源码

# 查看 API 请求
# 浏览器 Network 面板查看 /api/* 请求
```

---

## 环境变量

### Server 环境变量 (`packages/server/.env`)

```env
DATABASE_URL=mysql://zqcms:zqcms_pass_2024@localhost:3306/zqcms
JWT_SECRET=your-secret-key-change-in-production
UPLOAD_DIR=./uploads
API_PORT=11003
```

### Web 环境变量 (`packages/web/.env.local`)

```env
API_BASE_URL=http://localhost:11003/api
```

### Admin 代理配置

Admin 使用 Vite 代理，开发时无需额外配置。代理规则在 `vite.config.ts` 中：

```typescript
server: {
  proxy: {
    '/api': { target: 'http://localhost:11003', changeOrigin: true },
    '/uploads': { target: 'http://localhost:11003', changeOrigin: true },
  },
}
```

---

## 生产部署

### 构建

```bash
bun run build
```

### 部署架构

```
Nginx (反向代理)
├── /          → Next.js (next start, 端口 11001)
├── /admin     → Vite SPA 静态文件 (dist/)
└── /api/*     → Bun Server (bun run start, 端口 11003)
    /uploads/* → Bun 静态文件服务
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 管理后台静态文件
    location /admin {
        alias /app/packages/admin/dist;
        try_files $uri /admin/index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:11003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 上传文件
    location /uploads/ {
        proxy_pass http://127.0.0.1:11003;
    }

    # Next.js 前台
    location / {
        proxy_pass http://127.0.0.1:11001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 常见问题

### MySQL 连接失败

```bash
# 确认 MySQL 是否运行
mysqladmin -u root ping

# 启动 MySQL（macOS）
sudo /usr/local/mysql/support-files/mysql.server start
```

### Prisma 迁移冲突

```bash
# 重置数据库（会丢失数据）
bun run db:reset

# 或直接同步 Schema
bun run db:push
```

### Next.js 端口已被占用

修改 `packages/web/package.json` 中的端口号，或直接：

```bash
bun run dev:web    # 使用 package.json 中配置的 11001
```

### Vite 代理不生效

确认 `vite.config.ts` 中 proxy 配置正确，且后端已启动在 11003 端口。

### 种子数据导入失败

种子脚本现在是幂等的（可重复执行），如果报错请检查：
1. 数据库是否已通过 `init.sql` 初始化
2. 管理员用户是否已存在（upsert 会自动处理）
