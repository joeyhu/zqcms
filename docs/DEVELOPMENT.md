# 开发指南

## 开发环境

### 前置要求

- **Bun** ≥ 1.3.x
- **MySQL** 8.0+（本地，或通过 Docker `docker compose up mysql`）
- **Node.js** ≥ 18（Next.js 兼容）

### 首次安装

```bash
git clone git@github.com:joeyhu/zqcms.git
cd zqcms
bun install
bash scripts/setup-db.sh
bun run db:seed
bun run dev
```

---

## 目录结构

### `packages/server/` — 后端 API

| 目录/文件 | 说明 |
|-----------|------|
| `src/index.ts` | Elysia 入口（CORS、中间件、路由注册） |
| `src/routes/` | 路由定义（HTTP 方法 + 参数校验） |
| `src/services/` | 业务逻辑（Prisma 查询、事务处理） |
| `src/middleware/` | 中间件（JWT 认证 + 站点识别） |
| `src/lib/` | 工具库（Prisma 单例、JWT、缓存刷新） |
| `prisma/schema.prisma` | 数据库 Schema（Site、Post、Category…） |
| `prisma/seed.ts` | 种子数据（管理员 + 示例文章） |

### `packages/web/` — 前台站点

| 目录/文件 | 说明 |
|-----------|------|
| `src/app/layout.tsx` | 根布局（meta、GA、skip-link） |
| `src/app/robots.ts` | robots.txt 生成 |
| `src/app/sitemap.ts` | 动态 sitemap.xml（按站点） |
| `src/app/rss.xml/route.ts` | RSS 2.0 Feed |
| `src/app/(site)/layout.tsx` | 站点布局（Header + Breadcrumb + Footer） |
| `src/app/(site)/page.tsx` | 首页 |
| `src/app/(site)/[...slug]/page.tsx` | 统一路由（文章/分类） |
| `src/app/(site)/search/page.tsx` | 搜索页 |
| `src/app/(site)/tag/` | 标签页 |
| `src/middleware.ts` | 站点识别（Host 域名 → site slug） |
| `src/components/site/` | 前台组件 |
| `src/lib/api-client.ts` | API 请求封装（SSR + ISR + 站点上下文） |
| `next.config.ts` | Next.js 配置（standalone 输出 + 安全头） |

### `packages/admin/` — 管理后台

| 目录/文件 | 说明 |
|-----------|------|
| `src/App.tsx` | 路由配置 |
| `src/pages/` | 页面组件 |
| `src/components/layout/AdminLayout.tsx` | 管理布局（侧边栏 + 站点切换） |
| `src/lib/api-client.ts` | API 请求封装（自动 JWT + X-Site-Id） |
| `vite.config.ts` | Vite 配置（代理 + 端口） |

---

## Docker 开发与部署

### 本地 Docker 开发

```bash
# 启动全部服务
docker compose up -d --build

# 仅启动数据库（其他用本地 dev）
docker compose up -d mysql

# 查看日志
docker compose logs -f server
docker compose logs -f web

# 重建单个服务
docker compose up -d --build server

# 进入容器调试
docker compose exec server sh
```

### 生产部署

```bash
# 1. 配置环境变量
cp .env.production .env
# 编辑 .env:
#   JWT_SECRET=随机字符串
#   SITE_URL=https://你的域名

# 2. 构建 + 启动
docker compose up -d --build

# 3. 首次初始化数据库
docker compose exec server bunx prisma db push
docker compose exec server bun run prisma/seed.ts
```

### 宿主机 Nginx 配置示例

