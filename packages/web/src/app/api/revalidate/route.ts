import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * POST /api/revalidate
 * 后端内容变更时调用此端点，立即刷新前端缓存
 *
 * Body: { paths?: string[] }  — 要刷新的路径列表，默认刷新所有页面
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const paths: string[] = body.paths || ['/', '/'];

    // 刷新指定路径
    for (const path of paths) {
      revalidatePath(path, 'page');
    }

    // 同时刷新 layout（因为 layout 包含站点名称、导航等）
    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, paths });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
