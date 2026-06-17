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

  /** 批量创建标签（已有则跳过），返回全部标签对象 */
  async batchCreate(names: string[]) {
    const results = [];
    for (const name of names) {
      const slug = name
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (!slug) continue;
      const tag = await prisma.tag.upsert({
        where: { slug },
        update: { name },
        create: { name, slug },
      });
      results.push(tag);
    }
    return results;
  },
};
