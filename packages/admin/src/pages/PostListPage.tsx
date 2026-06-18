import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Edit3, Trash2, CheckSquare, Square, Pin, Star, Eye, EyeOff, Send, Search, Filter, X } from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Post, PaginatedResponse, PublishPlatform, Category } from '@zqcms/shared/types';
import { POST_STATUS_LABELS } from '@zqcms/shared/constants';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

export function PostListPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Filter state (synced with URL) ──
  const keyword = searchParams.get('q') || '';
  const statusFilter = searchParams.get('status') || '';
  const categoryFilter = searchParams.get('categoryId') || '';
  const featuredFilter = searchParams.get('isFeatured') || '';

  const setFilter = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      // Reset page when filter changes
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const hasFilters = keyword || statusFilter || categoryFilter || featuredFilter;

  // ── Data ──
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const page = parseInt(searchParams.get('page') || '1') || 1;
  const pageSize = parseInt(searchParams.get('pageSize') || '20') || 20;
  const pageSizeOptions = [20, 50, 100, 200, 500];
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [publishModal, setPublishModal] = useState<{ postId: number; title: string } | null>(null);
  const [publishPlatforms, setPublishPlatforms] = useState<PublishPlatform[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories
  useEffect(() => {
    fetchAPI<Category[]>('/categories?all=true')
      .then(setCategories)
      .catch(() => {});
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      if (keyword) params.set('search', keyword);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      if (featuredFilter) params.set('isFeatured', featuredFilter);

      const res = await fetchAPI<PaginatedResponse<Post>>(`/posts?${params.toString()}`);
      setPosts(res.data);
      setTotal(res.total);
    } catch {
      toast.error('加载文章列表失败');
    } finally {
      setLoading(false);
    }
  };

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    if (p <= 1) {
      next.delete('page');
    } else {
      next.set('page', String(p));
    }
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    loadPosts();
  }, [page, pageSize, keyword, statusFilter, categoryFilter, featuredFilter]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === posts.length) setSelected(new Set());
    else setSelected(new Set(posts.map((p) => p.id)));
  };

  const batchState = useMemo(() => {
    const selectedPosts = posts.filter((p) => selected.has(p.id));
    if (selectedPosts.length === 0) return { publish: false, pin: false, feature: false };
    return {
      publish: selectedPosts.every((p) => p.status === 'PUBLISHED'),
      pin: selectedPosts.every((p) => p.isPinned),
      feature: selectedPosts.every((p) => p.isFeatured),
    };
  }, [selected, posts]);

  const handleBatchToggle = async (action: string) => {
    if (selected.size === 0) return;
    const labels: Record<string, string> = {
      publish: '上架',
      unpublish: '下架',
      pin: '置顶',
      unpin: '取消置顶',
      feature: '设为精选',
      unfeature: '取消精选',
      delete: '删除',
    };
    const title = `确定批量${labels[action] || action}这 ${selected.size} 篇文章？`;
    const ok = await confirm({ title, danger: action === 'delete' });
    if (!ok) return;
    try {
      await fetchAPI('/posts/batch', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      toast.success('操作成功');
      setSelected(new Set());
      loadPosts();
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id: number, title: string) => {
    const ok = await confirm({ title: '删除文章', message: `确定删除「${title}」？`, danger: true });
    if (!ok) return;
    try {
      await fetchAPI(`/posts/by-id/${id}`, { method: 'DELETE' });
      toast.success('已删除');
      loadPosts();
    } catch {
      toast.error('删除失败');
    }
  };

  const handleOpenPublishModal = async (postId: number, title: string) => {
    try {
      const list = await fetchAPI<PublishPlatform[]>('/publish/platforms');
      setPublishPlatforms((list || []).filter((p) => p.isActive));
      setPublishModal({ postId, title });
    } catch {
      toast.error('加载平台列表失败');
    }
  };

  const handlePublishToPlatform = async (platformId: number) => {
    if (!publishModal) return;
    setPublishing(true);
    try {
      await fetchAPI('/publish/submit', {
        method: 'POST',
        body: JSON.stringify({ postId: publishModal.postId, platformId }),
      });
      toast.success('已提交发布');
      setPublishModal(null);
      loadPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">文章管理</h1>
        <button
          onClick={() => navigate('/posts/new')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新建文章
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        {/* Keyword search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="搜索标题或摘要..."
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

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setFilter('status', e.target.value)}
          className="rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">全部状态</option>
          {Object.entries(POST_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setFilter('categoryId', e.target.value)}
          className="rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">全部分类</option>
          {categories
            .filter((c) => c.isVisible !== false)
            .map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.parentId ? '　├ ' : ''}{cat.name}
              </option>
            ))}
        </select>

        {/* Featured filter */}
        <select
          value={featuredFilter}
          onChange={(e) => setFilter('isFeatured', e.target.value)}
          className="rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">全部精选状态</option>
          <option value="true">已精选</option>
          <option value="false">未精选</option>
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            清除筛选
          </button>
        )}
      </div>

      {/* Bulk actions — compact toggle buttons */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <span className="text-xs font-semibold text-blue-700 shrink-0">{selected.size} 篇</span>

          {/* 上架/下架 toggle */}
          <button
            onClick={() => handleBatchToggle(batchState.publish ? 'unpublish' : 'publish')}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              batchState.publish
                ? 'border-green-400 bg-green-100 text-green-700 hover:bg-green-200'
                : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100'
            }`}
            title={batchState.publish ? '点击全部下架' : '点击全部上架'}
          >
            {batchState.publish ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {batchState.publish ? '已上架' : '下架中'}
          </button>

          {/* 置顶 toggle */}
          <button
            onClick={() => handleBatchToggle(batchState.pin ? 'unpin' : 'pin')}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              batchState.pin
                ? 'border-red-400 bg-red-100 text-red-700 hover:bg-red-200'
                : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100'
            }`}
            title={batchState.pin ? '点击全部取消置顶' : '点击全部置顶'}
          >
            <Pin className={`h-3 w-3 ${batchState.pin ? 'fill-red-500' : ''}`} />
            {batchState.pin ? '已置顶' : '未置顶'}
          </button>

          {/* 精选 toggle */}
          <button
            onClick={() => handleBatchToggle(batchState.feature ? 'unfeature' : 'feature')}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              batchState.feature
                ? 'border-amber-400 bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100'
            }`}
            title={batchState.feature ? '点击全部取消精选' : '点击全部设为精选'}
          >
            <Star className={`h-3 w-3 ${batchState.feature ? 'fill-amber-500' : ''}`} />
            {batchState.feature ? '已精选' : '未精选'}
          </button>

          <div className="flex-1" />

          <button
            onClick={() => handleBatchToggle('delete')}
            className="flex items-center gap-1 rounded-full border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3 w-3" />删除
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-full px-2.5 py-1 text-xs text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
          >
            取消
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-400">加载中...</div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          {hasFilters ? '没有匹配的文章' : '暂无文章'}
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 w-8">
                  <Tooltip content={selected.size === posts.length ? '取消全选' : '全选'}>
                    <button onClick={toggleAll} className="text-gray-300 hover:text-blue-500">
                      {selected.size === posts.length ? (
                        <CheckSquare className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </Tooltip>
                </th>
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">分类</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">状态</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">更新时间</th>
                <th className="px-4 py-3 font-medium w-24">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className={`hover:bg-gray-50 ${selected.has(post.id) ? 'bg-blue-50/50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <Tooltip content={selected.has(post.id) ? '取消选择' : '选择'}>
                      <button onClick={() => toggleSelect(post.id)} className="text-gray-300 hover:text-blue-500">
                        {selected.has(post.id) ? (
                          <CheckSquare className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/posts/${post.id}/edit`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {post.title}
                        </Link>
                        {post.isPinned && (
                          <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                            置顶
                          </span>
                        )}
                        {post.isFeatured && (
                          <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                            精选
                          </span>
                        )}
                      </div>
                      {post.excerpt && (
                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{post.excerpt}</p>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {post.tags.map((t: any) => {
                            const tag = t?.tag || t;
                            return tag?.name ? (
                              <span
                                key={tag.id || tag.name}
                                className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500"
                              >
                                {tag.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {post.category?.name || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                        post.status === 'PUBLISHED'
                          ? 'bg-green-50 text-green-700'
                          : post.status === 'DRAFT'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {POST_STATUS_LABELS[post.status] || post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(post.updatedAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Tooltip content="编辑文章">
                        <button
                          onClick={() => navigate(`/posts/${post.id}/edit`)}
                          className="rounded p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="发布到平台">
                        <button
                          onClick={() => handleOpenPublishModal(post.id, post.title)}
                          className="rounded p-1 text-gray-400 hover:text-green-600"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="删除文章">
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="rounded p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm text-gray-500">
            共 {total} 篇文章
            {hasFilters && <span className="text-gray-400">（已筛选）</span>}
          </span>
          <div className="flex items-center gap-3">
            {/* Page size selector */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <span>每页</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const next = new URLSearchParams(searchParams);
                  next.set('pageSize', e.target.value);
                  next.delete('page');
                  setSearchParams(next, { replace: true });
                }}
                className="rounded border border-gray-200 py-1 pl-2 pr-6 text-sm focus:border-blue-400 focus:outline-none"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>{n}</option>
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

      {/* 发布到平台弹窗 */}
      {publishModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setPublishModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-900">发布到平台</h3>
              <p className="text-sm text-gray-500 mt-0.5 truncate">{publishModal.title}</p>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {publishPlatforms.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  暂无可用平台，请先在"内容平台"中添加并启用
                </p>
              ) : (
                publishPlatforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePublishToPlatform(p.id)}
                    disabled={publishing}
                    className="flex items-center gap-3 w-full rounded-lg border px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {p.qrcode ? (
                      <img
                        src={p.qrcode}
                        alt={p.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Send className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400">
                        {p.platform === 'wechat' ? '微信公众号' : p.platform}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="px-5 py-3 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setPublishModal(null)}
                className="w-full rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-white"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
