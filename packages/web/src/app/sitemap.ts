import type { MetadataRoute } from 'next';

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

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
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

  try {
    // All published posts
    const postsResult = await fetchAPI<{ data: Post[] }>(
      '/posts?status=PUBLISHED&pageSize=500',
    );

    for (const post of postsResult.data || []) {
      const url = post.category?.slug
        ? `${siteUrl}/${post.category.slug}/${post.id}`
        : `${siteUrl}/${post.id}`;

      entries.push({
        url,
        lastModified: new Date(post.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      });
    }
  } catch {
    // ignore API errors
  }

  try {
    // All visible categories
    const categories = await fetchAPI<Category[]>('/categories?all=true');
    for (const cat of categories) {
      entries.push({
        url: `${siteUrl}/${cat.slug}`,
        lastModified: new Date(cat.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      });
    }
  } catch {
    // ignore
  }

  try {
    // All tags
    const tags = await fetchAPI<Tag[]>('/tags');
    for (const tag of tags) {
      entries.push({
        url: `${siteUrl}/tag/${tag.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      });
    }
  } catch {
    // ignore
  }

  return entries;
}
