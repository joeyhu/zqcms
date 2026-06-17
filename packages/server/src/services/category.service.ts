import prisma from '../lib/prisma';

export const categoryService = {
  async list(siteId: number, includeHidden = false) {
    return prisma.category.findMany({
      where: { siteId, ...(includeHidden ? {} : { isVisible: true }) },
      include: { _count: { select: { posts: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  },

  async tree(siteId: number, includeHidden = false) {
    return prisma.category.findMany({
      where: { siteId, parentId: null, ...(includeHidden ? {} : { isVisible: true }) },
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
          include: { _count: { select: { posts: true } } },
        },
        _count: { select: { posts: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async getBySlug(siteId: number, slug: string) {
    return prisma.category.findUnique({
      where: { siteId_slug: { siteId, slug } },
      include: {
        children: { orderBy: { sortOrder: 'asc' }, include: { _count: { select: { posts: true } } } },
        _count: { select: { posts: true } },
      },
    });
  },

  async getById(id: number) {
    return prisma.category.findUnique({
      where: { id },
      include: { children: true, _count: { select: { posts: true } } },
    });
  },

  async getWithPosts(siteId: number, slug: string) {
    return prisma.category.findUnique({
      where: { siteId_slug: { siteId, slug } },
      include: {
        children: { orderBy: { sortOrder: 'asc' } },
        posts: {
          where: { status: 'PUBLISHED' as never },
          include: { tags: { include: { tag: true } } },
          orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
        },
      },
    });
  },

  async create(data: { siteId: number; name: string; slug: string; description?: string | null; icon?: string | null; sortOrder?: number; isVisible?: boolean; parentId?: number | null }) {
    return prisma.category.create({ data });
  },

  async update(id: number, data: Record<string, unknown>) {
    return prisma.category.update({ where: { id }, data: data as never });
  },

  async delete(id: number) {
    const category = await prisma.category.findUnique({ where: { id }, include: { children: true } });
    if (category && category.children.length > 0) {
      await prisma.category.updateMany({ where: { parentId: id }, data: { parentId: category.parentId } });
    }
    return prisma.category.delete({ where: { id } });
  },

  async reorder(items: { id: number; sortOrder: number }[]) {
    const ops = items.map((item) =>
      prisma.category.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
    );
    await prisma.$transaction(ops);
  },
};
