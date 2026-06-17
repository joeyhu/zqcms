import prisma from '../lib/prisma';

export const mediaService = {
  async list(siteId: number, params: { page?: number; pageSize?: number; mimeType?: string }) {
    const { page = 1, pageSize = 20, mimeType } = params;
    const where: Record<string, unknown> = { siteId };
    if (mimeType) where.mimeType = { startsWith: mimeType };

    const [data, total] = await Promise.all([
      prisma.media.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.media.count({ where: where as never }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async create(file: { siteId: number; filename: string; url: string; mimeType: string; size: number; altText?: string }) {
    return prisma.media.create({ data: file });
  },

  async delete(id: number) {
    return prisma.media.delete({ where: { id } });
  },
};
