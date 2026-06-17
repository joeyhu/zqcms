// API client for server-side fetching from Bun API
// Includes site context via host header + query param for multi-site support
import { headers as nextHeaders } from 'next/headers';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:11003/api';

interface FetchOptions extends RequestInit {
  revalidate?: number;
}

export async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { revalidate = 5, ...fetchOpts } = options;
  let apiUrl = `${API_BASE}${endpoint}`;

  // Read host from Next.js headers (SSR only)
  let host = '';
  let siteSlug = '';
  try {
    const headersList = await nextHeaders();
    host = headersList.get('host') || headersList.get('x-forwarded-host') || '';

    // ★ 从 middleware 注入的 x-zqcms-site header 读取站点 slug
    //   开发模式通过 ?site=slug 切换站点，middleware 会将其写入此 header
    siteSlug = headersList.get('x-zqcms-site') || '';
  } catch {
    host = typeof window !== 'undefined' ? window.location.host : 'localhost';
  }

  // ★ 附加 site 参数到 API URL（服务器中间件支持的 ?site= 参数）
  if (siteSlug) {
    const separator = endpoint.includes('?') ? '&' : '?';
    apiUrl = `${API_BASE}${endpoint}${separator}site=${encodeURIComponent(siteSlug)}`;
  }

  const res = await fetch(apiUrl, {
    ...fetchOpts,
    headers: {
      'Content-Type': 'application/json',
      ...(host ? { 'X-Forwarded-Host': host } : {}),
      ...fetchOpts.headers,
    },
    next: { revalidate },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error (${res.status}): ${errorBody}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res as unknown as T;
}

// Shared types for web
export interface PageBlock {
  id: number;
  pageType: string;
  blockType: string;
  title: string | null;
  config: Record<string, unknown>;
  sortOrder: number;
  isVisible: boolean;
}

export interface SiteContext {
  id: number;
  name: string;
  slug: string;
  domain: string;
  description: string | null;
  primaryColor: string;
  logo: string | null;
  favicon: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  socialLinks: unknown;
  footerText: string | null;
  copyright: string | null;
  gaId: string | null;
}
