import { Elysia, t } from 'elysia';
import prisma from '../lib/prisma';
import type { SiteContext } from '../middleware/site';

/**
 * 站点 CRUD 管理（仅管理员可用）
 */
export const siteManageRoutes = new Elysia({ prefix: '/api/sites' })
  // 列表
  .get('/', async () => {
    return prisma.site.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { posts: true, categories: true } } },
    });
  })

  // 详情
  .get('/:id', async ({ params }) => {
    const site = await prisma.site.findUnique({
      where: { id: Number(params.id) },
      include: { _count: { select: { posts: true, categories: true } } },
    });
    if (!site) throw new Error('Site not found');
    return site;
  })

  // 创建
  .post('/', async ({ body }) => {
    return prisma.site.create({ data: body as never });
  }, {
    body: t.Object({
      name: t.String(),
      slug: t.String(),
      domain: t.String(),
      description: t.Optional(t.Nullable(t.String())),
      logo: t.Optional(t.Nullable(t.String())),
      favicon: t.Optional(t.Nullable(t.String())),
      primaryColor: t.Optional(t.String()),
      contactEmail: t.Optional(t.Nullable(t.String())),
      contactPhone: t.Optional(t.Nullable(t.String())),
      address: t.Optional(t.Nullable(t.String())),
      socialLinks: t.Optional(t.Nullable(t.Record(t.String(), t.String()))),
      footerText: t.Optional(t.Nullable(t.String())),
      copyright: t.Optional(t.Nullable(t.String())),
      gaId: t.Optional(t.Nullable(t.String())),
      isActive: t.Optional(t.Boolean()),
    }),
  })

  // 更新
  .put('/:id', async ({ params, body }) => {
    return prisma.site.update({
      where: { id: Number(params.id) },
      data: body as never,
    });
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      slug: t.Optional(t.String()),
      domain: t.Optional(t.String()),
      description: t.Optional(t.Nullable(t.String())),
      logo: t.Optional(t.Nullable(t.String())),
      favicon: t.Optional(t.Nullable(t.String())),
      primaryColor: t.Optional(t.String()),
      contactEmail: t.Optional(t.Nullable(t.String())),
      contactPhone: t.Optional(t.Nullable(t.String())),
      address: t.Optional(t.Nullable(t.String())),
      socialLinks: t.Optional(t.Nullable(t.Record(t.String(), t.String()))),
      footerText: t.Optional(t.Nullable(t.String())),
      copyright: t.Optional(t.Nullable(t.String())),
      gaId: t.Optional(t.Nullable(t.String())),
      isActive: t.Optional(t.Boolean()),
    }),
  })

  // 删除
  .delete('/:id', async ({ params }) => {
    return prisma.site.delete({ where: { id: Number(params.id) } });
  });