```nginx
upstream zqcms {
    server 127.0.0.1:11001;
}

# 站点子域名
server {
    listen 443 ssl;
    server_name site1.example.com;

    location / {
        proxy_pass http://zqcms;
        proxy_set_header Host site1.example.com;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 管理后台子域名
server {
    listen 443 ssl;
    server_name admin.example.com;

    location / {
        proxy_pass http://zqcms;
        proxy_set_header Host admin.example.com;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 环境变量

### Server (`packages/server/.env`)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | `mysql://zqcms:pass@localhost:3306/zqcms` | 数据库连接 |
| `JWT_SECRET` | — | JWT 签名密钥（生产必改） |
| `API_PORT` | `11003` | API 端口 |
| `UPLOAD_DIR` | `./uploads` | 上传文件目录 |
| `CORS_ORIGIN` | — | 逗号分隔的允许 Origin（Docker 中用 `*` 或留空） |

### Web (`packages/web/.env.local`)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `API_BASE_URL` | `http://localhost:11003/api` | 后端 API 地址 |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:11001` | 站点公开 URL |
| `NEXT_PUBLIC_API_URL` | `http://localhost:11003/api` | 客户端 API 地址 |
| `REVALIDATE_TOKEN` | — | 缓存刷新鉴权 Token |

### Docker Compose (`.env`)

| 变量 | 说明 |
|------|------|
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 |
| `MYSQL_PASSWORD` | MySQL 用户密码 |
| `JWT_SECRET` | JWT 签名密钥 |
| `SITE_URL` | 站点公开 URL（用于 sitemap/canonical/OG） |

---

## 数据库变更

修改 `prisma/schema.prisma` 后：

```bash
# 开发环境（快速同步，不创建迁移文件）
bun run db:push

# 生产环境（创建迁移文件）
cd packages/server && bunx prisma migrate dev --name describe_change

# 重新生成 Prisma Client
bun run db:generate
```

---

## 添加新 API 路由

```typescript
// src/routes/example.ts
import { Elysia, t } from 'elysia';

export const exampleRoutes = new Elysia({ prefix: '/api/example' })
  .get('/', async () => ({ message: 'Hello' }))
  .post('/', async ({ body }) => {
    return { created: body };
  }, {
    body: t.Object({ name: t.String() }),
    beforeHandle: [authBeforeHandle],  // 需要认证时添加
  });
```

```typescript
// src/index.ts — 注册
import { exampleRoutes } from './routes/example';
app.use(exampleRoutes);
```

---

## 多站点开发

### 添加新站点

1. 管理后台 → 站点管理 → 新建站点
2. 填入：名称、slug（内部标识）、domain（子域名）
3. 宿主机 Nginx 添加该域名的 server block
4. 访问 `http://新域名:11001` 即可看到独立站点

### 本地开发多站点测试

由于本地只有一个 `localhost`，使用 `?site=` 参数切换：
- `http://localhost:11001/?site=site1` → 站点 1
- `http://localhost:11001/?site=site2` → 站点 2

参数会被写入 cookie 持久化。

---

## SEO 开发

### 添加 JSON-LD 结构化数据

在文章页 Server Component 中输出：
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

### 测试 Sitemap / RSS

```bash
# 本地访问
curl http://localhost:11001/sitemap.xml
curl http://localhost:11001/rss.xml

# 生产环境
curl https://your-domain.com/sitemap.xml
```

---

## 测试

```bash
bun test                  # 全部测试
bun test --watch          # 监听模式
bun test -t "JWT"         # 按名称筛选
bun run test:server       # 仅后端
bun run test:web          # 仅前台
bun run test:admin        # 仅后台
```

测试原则：
- 纯逻辑测试，不依赖数据库连接
- Mock 外部依赖（Prisma、fetch）
- 测试边界条件（空值、无效输入、极端值）

---

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `bun run dev` | 启动所有服务（API + Web + Admin） |
| `bun run build` | 生产构建 |
| `bun run setup` | 首次安装完整流程 |
| `docker compose up -d --build` | Docker 构建启动 |
| `docker compose down` | 停止 Docker 服务 |
| `docker compose exec server sh` | 进入 server 容器 |
| `bun run db:push` | 同步 Schema 到数据库 |
| `bun run db:seed` | 导入种子数据 |
| `bun run db:reset` | 清空重建数据库 |
| `bun run db:studio` | Prisma Studio（可视化数据库） |
| `bun test` | 运行全部测试 |
