import { Elysia, t } from 'elysia';
import { pageBlockService } from '../services/page-block.service';
import { authBeforeHandle } from '../middleware/auth';
import { revalidateFrontend } from '../lib/revalidate';

const S = (ctx: unknown) => ctx as Record<string, unknown>;

export const pageBlockRoutes = new Elysia({ prefix: '/api/page-blocks' })
  .get('/', async (ctx) => {
    const pageType = (S(ctx).query as Record<string, string>).pageType || 'home';
    return pageBlockService.list(S(ctx).siteId as number, pageType);
  })
  .get('/:id', async (ctx) => {
    return pageBlockService.getById(Number((S(ctx).params as Record<string, string>).id));
  })
  .guard({ beforeHandle: [authBeforeHandle] }, (app) =>
    app
      .onAfterResponse(() => { revalidateFrontend(); })
      .post('/', async (ctx) => {
        const b = S(ctx).body as Record<string, unknown>;
        b.siteId = S(ctx).siteId as number;
        return pageBlockService.create(b as never);
      }, {
        body: t.Object({
          pageType: t.String(), blockType: t.String(),
          title: t.Optional(t.Nullable(t.String())),
          config: t.Optional(t.Record(t.String(), t.Unknown())),
          sortOrder: t.Optional(t.Number()), isVisible: t.Optional(t.Boolean()),
        }),
      })
      .put('/:id', async (ctx) => {
        return pageBlockService.update(Number((S(ctx).params as Record<string, string>).id), S(ctx).body as Record<string, unknown>);
      }, {
        body: t.Object({
          blockType: t.Optional(t.String()), title: t.Optional(t.Nullable(t.String())),
          config: t.Optional(t.Record(t.String(), t.Unknown())),
          sortOrder: t.Optional(t.Number()), isVisible: t.Optional(t.Boolean()),
        }),
      })
      .delete('/:id', async (ctx) => {
        return pageBlockService.delete(Number((S(ctx).params as Record<string, string>).id));
      })
      .post('/reorder', async (ctx) => {
        await pageBlockService.reorder((S(ctx).body as { items: { id: number; sortOrder: number }[] }).items);
        return { success: true };
      }, {
        body: t.Object({ items: t.Array(t.Object({ id: t.Number(), sortOrder: t.Number() })) }),
      })
  );
