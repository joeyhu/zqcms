import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { verifyToken } from './lib/jwt';
import { resolveSite, extractSiteParams } from './middleware/site';
import { authRoutes } from './routes/auth';
import { postRoutes } from './routes/posts';
import { categoryRoutes } from './routes/categories';
import { settingsRoutes } from './routes/sites';
import { mediaRoutes } from './routes/media';
import { pageBlockRoutes } from './routes/page-blocks';
import { tagRoutes } from './routes/tags';
import { sitemapRoutes } from './routes/sitemap';
import { siteManageRoutes } from './routes/sites-manage';
import { cardTemplateRoutes } from './routes/card-templates';
import { blockTemplateRoutes } from './routes/block-templates';
import type { SiteContext } from './middleware/site';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

function logError(source: string, err: unknown) {
  const ts = new Date().toISOString().slice(11, 19);
  if (err instanceof Error) {
    console.error(`[${ts}] ❌ ${source}`);
    console.error(`   Message : ${err.message}`);
    if (err.stack) {
      const lines = err.stack.split('\n');
      for (let i = 1; i < Math.min(lines.length, 5); i++) {
        console.error(`   Stack   : ${lines[i].trim()}`);
      }
    }
  } else {
    console.error(`[${ts}] ❌ ${source}  Raw:`, err);
  }
}

process.on('uncaughtException', (err) => logError('uncaughtException', err));
process.on('unhandledRejection', (reason) => logError('unhandledRejection', reason));

const app = new Elysia()
  // ---- CORS ----
  .use(cors({
    origin: ['http://localhost:11001', 'http://localhost:11002'],
    credentials: true,
  }))

  // ---- 请求日志 ----
  .onRequest(({ request }) => {
    const url = new URL(request.url).pathname;
    if (!url.startsWith('/uploads/')) {
      const ts = new Date().toISOString().slice(11, 19);
      console.log(`[${ts}] ← ${request.method} ${url}`);
    }
  })

  // ---- ★ JWT 认证上下文 ----
  .derive(async ({ headers }) => {
    try {
      const authHeader = headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { user: null };
      }
      const token = authHeader.slice(7);
      const payload = await verifyToken(token);
      return { user: payload };
    } catch {
      return { user: null };
    }
  })

  // ---- ★ 站点识别上下文（注入 site + siteId） ----
  .derive(async ({ request, headers }) => {
    try {
      const url = request.url;
      const { host, siteSlug, siteIdHeader } = extractSiteParams(url, headers as Record<string, string | undefined>);
      const site = await resolveSite({ host, siteSlug, siteIdHeader });
      if (!site) {
        console.error('[siteMiddleware] No site found for request:', url);
      }
      return {
        site: site as SiteContext | null,
        siteId: site?.id ?? 0,
      };
    } catch (err) {
      logError('siteMiddleware', err);
      return { site: null, siteId: 0 };
    }
  })

  // ---- 响应日志 ----
  .onAfterResponse(({ request, response }) => {
    const url = new URL(request.url).pathname;
    if (url.startsWith('/uploads/')) return;
    const resp = response as Response;
    const status = resp?.status || 200;
    const symbol = status >= 400 ? '❌' : '→';
    const ts = new Date().toISOString().slice(11, 19);
    console.log(`[${ts}] ${symbol} ${status} ${request.method} ${url}`);
  })

  // ---- 静态文件 ----
  .get('/uploads/*', ({ params }) => {
    const filepath = join(UPLOAD_DIR, params['*']);
    if (!existsSync(filepath)) return new Response('Not Found', { status: 404 });
    const file = readFileSync(filepath);
    const ext = filepath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
      pdf: 'application/pdf', mp4: 'video/mp4',
    };
    return new Response(file, {
      headers: { 'Content-Type': mimeTypes[ext || ''] || 'application/octet-stream' },
    });
  })

  // ---- 路由 ----
  .use(authRoutes)
  .use(siteManageRoutes)
  .use(postRoutes)
  .use(categoryRoutes)
  .use(settingsRoutes)
  .use(mediaRoutes)
  .use(pageBlockRoutes)
  .use(cardTemplateRoutes)
  .use(blockTemplateRoutes)
  .use(tagRoutes)
  .use(sitemapRoutes)

  // ---- 全局错误处理 ----
  .onError(({ code, error }) => {
    const err = error as Error;
    const message = err?.message || String(error);
    logError(`onError code=${code}`, error);

    let status = 500;
    if (code === 'NOT_FOUND') status = 404;
    else if (code === 'VALIDATION') {
      status = 422;
      const ve = error as { summary?: string; message?: string };
      return new Response(JSON.stringify({ success: false, error: ve.summary || ve.message || 'Validation error' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } });
    } else if (code === 'PARSE') status = 400;
    else if (message.includes('Unauthorized')) status = 401;
    else if (message.includes('not found')) status = 404;
    else if (message.includes('P2002')) status = 409;

    return new Response(JSON.stringify({ success: false, error: message || 'Internal server error' }),
      { status, headers: { 'Content-Type': 'application/json' } });
  })

  .listen(process.env.API_PORT || 11003);

console.log(`\n🚀 ZQCMS API Server running at http://localhost:${app.server?.port}\n`);
