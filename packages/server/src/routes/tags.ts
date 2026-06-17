import { Elysia, t } from 'elysia';
import { tagService } from '../services/tag.service';
import { authBeforeHandle } from '../middleware/auth';

export const tagRoutes = new Elysia({ prefix: '/api/tags' })
  .get('/', async () => {
    return tagService.list();
  })
  .guard({ beforeHandle: [authBeforeHandle] }, (app) =>
    app
      .post('/', async ({ body }) => {
        return tagService.create(body);
      }, {
        body: t.Object({
          name: t.String(),
          slug: t.String(),
        }),
      })
      .delete('/:id', async ({ params }) => {
        return tagService.delete(Number(params.id));
      })
      .post('/batch-create', async ({ body }) => {
        const b = body as { names: string[] };
        return tagService.batchCreate(b.names || []);
      }, {
        body: t.Object({ names: t.Array(t.String()) }),
      })
  );
