import { Elysia, t } from 'elysia';
import { categoryService } from '../services/category.service';
import { authBeforeHandle } from '../middleware/auth';
import { revalidateFrontend } from '../lib/revalidate';

function sid(ctx: unknown): number {
  return (ctx as Record<string, unknown>).siteId as number;
}

/** Reserved slugs that cannot be used as category slugs (to avoid route conflicts) */
const RESERVED_SLUGS = ['tag'];

function validateCategorySlug(slug: string): void {
  const normalized = slug.toLowerCase().trim();
  for (const reserved of RESERVED_SLUGS) {
    if (normalized === reserved || normalized.startsWith(reserved + '/')) {
      throw new Error(`目录 slug 不能使用保留名称 "${reserved}"，请使用其他名称`);
    }
  }
}

export const categoryRoutes = new Elysia({ prefix: '/api/categories' })
  .get('/', async (ctx) => {
    const { query } = ctx as { query: Record<string, string> };
    const tree = query.tree === 'true';
    const all = query.all === 'true';
    if (tree) return categoryService.tree(sid(ctx), all);
    return categoryService.list(sid(ctx), all);
  })
  .get('/tree', async (ctx) => {
    return categoryService.tree(sid(ctx), ((ctx as { query: Record<string, string> }).query.all === 'true'));
  })
  .get('/by-id/:id', async (ctx) => {
    return categoryService.getById(Number((ctx as { params: Record<string, string> }).params.id));
  })
  .get('/:slug', async (ctx) => {
    const c = ctx as { query: Record<string, string>; params: Record<string, string> };
    if (c.query.withPosts === 'true') {
      return categoryService.getWithPosts(sid(ctx), c.params.slug, {
        page: c.query.page ? Number(c.query.page) : undefined,
        pageSize: c.query.pageSize ? Number(c.query.pageSize) : undefined,
        includeDescendants: c.query.includeDescendants === 'true',
      });
    }
    return categoryService.getBySlug(sid(ctx), c.params.slug);
  })
  .guard({ beforeHandle: [authBeforeHandle] }, (app) =>
    app
      .onAfterResponse(() => {
        revalidateFrontend(); // 变更后通知前端刷新（fire-and-forget）
      })
      .post('/', async (ctx) => {
        const b = (ctx as { body: Record<string, unknown> }).body as Record<string, unknown>;
        validateCategorySlug(b.slug as string);
        b.siteId = sid(ctx);
        return categoryService.create(b as never);
      }, {
        body: t.Object({
          name: t.String(), slug: t.String(),
          description: t.Optional(t.Nullable(t.String())), icon: t.Optional(t.Nullable(t.String())),
          url: t.Optional(t.Nullable(t.String())),
          sortOrder: t.Optional(t.Number()), isVisible: t.Optional(t.Boolean()),
          parentId: t.Optional(t.Nullable(t.Number())),
        }),
      })
      .put('/:id', async (ctx) => {
        const body = (ctx as { body: Record<string, unknown> }).body;
        if (body.slug) validateCategorySlug(body.slug as string);
        return categoryService.update(Number((ctx as { params: Record<string, string> }).params.id), body);
      }, {
        body: t.Object({
          name: t.Optional(t.String()), slug: t.Optional(t.String()),
          description: t.Optional(t.Nullable(t.String())), icon: t.Optional(t.Nullable(t.String())),
          url: t.Optional(t.Nullable(t.String())),
          sortOrder: t.Optional(t.Number()), isVisible: t.Optional(t.Boolean()),
          parentId: t.Optional(t.Nullable(t.Number())),
        }),
      })
      .delete('/:id', async (ctx) => {
        return categoryService.delete(Number((ctx as { params: Record<string, string> }).params.id));
      })
      .post('/reorder', async (ctx) => {
        await categoryService.reorder((ctx as { body: { items: { id: number; sortOrder: number }[] } }).body.items);
        return { success: true };
      }, {
        body: t.Object({ items: t.Array(t.Object({ id: t.Number(), sortOrder: t.Number() })) }),
      })
  );
