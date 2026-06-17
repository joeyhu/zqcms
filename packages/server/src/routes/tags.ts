import { Elysia, t } from 'elysia';
import { tagService } from '../services/tag.service';
import { authBeforeHandle } from '../middleware/auth';

export const tagRoutes = new Elysia({ prefix: '/api/tags' })
  .get('/', async () => {
    return tagService.list();
  })
  .get('/by-slug/:slug', async ({ params }) => {
    return tagService.getBySlug(params.slug);
  })
  .get('/:id', async ({ params }) => {
    return tagService.getById(Number(params.id));
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
      .put('/:id', async ({ params, body }) => {
        return tagService.update(Number(params.id), body);
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
