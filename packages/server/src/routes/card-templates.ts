import { Elysia, t } from 'elysia';
import { cardTemplateService } from '../services/card-template.service';
import { authBeforeHandle } from '../middleware/auth';

const S = (ctx: unknown) => ctx as Record<string, unknown>;

export const cardTemplateRoutes = new Elysia({ prefix: '/api/card-templates' })
  .get('/', async (ctx) => {
    return cardTemplateService.list(S(ctx).siteId as number);
  })
  .get('/:id', async (ctx) => {
    return cardTemplateService.getById(Number((S(ctx).params as Record<string, string>).id));
  })
  .guard({ beforeHandle: [authBeforeHandle] }, (app) =>
    app
      .post('/', async (ctx) => {
        const b = S(ctx).body as Record<string, unknown>;
        b.siteId = S(ctx).siteId as number;
        return cardTemplateService.create(b as never);
      }, {
        body: t.Object({
          name: t.String(), description: t.Optional(t.Nullable(t.String())),
          config: t.Optional(t.Record(t.String(), t.Unknown())),
          isPreset: t.Optional(t.Boolean()), sortOrder: t.Optional(t.Number()),
        }),
      })
      .put('/:id', async (ctx) => {
        return cardTemplateService.update(
          Number((S(ctx).params as Record<string, string>).id),
          S(ctx).body as Record<string, unknown>
        );
      }, {
        body: t.Object({
          name: t.Optional(t.String()), description: t.Optional(t.Nullable(t.String())),
          config: t.Optional(t.Record(t.String(), t.Unknown())),
          sortOrder: t.Optional(t.Number()),
        }),
      })
      .delete('/:id', async (ctx) => {
        return cardTemplateService.delete(Number((S(ctx).params as Record<string, string>).id));
      })
      .post('/:id/duplicate', async (ctx) => {
        const originalId = Number((S(ctx).params as Record<string, string>).id);
        const original = await cardTemplateService.getById(originalId);
        if (!original) throw new Error('Card template not found');
        return cardTemplateService.create({
          siteId: S(ctx).siteId as number,
          name: `${original.name}（副本）`,
          description: original.description ?? undefined,
          config: (original.config || {}) as Record<string, unknown>,
          sortOrder: original.sortOrder + 1,
          isPreset: false,
        });
      })
  );
