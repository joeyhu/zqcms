/**
 * 触发前端 Next.js 缓存刷新
 * 当后端数据变更时，通知前端重新渲染页面
 */

const WEB_URL = process.env.WEB_URL || 'http://localhost:11001';

export async function revalidateFrontend(paths: string[] = ['/']) {
  try {
    const res = await fetch(`${WEB_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    });
    if (!res.ok) {
      console.warn(`[revalidate] ${WEB_URL}/api/revalidate → ${res.status}`);
    }
  } catch {
    // 静默失败 — 前端会在 5 秒后自动刷新
  }
}
