import prisma from '../lib/prisma';
import { hashPassword } from '../lib/password';

export const userService = {
  async list() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { posts: true } },
      },
    });
  },

  async create(data: { email: string; password: string; name?: string; role?: string; isActive?: boolean; permissions?: string[] }) {
    const hashedPw = await hashPassword(data.password);
    return prisma.user.create({
      data: {
        email: data.email,
        password: hashedPw,
        name: data.name || null,
        role: (data.role as never) || 'EDITOR',
        isActive: data.isActive ?? true,
        permissions: data.permissions || [],
      },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
  },

  async update(id: string, data: { email?: string; password?: string; name?: string; role?: string; isActive?: boolean; permissions?: string[] }) {
    const updateData: Record<string, unknown> = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password) updateData.password = await hashPassword(data.password);
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role as never;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.permissions !== undefined) updateData.permissions = data.permissions;

    return prisma.user.update({
      where: { id },
      data: updateData as never,
      select: { id: true, email: true, name: true, role: true, isActive: true, permissions: true },
    });
  },

  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};
