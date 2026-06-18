import prisma from '../lib/prisma';

export const feedbackService = {
  async list(params: {
    siteId: number;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { siteId, status, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { siteId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.feedback.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.feedback.count({ where: where as never }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async create(data: {
    siteId: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    content: string;
    pageUrl?: string | null;
  }) {
    return prisma.feedback.create({ data: data as never });
  },

  async updateStatus(id: number, status: string) {
    return prisma.feedback.update({
      where: { id },
      data: { status: status as never },
    });
  },

  async delete(id: number) {
    return prisma.feedback.delete({ where: { id } });
  },
};
