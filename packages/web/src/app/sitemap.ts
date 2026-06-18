import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:11001';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:11003/api';

interface Post {
  id: number;
  slug: string;
  updatedAt: string;
  category?: { slug: string } | null;
}

interface Category {
  id: number;
  slug: string;
  updatedAt: string;
}

interface Tag {
  id: number;
  slug: string;
}

/**
 * 带站点上下文的 API 请求
 * 从 middleware 注入的 x-zqcms-site header 读取当前站点
 */
async function fetchWithSite<T>(endpoint: string): Promise<T> {
  const headersList = await headers();
  const siteSlug = headersList.get('x-zqcms-site') || '';
  const host = headersList.get('host') || '';

  const url = new URL(`${API_BASE}${endpoint}`);
  if (siteSlug) url.searchParams.set('site', siteSlug);

  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-Host': host,
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({
    url: siteUrl,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  });

  // Tag index page
  entries.push({
    url: `${siteUrl}/tag`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  });

  // ── Published posts ──
  try {
    const postsResult = await fetchWithSite<{ data: Post[] }>(
      '/posts?status=PUBLISHED&pageSize=500',
    );

    for (const post of postsResult.data || []) {
      const url = post.category?.slug
        ? `${siteUrl}/${post.category.slug}/${post.id}`
        : `${siteUrl}/${post.id}`;

      entries.push({
        url,
        lastModified: new Date(post.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  } catch {
    // ignore — site may have no posts yet
  }

  // ── Categories ──
  try {
    const categories = await fetchWithSite<Category[]>('/categories?all=true');
    for (const cat of categories) {
      entries.push({
        url: `${siteUrl}/${cat.slug}`,
        lastModified: new Date(cat.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    // ignore
  }

  // ── Tags ──
  try {
    const tags = await fetchWithSite<Tag[]>('/tags');
    for (const tag of tags) {
      entries.push({
        url: `${siteUrl}/tag/${tag.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  } catch {
    // ignore
  }

  return entries;
}
