import { Elysia, t } from 'elysia';
import { blockTemplateService } from '../services/block-template.service';
import { authBeforeHandle } from '../middleware/auth';

const S = (ctx: unknown) => ctx as Record<string, unknown>;

export const blockTemplateRoutes = new Elysia({ prefix: '/api/block-templates' })
  .get('/', async (ctx) => {
    return blockTemplateService.list(S(ctx).siteId as number);
  })
  .get('/:id', async (ctx) => {
    return blockTemplateService.getById(Number((S(ctx).params as Record<string, string>).id));
  })
  .guard({ beforeHandle: [authBeforeHandle] }, (app) =>
    app
      .post('/', async (ctx) => {
        const b = S(ctx).body as Record<string, unknown>;
        b.siteId = S(ctx).siteId as number;
        return blockTemplateService.create(b as never);
      }, {
        body: t.Object({
          name: t.String(), description: t.Optional(t.Nullable(t.String())),
          cardTemplateId: t.Optional(t.Nullable(t.Number())),
          contentSource: t.String(),
          columns: t.Optional(t.Record(t.String(), t.Unknown())),
          isPreset: t.Optional(t.Boolean()), sortOrder: t.Optional(t.Number()),
        }),
      })
      .put('/:id', async (ctx) => {
        return blockTemplateService.update(
          Number((S(ctx).params as Record<string, string>).id),
          S(ctx).body as Record<string, unknown>
        );
      }, {
        body: t.Object({
          name: t.Optional(t.String()), description: t.Optional(t.Nullable(t.String())),
          cardTemplateId: t.Optional(t.Nullable(t.Number())),
          contentSource: t.Optional(t.String()),
          columns: t.Optional(t.Record(t.String(), t.Unknown())),
          sortOrder: t.Optional(t.Number()),
        }),
      })
      .delete('/:id', async (ctx) => {
        return blockTemplateService.delete(Number((S(ctx).params as Record<string, string>).id));
      })
      .post('/:id/duplicate', async (ctx) => {
        const originalId = Number((S(ctx).params as Record<string, string>).id);
        const original = await blockTemplateService.getById(originalId);
        if (!original) throw new Error('Block template not found');
        return blockTemplateService.create({
          siteId: S(ctx).siteId as number,
          name: `${original.name}（副本）`,
          description: original.description ?? undefined,
          cardTemplateId: original.cardTemplateId,
          contentSource: original.contentSource,
          columns: original.columns as Record<string, unknown> || {},
          sortOrder: original.sortOrder + 1,
          isPreset: false,
        });
      })
  );
