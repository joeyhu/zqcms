import prisma from '../lib/prisma';

export const tagService = {
  async list() {
    return prisma.tag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: number) {
    return prisma.tag.findUniqueOrThrow({ where: { id } });
  },

  async getBySlug(slug: string) {
    return prisma.tag.findUnique({
      where: { slug: slug.toLowerCase() },
      include: { _count: { select: { posts: true } } },
    });
  },

  async create(data: { name: string; slug: string }) {
    // 统一 slug 为小写，确保不区分大小写的唯一性
    const slug = data.slug.toLowerCase();
    return prisma.tag.upsert({
      where: { slug },
      update: { name: data.name },
      create: { name: data.name, slug },
    });
  },

  async update(id: number, data: { name: string; slug: string }) {
    // 统一 slug 为小写，upsert 保证不区分大小写唯一
    const slug = data.slug.toLowerCase();
    const result = await prisma.tag.upsert({
      where: { slug },
      update: { name: data.name },
      create: { name: data.name, slug },
    });
    // 如果 upsert 落到另一条记录上（slug 被占用），清理原记录
    if (result.id !== id) {
      await prisma.tag.delete({ where: { id } }).catch(() => {});
    }
    return result;
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
