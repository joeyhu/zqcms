import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface SiteInfo {
  id: number;
  slug: string;
  domain: string;
}

// 内存缓存：域名 → site slug（避免每次请求都调 API）
const domainCache = new Map<string, { slug: string; expireAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

/**
 * 通过域名查找站点 slug
 * 优先用内存缓存，未命中时调用 API
 */
async function resolveSiteByDomain(
  host: string,
): Promise<SiteInfo | null> {
  const cleanHost = host.split(':')[0]; // 去端口
  const cached = domainCache.get(cleanHost);
  if (cached && cached.expireAt > Date.now()) {
    return { id: 0, slug: cached.slug, domain: cleanHost };
  }

  try {
    const apiBase =
      process.env.API_BASE_URL || 'http://localhost:11003/api';
    const res = await fetch(`${apiBase}/sites/lookup?domain=${encodeURIComponent(cleanHost)}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const site: SiteInfo = await res.json();
      if (site?.slug) {
        domainCache.set(cleanHost, {
          slug: site.slug,
          expireAt: Date.now() + CACHE_TTL,
        });
        return site;
      }
    }
  } catch {
    // API 不可用时忽略
  }

  return null;
}

/**
 * Next.js Middleware — 站点切换与持久化
 *
 * 优先级：
 *   1. URL 中 ?site=slug 参数（即时切换，同时写入 cookie 持久化）
 *   2. Cookie 中 zqcms_site（从上次选择恢复）
 *   3. Host 域名匹配（生产环境多子域名）
 *   4. 无则使用默认站点（API 兜底）
 *
 * /uploads/* 路径不经过此 middleware，由 nginx / next.config rewrites 代理到后端
 */
export async function middleware(request: NextRequest) {
  const urlSiteSlug = request.nextUrl.searchParams.get('site');
  const cookieSiteSlug = request.cookies.get('zqcms_site')?.value;

  let siteSlug = urlSiteSlug || cookieSiteSlug || '';

  // ── 3. 从 Host 域名匹配 ──
  if (!siteSlug) {
    const host = request.headers.get('host') || '';
    // 跳过 localhost（开发环境）
    const cleanHost = host.split(':')[0];
    if (cleanHost && cleanHost !== 'localhost' && cleanHost !== '127.0.0.1') {
      const site = await resolveSiteByDomain(host);
      if (site?.slug) {
        siteSlug = site.slug;
      }
    }
  }

  const response = NextResponse.next();

  if (siteSlug) {
    response.headers.set('x-zqcms-site', siteSlug);
    if (urlSiteSlug) {
      response.cookies.set('zqcms_site', urlSiteSlug, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    }
  }

  return response;
}

export const config = {
  // 排除 /uploads/ 路径（由 nginx 代理），避免 middleware 干扰
  matcher: ['/((?!_next|api|favicon.ico|uploads).*)'],
};
