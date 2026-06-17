import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware — 站点切换与持久化
 *
 * 优先级：
 *   1. URL 中 ?site=slug 参数（即时切换，同时写入 cookie 持久化）
 *   2. Cookie 中 zqcms_site（从上次选择恢复）
 *   3. 无则使用默认站点
 *
 * /uploads/* 路径不经过此 middleware，由 next.config.ts rewrites 直接代理到后端
 */
export function middleware(request: NextRequest) {
  const urlSiteSlug = request.nextUrl.searchParams.get('site');
  const cookieSiteSlug = request.cookies.get('zqcms_site')?.value;
  const siteSlug = urlSiteSlug || cookieSiteSlug || '';
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
  // 排除 /uploads/ 路径（由 rewrites 代理），避免 middleware 干扰
  matcher: ['/((?!_next|api|favicon.ico|uploads).*)'],
};
