import { headers } from 'next/headers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:11001';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:11003/api';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  publishedAt: string | null;
  updatedAt: string;
  category?: { slug: string; name: string } | null;
  author?: { name: string | null; email: string } | null;
}

interface SiteInfo {
  siteName: string;
  siteDescription: string | null;
}

/** XML 实体转义 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 生成 RFC 2822 格式日期 */
function toRfc2822(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

/** 截取文章摘要（去除 Markdown 标记） */
function makeDescription(post: Post): string {
  const text = post.excerpt || post.content || '';
  // 简单去除 Markdown 标记
  const plain = text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/>\s/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();

  return plain.length > 300 ? plain.slice(0, 297) + '...' : plain;
}

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
    next: { revalidate: 1800 }, // 30 min cache
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function buildPostUrl(post: Post): string {
  return post.category?.slug
    ? `${siteUrl}/${post.category.slug}/${post.id}`
    : `${siteUrl}/${post.id}`;
}

export async function GET() {
  try {
    // Parallel fetch: site info + posts
    const [site, postsResult] = await Promise.all([
      fetchWithSite<SiteInfo>('/site').catch(() => ({
        siteName: 'ZQCMS',
        siteDescription: '内容管理系统',
      })),
      fetchWithSite<{ data: Post[] }>(
        '/posts?status=PUBLISHED&pageSize=50&orderBy=publishedAt&orderDir=desc',
      ).catch(() => ({ data: [] })),
    ]);

    const posts = postsResult.data || [];
    const title = escapeXml(site.siteName || 'ZQCMS');
    const description = escapeXml(
      site.siteDescription || `${site.siteName} 最新文章`,
    );

    const now = toRfc2822(new Date().toISOString());
    const lastBuildDate =
      posts.length > 0
        ? toRfc2822(posts[0].publishedAt || posts[0].updatedAt)
        : now;

    const items = posts
      .map((post) => {
        const url = buildPostUrl(post);
        const postTitle = escapeXml(post.title);
        const postDesc = escapeXml(makeDescription(post));
        const pubDate = toRfc2822(post.publishedAt || post.updatedAt);
        const author = post.author?.name || post.author?.email || '';
        const category = post.category?.name
          ? `\n      <category>${escapeXml(post.category.name)}</category>`
          : '';

        return `    <item>
      <title>${postTitle}</title>
      <link>${escapeXml(url)}</link>
      <description>${postDesc}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(url)}</guid>${category}
      ${author ? `<author>${escapeXml(author)}</author>` : ''}
    </item>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${title}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${description}</description>
    <language>zh-CN</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(siteUrl)}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
      },
    });
  } catch {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>Failed to generate feed</description></channel></rss>`,
      {
        status: 500,
        headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
      },
    );
  }
}
