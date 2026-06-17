import { Elysia, t } from 'elysia';
import { postService } from '../services/post.service';
import { authBeforeHandle } from '../middleware/auth';
import { revalidateFrontend } from '../lib/revalidate';

// Helpers for derived context (available at runtime from main app derive)
const S = (ctx: unknown) => (ctx as Record<string, unknown>);
const siteId = (ctx: unknown) => S(ctx).siteId as number;
const authUser = (ctx: unknown) => S(ctx).user as { userId: string } | null;

export const postRoutes = new Elysia({ prefix: '/api/posts' })
  .get('/', async (ctx) => {
    const q = S(ctx).query as Record<string, string>;
    return postService.list({
      siteId: siteId(ctx),
      categorySlug: q.categorySlug,
      status: q.status,
      featured: q.featured === undefined ? undefined : q.featured === 'true',
      search: q.search,
      tagId: q.tagId ? Number(q.tagId) : undefined,
      tagSlug: q.tagSlug || undefined,
      page: q.page ? Number(q.page) : 1,
      pageSize: q.pageSize ? Number(q.pageSize) : 20,
    });
  })
  .get('/featured', async (ctx) => {
    return postService.getFeatured(siteId(ctx));
  })
  .get('/:categorySlug/:slug', async (ctx) => {
    const p = S(ctx).params as { categorySlug: string; slug: string };
    const post = await postService.getBySlug(siteId(ctx), p.categorySlug, p.slug);
    if (!post) throw new Error('Post not found');
    return post;
  })
  .get('/by-id/:id', async (ctx) => {
    const p = S(ctx).params as { id: string };
    const post = await postService.getById(Number(p.id));
    if (!post) throw new Error('Post not found');
    return post;
  })
  .guard({ beforeHandle: [authBeforeHandle] }, (app) =>
    app
      .onAfterResponse(() => { revalidateFrontend(); })
      .post('/', async (ctx) => {
        const u = authUser(ctx);
        const b = S(ctx).body as Record<string, unknown>;
        b.siteId = siteId(ctx);
        b.authorId = u!.userId;
        return postService.create(b as never);
      }, {
        body: t.Object({
          title: t.String(), slug: t.String(), content: t.String(),
          excerpt: t.Optional(t.Nullable(t.String())), coverImage: t.Optional(t.Nullable(t.String())),
          status: t.Optional(t.String()), sortOrder: t.Optional(t.Number()),
          categoryId: t.Optional(t.Nullable(t.Number())),
          authorId: t.Optional(t.Nullable(t.String())),
          seoTitle: t.Optional(t.Nullable(t.String())), seoDesc: t.Optional(t.Nullable(t.String())),
          isPinned: t.Optional(t.Boolean()), isFeatured: t.Optional(t.Boolean()), tagIds: t.Optional(t.Array(t.Number())),
          publishedAt: t.Optional(t.Nullable(t.String())),
        }),
      })
      .put('/by-id/:id', async (ctx) => {
        return postService.update(Number((S(ctx).params as Record<string, string>).id), S(ctx).body as Record<string, unknown>);
      }, {
        body: t.Record(t.String(), t.Any()),
      })
      .delete('/by-id/:id', async (ctx) => {
        return postService.delete(Number((S(ctx).params as Record<string, string>).id));
      })
      .post('/reorder', async (ctx) => {
        await postService.reorder((S(ctx).body as { items: { id: number; sortOrder: number }[] }).items);
        return { success: true };
      }, {
        body: t.Object({ items: t.Array(t.Object({ id: t.Number(), sortOrder: t.Number() })) }),
      })
      .post('/batch', async (ctx) => {
        const b = S(ctx).body as { ids: number[]; action: string };
        if (!b.ids?.length) throw new Error('No IDs provided');
        if (b.action === 'publish') {
          await postService.batchUpdateStatus(b.ids, 'PUBLISHED');
        } else if (b.action === 'unpublish') {
          await postService.batchUpdateStatus(b.ids, 'DRAFT');
        } else if (b.action === 'pin') {
          await postService.batchUpdatePinned(b.ids, true);
        } else if (b.action === 'unpin') {
          await postService.batchUpdatePinned(b.ids, false);
        } else if (b.action === 'feature') {
          await postService.batchUpdateFeatured(b.ids, true);
        } else if (b.action === 'unfeature') {
          await postService.batchUpdateFeatured(b.ids, false);
        } else if (b.action === 'delete') {
          await postService.batchDelete(b.ids);
        } else {
          throw new Error('Invalid action');
        }
        return { success: true };
      }, {
        body: t.Object({ ids: t.Array(t.Number()), action: t.String() }),
      })
  );

