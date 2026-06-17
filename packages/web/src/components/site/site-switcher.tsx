'use client';

import { useEffect, useState, useCallback } from 'react';

interface SiteInfo {
  id: number;
  name: string;
  slug: string;
  domain: string;
}

const STORAGE_KEY = 'zqcms_site';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

/**
 * ★ 前端站点切换器
 *
 * - 选择站点后自动持久化到 localStorage + cookie
 * - 后续访问无需再在 URL 加 ?site= 参数
 * - 开发模式始终显示，生产环境自动隐藏
 */
export function SiteSwitcher() {
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [currentSlug, setCurrentSlug] = useState<string>('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 读取当前站点（优先级：URL > localStorage > cookie）
    const params = new URLSearchParams(window.location.search);
    const urlSlug = params.get('site') || '';
    const lsSlug = localStorage.getItem(STORAGE_KEY) || '';
    const cookieSlug = getCookie('zqcms_site') || '';
    const slug = urlSlug || lsSlug || cookieSlug;
    setCurrentSlug(slug);

    // 如果 URL 带了 site 参数，持久化到 localStorage 和 cookie 后清除 URL 参数
    if (urlSlug) {
      localStorage.setItem(STORAGE_KEY, urlSlug);
      setCookie('zqcms_site', urlSlug);
      // 清除 URL 中的 site 参数，保持 URL 干净
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('site');
      window.history.replaceState({}, '', cleanUrl.toString());
    }

    // 仅在开发模式显示
    const isDev = window.location.hostname === 'localhost';
    setVisible(isDev);

    // 获取所有站点列表
    fetch(`http://localhost:11003/api/sites`)
      .then((res) => res.json())
      .then(setSites)
      .catch(() => {});
  }, []);

  const switchSite = useCallback((slug: string) => {
    if (slug) {
      localStorage.setItem(STORAGE_KEY, slug);
      setCookie('zqcms_site', slug);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      removeCookie('zqcms_site');
    }
    // 硬刷新以确保 SSR 使用新站点
    window.location.reload();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="rounded-xl border border-gray-200 bg-white/95 shadow-lg backdrop-blur p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">当前站点:</span>
          <select
            value={currentSlug}
            onChange={(e) => switchSite(e.target.value)}
            className="rounded-lg border px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[160px] truncate"
          >
            <option value="">默认站点</option>
            {sites.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name} ({s.slug})
              </option>
            ))}
          </select>
          {currentSlug && (
            <button
              onClick={() => switchSite('')}
              className="text-xs text-gray-400 hover:text-red-500"
              title="切换到默认站点"
            >
              ✕
            </button>
          )}
        </div>
        <p className="mt-1 text-[10px] text-gray-300">已持久化到 localStorage</p>
      </div>
    </div>
  );
}
