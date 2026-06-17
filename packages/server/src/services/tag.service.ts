import prisma from '../lib/prisma';

export const tagService = {
  async list() {
    return prisma.tag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    });
  },

  async create(data: { name: string; slug: string }) {
    return prisma.tag.upsert({
      where: { slug: data.slug },
      update: { name: data.name },
      create: data,
    });
  },

  async delete(id: number) {
    return prisma.tag.delete({ where: { id } });
  },
};
