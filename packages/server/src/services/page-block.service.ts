import prisma from '../lib/prisma';

/** 兼容旧种子数据：如果 config 被错误存成了 JSON 字符串，解析为对象 */
function normalizeConfig(config: unknown): Record<string, unknown> {
  if (!config) return {};
  if (typeof config === 'object' && !Array.isArray(config)) return config as Record<string, unknown>;
  if (typeof config === 'string') {
    try {
      const parsed = JSON.parse(config);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch { /* ignore */ }
  }
  return {};
}

function normalizeBlock(block: Record<string, unknown> & { config: unknown }) {
  return { ...block, config: normalizeConfig(block.config) };
}

export const pageBlockService = {
  async list(siteId: number, pageType: string) {
    const blocks = await prisma.pageBlock.findMany({
      where: { siteId, pageType },
      orderBy: { sortOrder: 'asc' },
    });
    return blocks.map(normalizeBlock);
  },

  async getById(id: number) {
    const block = await prisma.pageBlock.findUnique({ where: { id } });
    return block ? normalizeBlock(block as never) : null;
  },

  async create(data: { siteId: number; pageType: string; blockType: string; title?: string | null; config?: Record<string, unknown>; sortOrder?: number; isVisible?: boolean }) {
    const block = await prisma.pageBlock.create({
      data: { ...data, config: (data.config || {}) as never, blockType: data.blockType as never },
    });
    return normalizeBlock(block as never);
  },

  async update(id: number, data: Record<string, unknown>) {
    const block = await prisma.pageBlock.update({ where: { id }, data: data as never });
    return normalizeBlock(block as never);
  },

  async delete(id: number) {
    return prisma.pageBlock.delete({ where: { id } });
  },

  async reorder(items: { id: number; sortOrder: number }[]) {
    const ops = items.map((item) =>
      prisma.pageBlock.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
    );
    await prisma.$transaction(ops);
  },

  /**
   * 获取一级目录页的 blocks，三级回退：
   *   1. category:{slug}（特定目录配置）
   *   2. category（全局目录页模板）
   *   3. 空数组（前端硬编码兜底）
   */
  async getForCategory(siteId: number, slug: string) {
    // 1. 特定目录配置
    let blocks = await prisma.pageBlock.findMany({
      where: { siteId, pageType: `category:${slug}` },
      orderBy: { sortOrder: 'asc' },
    });
    if (blocks.length > 0) return blocks.map(normalizeBlock);

    // 2. 全局目录页模板
    blocks = await prisma.pageBlock.findMany({
      where: { siteId, pageType: 'category' },
      orderBy: { sortOrder: 'asc' },
    });
    return blocks.map(normalizeBlock);
  },

  /**
   * 获取二级子目录页的 blocks，三级回退：
   *   1. subcategory:{fullSlug}（特定子目录配置）
   *   2. subcategory（全局子目录页模板）
   *   3. 空数组（前端硬编码兜底）
   */
  async getForSubcategory(siteId: number, fullSlug: string) {
    let blocks = await prisma.pageBlock.findMany({
      where: { siteId, pageType: `subcategory:${fullSlug}` },
      orderBy: { sortOrder: 'asc' },
    });
    if (blocks.length > 0) return blocks.map(normalizeBlock);

    blocks = await prisma.pageBlock.findMany({
      where: { siteId, pageType: 'subcategory' },
      orderBy: { sortOrder: 'asc' },
    });
    return blocks.map(normalizeBlock);
  },
};
