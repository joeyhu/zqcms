import { Elysia } from 'elysia';
import prisma from '../lib/prisma';

const S = (ctx: unknown) => ctx as Record<string, unknown>;

export const sitemapRoutes = new Elysia({ prefix: '/api' })
  .get('/sitemap', async (ctx) => {
    const site = S(ctx).site as { id: number; domain: string } | null;
    if (!site) return new Response('Site not found', { status: 404 });

    const domain = `http://${site.domain}`;

    const [categories, posts] = await Promise.all([
      prisma.category.findMany({
        where: { siteId: site.id, isVisible: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.post.findMany({
        where: { siteId: site.id, status: 'PUBLISHED' },
        select: { slug: true, category: { select: { slug: true } }, updatedAt: true },
      }),
    ]);

    const urls: string[] = [`<url><loc>${domain}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`];
    for (const cat of categories) urls.push(`<url><loc>${domain}/${cat.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    for (const post of posts) {
      if (post.category) {
        urls.push(`<url><loc>${domain}/${post.category.slug}/${post.slug}</loc><lastmod>${post.updatedAt.toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
  });
