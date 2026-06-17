import prisma from '../lib/prisma';

/** 兼容旧种子数据：socialLinks/config 可能被错误存为 JSON 字符串 */
function normalizeJson(val: unknown): unknown {
  if (!val) return val;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

export interface SiteContext {
  id: number;
  name: string;
  slug: string;
  domain: string;
  description: string | null;
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  socialLinks: unknown;
  footerText: string | null;
  copyright: string | null;
  gaId: string | null;
  isActive: boolean;
}

/**
 * 解析当前站点
 * 优先级:
 *   ① Host 域名匹配（生产 + localhost子域名）
 *   ② ?site={slug} 查询参数（开发便捷切换）
 *   ③ X-Site-Id header（管理后台切换）
 *   ④ 默认站点 isDefault=true（兜底）
 */
export async function resolveSite(params: {
  host?: string;
  siteSlug?: string;
  siteIdHeader?: string;
}): Promise<SiteContext | null> {
  const { host, siteSlug, siteIdHeader } = params;

  // ③ 管理后台 X-Site-Id header（最高优先级，管理员显式指定）
  if (siteIdHeader) {
    const siteId = parseInt(siteIdHeader, 10);
    if (!isNaN(siteId)) {
      const site = await prisma.site.findUnique({ where: { id: siteId } });
      if (site && site.isActive) return { ...site, socialLinks: normalizeJson(site.socialLinks) };
    }
  }

  // ① Host 域名匹配
  if (host) {
    const cleanHost = host.split(':')[0]; // 去掉端口号
    const site = await prisma.site.findUnique({ where: { domain: cleanHost } });
    if (site && site.isActive) return { ...site, socialLinks: normalizeJson(site.socialLinks) };
  }

  // ② ?site={slug} 查询参数
  if (siteSlug) {
    const site = await prisma.site.findUnique({ where: { slug: siteSlug } });
    if (site && site.isActive) return { ...site, socialLinks: normalizeJson(site.socialLinks) };
  }

  // ④ 默认站点兜底
  const defaultSite = await prisma.site.findFirst({ where: { isDefault: true } });
  if (defaultSite) return { ...defaultSite, socialLinks: normalizeJson(defaultSite.socialLinks) };

  return null;
}

/**
 * 读取请求中的站点识别信息
 */
export function extractSiteParams(url: string, headers: Record<string, string | undefined>): {
  host?: string;
  siteSlug?: string;
  siteIdHeader?: string;
} {
  const host = headers['x-forwarded-host'] || headers['host'] || undefined;
  const siteSlug = new URL(url).searchParams.get('site') || undefined;
  const siteIdHeader = headers['x-site-id'] || undefined;

  return { host, siteSlug, siteIdHeader };
}
