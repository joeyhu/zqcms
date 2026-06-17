import { Elysia, t } from 'elysia';
import { llmConfigService, llmAssistService, fetchModels } from '../services/llm.service';
import { authBeforeHandle } from '../middleware/auth';

export const llmRoutes = new Elysia({ prefix: '/api/llm' })
  .guard({ beforeHandle: [authBeforeHandle] }, (app) =>
    app
      // ─── LLM 配置 CRUD ──────────────────────
      .get('/configs', async () => {
        return llmConfigService.list();
      })
      .get('/configs/:id', async (ctx) => {
        const p = ctx.params as { id: string };
        return llmConfigService.getById(Number(p.id));
      })
      .post('/configs', async (ctx) => {
        const b = ctx.body as {
          name: string; provider: string; apiKey: string; baseUrl: string; model: string; isActive?: boolean;
        };
        return llmConfigService.create(b);
      }, {
        body: t.Object({
          name: t.String(), provider: t.String(), apiKey: t.String(),
          baseUrl: t.String(), model: t.String(), isActive: t.Optional(t.Boolean()),
        }),
      })
      .put('/configs/:id', async (ctx) => {
        const p = ctx.params as { id: string };
        return llmConfigService.update(Number(p.id), ctx.body as Record<string, unknown> as never);
      }, {
        body: t.Object({
          name: t.Optional(t.String()), provider: t.Optional(t.String()),
          apiKey: t.Optional(t.String()), baseUrl: t.Optional(t.String()),
          model: t.Optional(t.String()), isActive: t.Optional(t.Boolean()),
        }),
      })
      .delete('/configs/:id', async (ctx) => {
        const p = ctx.params as { id: string };
        await llmConfigService.delete(Number(p.id));
        return { success: true };
      })

      // ─── 获取模型列表 ──────────────────────
      .post('/fetch-models', async (ctx) => {
        const b = ctx.body as { baseUrl: string; apiKey: string };
        const models = await fetchModels(b.baseUrl, b.apiKey);
        return { success: true, models };
      }, {
        body: t.Object({ baseUrl: t.String(), apiKey: t.String() }),
      })

      // ─── AI 辅助 ──────────────────────────
      .post('/assist', async (ctx) => {
        const b = ctx.body as {
          action: string; content: string; title?: string; categories?: string[]; existingTags?: string[];
        };
        return llmAssistService.assist(b as never);
      }, {
        body: t.Object({
          action: t.String(),
          content: t.String(),
          title: t.Optional(t.String()),
          categories: t.Optional(t.Array(t.String())),
          existingTags: t.Optional(t.Array(t.String())),
        }),
      })
  );
