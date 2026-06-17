import { Elysia, t } from 'elysia';
import { categoryService } from '../services/category.service';
import { pageBlockService } from '../services/page-block.service';
import { authBeforeHandle } from '../middleware/auth';
import { revalidateFrontend } from '../lib/revalidate';

function sid(ctx: unknown): number {
  return (ctx as Record<string, unknown>).siteId as number;
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
  // 获取目录页/子目录页的 blocks（含三级回退逻辑）
  // GET /api/categories/blocks?slug=docs           → 一级目录
  // GET /api/categories/blocks?slug=docs/guide     → 二级子目录
  .get('/blocks', async (ctx) => {
    const slug = ((ctx as { query: Record<string, string> }).query.slug) || '';
    if (!slug) return [];
    // 判断是否为子目录（含 / 分隔符）
    if (slug.includes('/')) {
      return pageBlockService.getForSubcategory(sid(ctx), slug);
    }
    return pageBlockService.getForCategory(sid(ctx), slug);
  })
  .get('/by-id/:id', async (ctx) => {
    return categoryService.getById(Number((ctx as { params: Record<string, string> }).params.id));
  })
  .get('/:slug', async (ctx) => {
    const c = ctx as { query: Record<string, string>; params: Record<string, string> };
    if (c.query.withPosts === 'true') return categoryService.getWithPosts(sid(ctx), c.params.slug);
    return categoryService.getBySlug(sid(ctx), c.params.slug);
  })
  .guard({ beforeHandle: [authBeforeHandle] }, (app) =>
    app
      .onAfterResponse(() => {
        revalidateFrontend(); // 变更后通知前端刷新（fire-and-forget）
      })
      .post('/', async (ctx) => {
        const b = (ctx as { body: Record<string, unknown> }).body as Record<string, unknown>;
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
        return categoryService.update(Number((ctx as { params: Record<string, string> }).params.id), (ctx as { body: Record<string, unknown> }).body);
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
