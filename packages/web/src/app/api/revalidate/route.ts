import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * POST /api/revalidate
 * 后端内容变更时调用此端点，立即刷新前端缓存
 *
 * Body: { paths?: string[]; token?: string }  — 要刷新的路径列表，默认刷新所有页面
 *
 * 认证方式：
 *   - 通过 Authorization: Bearer <token> header
 *   - 或通过 body.token 字段
 *   - token 需要匹配 REVALIDATE_TOKEN 环境变量
 */
const REVALIDATE_TOKEN = process.env.REVALIDATE_TOKEN || '';

export async function POST(req: Request) {
  try {
    // ── 身份验证 ──
    if (REVALIDATE_TOKEN) {
      const authHeader = req.headers.get('authorization');
      const body = await req.json().catch(() => ({}));
      const token =
        authHeader?.replace(/^Bearer\s+/i, '') || body.token || '';

      if (token !== REVALIDATE_TOKEN) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: invalid token' },
          { status: 401 },
        );
      }

      const paths: string[] = body.paths || ['/', '/'];

      // 刷新指定路径
      for (const path of paths) {
        revalidatePath(path, 'page');
      }

      // 同时刷新 layout（因为 layout 包含站点名称、导航等）
      revalidatePath('/', 'layout');

      return NextResponse.json({ success: true, paths });
    }

    // ── 无 token 配置时回退（保持向后兼容，但记录警告） ──
    const body = await req.json().catch(() => ({}));
    const paths: string[] = body.paths || ['/', '/'];

    for (const path of paths) {
      revalidatePath(path, 'page');
    }
    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, paths });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
