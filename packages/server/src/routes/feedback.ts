import { Elysia, t } from 'elysia';
import { feedbackService } from '../services/feedback.service';
import { authBeforeHandle } from '../middleware/auth';

const S = (ctx: unknown) => ctx as Record<string, unknown>;
const siteId = (ctx: unknown) => S(ctx).siteId as number;

export const feedbackRoutes = new Elysia({ prefix: '/api/feedback' })
  // ── Public: submit feedback ──
  .post('/', async (ctx) => {
    const body = (ctx as { body: Record<string, unknown> }).body as {
      name: string;
      phone?: string | null;
      email?: string | null;
      content: string;
      pageUrl?: string | null;
    };

    // Validate: at least phone or email required
    if (!body.phone && !body.email) {
      throw new Error('请至少提供联系电话或邮箱，以便我们回复您');
    }

    return feedbackService.create({
      siteId: siteId(ctx),
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      content: body.content,
      pageUrl: body.pageUrl || null,
    });
  }, {
    body: t.Object({
      name: t.String(),
      phone: t.Optional(t.Nullable(t.String())),
      email: t.Optional(t.Nullable(t.String())),
      content: t.String(),
      pageUrl: t.Optional(t.Nullable(t.String())),
    }),
  })

  // ── Admin: list feedback ──
  .guard({ beforeHandle: [authBeforeHandle] }, (app) =>
    app
      .get('/', async (ctx) => {
        const q = S(ctx).query as Record<string, string>;
        return feedbackService.list({
          siteId: siteId(ctx),
          status: q.status || undefined,
          page: q.page ? Number(q.page) : 1,
          pageSize: q.pageSize ? Number(q.pageSize) : 20,
        });
      })
      .put('/:id', async (ctx) => {
        const p = S(ctx).params as { id: string };
        const body = (ctx as { body: Record<string, unknown> }).body as { status: string };
        return feedbackService.updateStatus(Number(p.id), body.status);
      }, {
        body: t.Object({ status: t.String() }),
      })
      .delete('/:id', async (ctx) => {
        const p = S(ctx).params as { id: string };
        return feedbackService.delete(Number(p.id));
      })
  );
