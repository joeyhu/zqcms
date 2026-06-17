import prisma from '../lib/prisma';

// ─── 平台管理 CRUD ─────────────────────────────────

export const publishPlatformService = {
  async list() {
    return prisma.publishPlatform.findMany({ orderBy: { updatedAt: 'desc' } });
  },

  async getById(id: number) {
    return prisma.publishPlatform.findUnique({ where: { id } });
  },

  async create(data: {
    name: string;
    platform: string;
    appId: string;
    appSecret: string;
    qrcode?: string | null;
    description?: string | null;
    isActive?: boolean;
  }) {
    return prisma.publishPlatform.create({ data });
  },

  async update(id: number, data: {
    name?: string;
    platform?: string;
    appId?: string;
    appSecret?: string;
    qrcode?: string | null;
    description?: string | null;
    isActive?: boolean;
  }) {
    return prisma.publishPlatform.update({ where: { id }, data });
  },

  async delete(id: number) {
    return prisma.publishPlatform.delete({ where: { id } });
  },
};

// ─── 发布记录 ──────────────────────────────────────

export const publishRecordService = {
  async listByPost(postId: number) {
    return prisma.publishRecord.findMany({
      where: { postId },
      include: { platform: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async listAll(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      prisma.publishRecord.findMany({
        include: { platform: { select: { id: true, name: true, platform: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.publishRecord.count(),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async create(postId: number, platformId: number) {
    return prisma.publishRecord.create({
      data: { postId, platformId, status: 'pending' },
    });
  },

  async updateStatus(id: number, status: string, publishId?: string, errorMsg?: string) {
    return prisma.publishRecord.update({
      where: { id },
      data: { status, publishId, errorMsg },
    });
  },
};
