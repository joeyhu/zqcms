import prisma from '../lib/prisma';

export const postService = {
  async list(params: {
    siteId?: number;
    categorySlug?: string;
    status?: string;
    featured?: boolean;
    search?: string;
    tagId?: number;
    tagSlug?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { siteId, categorySlug, status, featured, search, tagId, tagSlug, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (siteId) where.siteId = siteId;
    if (status) where.status = status;
    if (featured !== undefined) where.isFeatured = featured;
    if (categorySlug) {
      const category = await prisma.category.findFirst({ where: { slug: categorySlug, siteId } });
      if (category) where.categoryId = category.id;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { excerpt: { contains: search } },
      ];
    }
    if (tagSlug) {
      const tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
      if (tag) where.tags = { some: { tagId: tag.id } };
    }
    if (tagId) {
      where.tags = { some: { tagId } };
    }

    const [data, total] = await Promise.all([
      prisma.post.findMany({
        where: where as never,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, name: true, email: true } },
          tags: { include: { tag: true } },
        },
        orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      prisma.post.count({ where: where as never }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getBySlug(siteId: number, categorySlug: string, slug: string) {
    return prisma.post.findFirst({
      where: { slug, siteId, category: { slug: categorySlug }, status: 'PUBLISHED' },
      include: {
        category: true,
        author: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
      },
    });
  },

  async getById(id: number) {
    return prisma.post.findUnique({
      where: { id },
      include: {
        category: true,
        author: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
      },
    });
  },

  async create(data: {
    siteId: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string | null;
    coverImage?: string | null;
    status?: string;
    sortOrder?: number;
    categoryId: number;
    authorId?: string | null;
    seoTitle?: string | null;
    seoDesc?: string | null;
    isPinned?: boolean;
    isFeatured?: boolean;
    tagIds?: number[];
  }) {
    const { tagIds, ...postData } = data;
    return prisma.post.create({
      data: {
        ...postData,
        status: (postData.status as never) || 'DRAFT',
        publishedAt: postData.status === 'PUBLISHED' ? new Date() : null,
        tags: tagIds ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: { category: true, tags: { include: { tag: true } } },
    });
  },

  async update(id: number, data: Record<string, unknown>) {
    const { tagIds, ...postData } = data;
    if (postData.status === 'PUBLISHED') {
      const existing = await prisma.post.findUnique({ where: { id } });
      if (existing && existing.status !== 'PUBLISHED') {
        (postData as Record<string, unknown>).publishedAt = new Date();
      }
    }
    if (tagIds !== undefined) {
      await prisma.postTag.deleteMany({ where: { postId: id } });
      if ((tagIds as number[]).length > 0) {
        await prisma.postTag.createMany({
          data: (tagIds as number[]).map((tagId: number) => ({ postId: id, tagId })),
        });
      }
    }
    return prisma.post.update({
      where: { id },
      data: postData as never,
      include: { category: true, tags: { include: { tag: true } } },
    });
  },

  async delete(id: number) {
    return prisma.post.delete({ where: { id } });
  },

  async reorder(items: { id: number; sortOrder: number }[]) {
    const ops = items.map((item) =>
      prisma.post.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
    );
    await prisma.$transaction(ops);
  },

  async getFeatured(siteId: number) {
    return prisma.post.findMany({
      where: { status: 'PUBLISHED', isFeatured: true, siteId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });
  },

  async batchUpdateStatus(ids: number[], status: string) {
    await prisma.post.updateMany({ where: { id: { in: ids } }, data: { status: status as never } });
  },

  async batchUpdatePinned(ids: number[], isPinned: boolean) {
    await prisma.post.updateMany({ where: { id: { in: ids } }, data: { isPinned } });
  },

  async batchUpdateFeatured(ids: number[], isFeatured: boolean) {
    await prisma.post.updateMany({ where: { id: { in: ids } }, data: { isFeatured } });
  },

  async batchDelete(ids: number[]) {
    await prisma.post.deleteMany({ where: { id: { in: ids } } });
  },
};
