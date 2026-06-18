import { Elysia, t } from 'elysia';
import { userService } from '../services/user.service';
import { authBeforeHandle } from '../middleware/auth';

const S = (ctx: unknown) => ctx as Record<string, unknown>;

/** Only admins can manage users */
async function adminOnly(ctx: unknown) {
  const user = S(ctx).user as { role?: string } | null;
  if (!user || user.role !== 'ADMIN') {
    throw new Error('仅管理员可访问');
  }
}

export const userRoutes = new Elysia({ prefix: '/api/users' })
  .guard({ beforeHandle: [authBeforeHandle, adminOnly] }, (app) =>
    app
      .get('/', async () => {
        return userService.list();
      })
      .get('/:id', async (ctx) => {
        const p = S(ctx).params as { id: string };
        return userService.getById(p.id);
      })
      .post('/', async (ctx) => {
        const body = (ctx as { body: Record<string, unknown> }).body as {
          email: string;
          password: string;
          name?: string;
          role?: string;
          isActive?: boolean;
          permissions?: string[];
        };
        return userService.create(body);
      }, {
        body: t.Object({
          email: t.String(),
          password: t.String(),
          name: t.Optional(t.String()),
          role: t.Optional(t.String()),
          isActive: t.Optional(t.Boolean()),
          permissions: t.Optional(t.Array(t.String())),
        }),
      })
      .put('/:id', async (ctx) => {
        const p = S(ctx).params as { id: string };
        const body = (ctx as { body: Record<string, unknown> }).body as {
          email?: string;
          password?: string;
          name?: string;
          role?: string;
          isActive?: boolean;
          permissions?: string[];
        };
        return userService.update(p.id, body);
      }, {
        body: t.Object({
          email: t.Optional(t.String()),
          password: t.Optional(t.String()),
          name: t.Optional(t.String()),
          role: t.Optional(t.String()),
          isActive: t.Optional(t.Boolean()),
          permissions: t.Optional(t.Array(t.String())),
        }),
      })
      .delete('/:id', async (ctx) => {
        const p = S(ctx).params as { id: string };
        return userService.delete(p.id);
      })
  );
