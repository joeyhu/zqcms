import { Elysia, t } from 'elysia';
import { publishPlatformService, publishRecordService } from '../services/publish.service';
import { publishPostToWechat } from '../services/wechat.service';
import { authBeforeHandle } from '../middleware/auth';

export const publishRoutes = new Elysia({ prefix: '/api/publish' })
  .guard({ beforeHandle: [authBeforeHandle] }, (app) =>
    app
      // ─── 平台管理 CRUD ─────────────────────
      .get('/platforms', async () => {
        return publishPlatformService.list();
      })
      .post('/platforms', async (ctx) => {
        const b = ctx.body as {
          name: string; platform: string; appId: string; appSecret: string;
          qrcode?: string; description?: string; isActive?: boolean;
        };
        return publishPlatformService.create(b);
      }, {
        body: t.Object({
          name: t.String(), platform: t.String(), appId: t.String(), appSecret: t.String(),
          qrcode: t.Optional(t.Nullable(t.String())), description: t.Optional(t.Nullable(t.String())),
          isActive: t.Optional(t.Boolean()),
        }),
      })
      .put('/platforms/:id', async (ctx) => {
        const p = ctx.params as { id: string };
        return publishPlatformService.update(Number(p.id), ctx.body as never);
      }, {
        body: t.Record(t.String(), t.Any()),
      })
      .delete('/platforms/:id', async (ctx) => {
        const p = ctx.params as { id: string };
        await publishPlatformService.delete(Number(p.id));
        return { success: true };
      })

      // ─── 发布操作 ──────────────────────────
      .post('/submit', async (ctx) => {
        const b = ctx.body as { postId: number; platformId: number };
        // 创建发布记录
        const record = await publishRecordService.create(b.postId, b.platformId);

        try {
          // 调用微信发布
          const result = await publishPostToWechat(b.postId, b.platformId);
          await publishRecordService.updateStatus(record.id, 'success', result.publishId);
          return { success: true, recordId: record.id, publishId: result.publishId };
        } catch (err) {
          const msg = err instanceof Error ? err.message : '发布失败';
          await publishRecordService.updateStatus(record.id, 'failed', undefined, msg);
          throw new Error(msg);
        }
      }, {
        body: t.Object({ postId: t.Number(), platformId: t.Number() }),
      })

      // ─── 发布记录查询 ─────────────────────
      .get('/records', async (ctx) => {
        const q = (ctx.query || {}) as Record<string, string>;
        return publishRecordService.listAll(
          q.page ? Number(q.page) : 1,
          q.pageSize ? Number(q.pageSize) : 20,
        );
      })
      .get('/records/by-post/:postId', async (ctx) => {
        const p = ctx.params as { postId: string };
        return publishRecordService.listByPost(Number(p.postId));
      })
  );
