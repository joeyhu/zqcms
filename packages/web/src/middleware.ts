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
 * 将站点 slug 注入 x-zqcms-site 自定义 header，供 fetchAPI 读取。
 */
export function middleware(request: NextRequest) {
  // ① URL 参数优先
  const urlSiteSlug = request.nextUrl.searchParams.get('site');
  // ② Cookie 兜底
  const cookieSiteSlug = request.cookies.get('zqcms_site')?.value;

  const siteSlug = urlSiteSlug || cookieSiteSlug || '';
  const response = NextResponse.next();

  if (siteSlug) {
    // 注入自定义 header，fetchAPI 从此读取
    response.headers.set('x-zqcms-site', siteSlug);

    // URL 参数触发的切换 → 持久化到 cookie（覆盖旧值）
    if (urlSiteSlug) {
      response.cookies.set('zqcms_site', urlSiteSlug, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 年
        sameSite: 'lax',
      });
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
