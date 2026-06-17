import prisma from '../lib/prisma';

export const blockTemplateService = {
  async list(siteId: number) {
    return prisma.blockTemplate.findMany({
      where: { siteId },
      include: { cardTemplate: { select: { id: true, name: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  },

  async getById(id: number) {
    return prisma.blockTemplate.findUnique({
      where: { id },
      include: { cardTemplate: { select: { id: true, name: true } } },
    });
  },

  async create(data: {
    siteId: number; name: string; description?: string;
    cardTemplateId?: number | null; contentSource: string;
    columns?: Record<string, unknown>; isPreset?: boolean; sortOrder?: number;
  }) {
    return prisma.blockTemplate.create({ data: data as never });
  },

  async update(id: number, data: Record<string, unknown>) {
    return prisma.blockTemplate.update({ where: { id }, data: data as never });
  },

  async delete(id: number) {
    return prisma.blockTemplate.delete({ where: { id } });
  },
};
