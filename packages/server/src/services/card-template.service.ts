import prisma from '../lib/prisma';

export const cardTemplateService = {
  async list(siteId: number) {
    return prisma.cardTemplate.findMany({
      where: { siteId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  },

  async getById(id: number) {
    return prisma.cardTemplate.findUnique({ where: { id } });
  },

  async create(data: {
    siteId: number; name: string; description?: string;
    isPreset?: boolean; config?: Record<string, unknown>; sortOrder?: number;
  }) {
    return prisma.cardTemplate.create({ data: data as never });
  },

  async update(id: number, data: Record<string, unknown>) {
    return prisma.cardTemplate.update({ where: { id }, data: data as never });
  },

  async delete(id: number) {
    return prisma.cardTemplate.delete({ where: { id } });
  },
};
