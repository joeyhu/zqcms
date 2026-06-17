import { Elysia } from 'elysia';

/**
 * 认证守卫 — 用于 .guard({ beforeHandle: [authBeforeHandle] })
 * user 由主 app 的 derive 注入（见 index.ts）
 */
export function authBeforeHandle(ctx: Record<string, unknown>): string | undefined {
  const user = ctx.user as { userId: string } | null | undefined;
  const set = ctx.set as { status: number; headers: Record<string, string> };
  if (!user) {
    set.status = 401;
    set.headers['Content-Type'] = 'application/json';
    return JSON.stringify({ success: false, error: 'Unauthorized' });
  }
}
