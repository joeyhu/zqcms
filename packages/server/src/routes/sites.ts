import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma';
import { authBeforeHandle } from '../middleware/auth';

const S = (ctx: unknown) => ctx as Record<string, unknown>;

export const settingsRoutes = new Elysia({ prefix: '/api' })
  .get('/site', async (ctx) => {
    const site = S(ctx).site as Record<string, unknown> | null;
    if (!site) throw new Error('Site not found');
    // 映射 Prisma name → 前端期望的 siteName
    return { ...site, siteName: site['name'] || site['siteName'] || '', siteDescription: site['description'] || site['siteDescription'] || '' };
  })
  .put('/site', async (ctx) => {
    const user = S(ctx).user;
    if (!user) throw new Error('Unauthorized');
    const id = S(ctx).siteId as number;
    if (!id) throw new Error('Site not found');
    return prisma.site.update({ where: { id }, data: S(ctx).body as never });
  }, {
    body: t.Object({
      name: t.Optional(t.String()), slug: t.Optional(t.String()), domain: t.Optional(t.String()),
      description: t.Optional(t.Nullable(t.String())),
      logo: t.Optional(t.Nullable(t.String())), favicon: t.Optional(t.Nullable(t.String())),
      primaryColor: t.Optional(t.String()),
      contactEmail: t.Optional(t.Nullable(t.String())), contactPhone: t.Optional(t.Nullable(t.String())),
      address: t.Optional(t.Nullable(t.String())),
      socialLinks: t.Optional(t.Nullable(t.Record(t.String(), t.String()))),
      footerText: t.Optional(t.Nullable(t.String())), copyright: t.Optional(t.Nullable(t.String())),
      gaId: t.Optional(t.Nullable(t.String())),
    }),
    beforeHandle: [authBeforeHandle],
  });
