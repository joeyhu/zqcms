import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Edit3, Trash2, Search, X } from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Tag, PaginatedResponse } from '@zqcms/shared/types';
import toast from 'react-hot-toast';

export function TagListPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Filter state ──
  const keyword = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1') || 1;
  const pageSize = parseInt(searchParams.get('pageSize') || '20') || 20;
  const pageSizeOptions = [20, 50, 100, 200, 500];

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setFilter = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    if (p <= 1) {
      next.delete('page');
    } else {
      next.set('page', String(p));
    }
    setSearchParams(next, { replace: true });
  };

  const setPageSize = (n: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('pageSize', String(n));
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  // ── Data ──
  const [tags, setTags] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // For backend that returns plain array
  const [allTags, setAllTags] = useState<Tag[] | null>(null);

  // Try to load paginated first, fall back to all tags + client filter
  const load = useCallback(async () => {
    setLoading(true);
    try {
      // First try paginated API
      if (keyword || page > 1 || pageSize !== 20) {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        if (keyword) params.set('search', keyword);

        const res = await fetchAPI<PaginatedResponse<Tag>>(`/tags?${params.toString()}`);
        if (res && 'data' in res && 'total' in res) {
          setTags(res.data);
          setTotal(res.total);
          setAllTags(null);
          return;
        }
      }

      // Fallback: load all and filter client-side
      if (!allTags) {
        setAllTags(await fetchAPI<Tag[]>('/tags'));
      }
    } catch (err: any) {
      // If paginated fails, try plain array
      if (!allTags) {
        try {
          setAllTags(await fetchAPI<Tag[]>('/tags'));
        } catch {
          toast.error('加载失败');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [keyword, page, pageSize, allTags]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword, page, pageSize]);

  // Client-side filter when using allTags fallback
  useEffect(() => {
    if (!allTags) return;
    let filtered = allTags;
    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = allTags.filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.slug.toLowerCase().includes(lower),
      );
    }
    setTotal(filtered.length);
    const start = (page - 1) * pageSize;
    setTags(filtered.slice(start, start + pageSize));
  }, [allTags, keyword, page, pageSize]);

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({
      title: '删除标签',
      message: `确定删除标签「${name}」？`,
      danger: true,
    });
    if (!ok) return;
    try {
      await fetchAPI(`/tags/${id}`, { method: 'DELETE' });
      toast.success('已删除');
      setAllTags(null);
      load();
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">标签管理</h1>
        <button
          onClick={() => navigate('/tags/new')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />新建标签
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="搜索标签名称..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          {keyword && (
            <button
              onClick={() => setFilter('q', '')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {keyword && (
          <span className="text-xs text-gray-400">
            找到 {total} 个匹配标签
          </span>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">加载中...</div>
      ) : tags.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          {keyword ? '没有匹配的标签' : '暂无标签'}
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between border-b last:border-0 px-4 py-3"
            >
              <div>
                <span className="font-medium text-gray-900">{tag.name}</span>
                <span className="ml-2 text-xs text-gray-400">/{tag.slug}</span>
                {tag._count && (
                  <span className="ml-2 text-xs text-gray-400">
                    ({tag._count.posts} 篇)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Tooltip content="编辑标签">
                  <button
                    onClick={() => navigate(`/tags/${tag.id}/edit`)}
                    className="rounded p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip content="删除标签">
                  <button
                    onClick={() => handleDelete(tag.id, tag.name)}
                    className="rounded p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm text-gray-500">
            共 {total} 个标签
            {keyword && <span className="text-gray-400">（已筛选）</span>}
          </span>
          <div className="flex items-center gap-3">
            {/* Page size selector */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <span>每页</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded border border-gray-200 py-1 pl-2 pr-6 text-sm focus:border-blue-400 focus:outline-none"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>条</span>
            </div>

            {total > pageSize && (
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm text-gray-500">
                  {page} / {Math.ceil(total / pageSize)}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize >= total}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
