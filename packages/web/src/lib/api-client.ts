// API client for server-side fetching from Bun API
// Includes site context via host header + query param for multi-site support
import { headers as nextHeaders } from 'next/headers';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:11003/api';

interface FetchOptions extends RequestInit {
  revalidate?: number;
}

/**
 * Build a properly encoded API URL from endpoint + query params.
 * Encodes path segments and query values to handle Chinese characters etc.
 */
function buildApiUrl(endpoint: string, extraParams?: Record<string, string>): string {
  // Split endpoint into path and query string
  const [rawPath, rawQuery] = endpoint.split('?');

  // Encode each path segment individually (preserve slashes)
  const encodedPath = rawPath
    .split('/')
    .map(seg => encodeURIComponent(seg))
    .join('/');

  let url = `${API_BASE}${encodedPath}`;

  // Collect query params
  const params = new URLSearchParams();
  if (rawQuery) {
    const existing = new URLSearchParams(rawQuery);
    existing.forEach((v, k) => params.set(k, v));
  }
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      params.set(k, v);
    }
  }

  const qs = params.toString();
  if (qs) url += '?' + qs;

  return url;
}

export async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { revalidate = 5, ...fetchOpts } = options;

  // Read host from Next.js headers (SSR only)
  let host = '';
  let siteSlug = '';
  try {
    const headersList = await nextHeaders();
    host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
    siteSlug = headersList.get('x-zqcms-site') || '';
  } catch {
    host = typeof window !== 'undefined' ? window.location.host : 'localhost';
  }

  const extraParams: Record<string, string> = {};
  if (siteSlug) {
    extraParams.site = siteSlug;
  }

  const apiUrl = buildApiUrl(endpoint, extraParams);

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
