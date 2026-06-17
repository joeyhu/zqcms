import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, CheckSquare, Square, Pin, Star, Eye, EyeOff, Send } from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Post, PaginatedResponse, PublishPlatform } from '@zqcms/shared/types';
import { POST_STATUS_LABELS } from '@zqcms/shared/constants';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

export function PostListPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [publishModal, setPublishModal] = useState<{ postId: number; title: string } | null>(null);
  const [publishPlatforms, setPublishPlatforms] = useState<PublishPlatform[]>([]);
  const [publishing, setPublishing] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI<PaginatedResponse<Post>>(`/posts?page=${page}&pageSize=20`);
      setPosts(res.data);
      setTotal(res.total);
    } catch { toast.error('加载文章列表失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPosts(); }, [page]);

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

  // 根据选中文章计算各开关的聚合状态
  const batchState = useMemo(() => {
    const selectedPosts = posts.filter((p) => selected.has(p.id));
    if (selectedPosts.length === 0) return { publish: false, pin: false, feature: false };
    return {
      publish: selectedPosts.every((p) => p.status === 'PUBLISHED'),
      pin:     selectedPosts.every((p) => p.isPinned),
      feature: selectedPosts.every((p) => p.isFeatured),
    };
  }, [selected, posts]);

  // 带 toggle 状态的批量操作
  const handleBatchToggle = async (action: string) => {
    if (selected.size === 0) return;
    const labels: Record<string, string> = {
      publish: '上架', unpublish: '下架',
      pin: '置顶', unpin: '取消置顶',
      feature: '设为精选', unfeature: '取消精选',
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
    } catch { toast.error('操作失败'); }
  };

  const handleDelete = async (id: number, title: string) => {
    const ok = await confirm({ title: '删除文章', message: `确定删除「${title}」？`, danger: true });
    if (!ok) return;
    try { await fetchAPI(`/posts/by-id/${id}`, { method: 'DELETE' }); toast.success('已删除'); loadPosts(); }
    catch { toast.error('删除失败'); }
  };

  const handleOpenPublishModal = async (postId: number, title: string) => {
    try {
      const list = await fetchAPI<PublishPlatform[]>('/publish/platforms');
      setPublishPlatforms((list || []).filter((p) => p.isActive));
      setPublishModal({ postId, title });
    } catch { toast.error('加载平台列表失败'); }
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
    } finally { setPublishing(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">文章管理</h1>
        <button onClick={() => navigate('/posts/new')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />新建文章
        </button>
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

          <button onClick={() => handleBatchToggle('delete')}
            className="flex items-center gap-1 rounded-full border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="h-3 w-3" />删除
          </button>
          <button onClick={() => setSelected(new Set())}
            className="rounded-full px-2.5 py-1 text-xs text-gray-400 hover:bg-white hover:text-gray-600 transition-colors">
            取消
          </button>
        </div>
      )}

      {loading ? <div className="py-12 text-center text-gray-400">加载中...</div> :
       posts.length === 0 ? <div className="py-12 text-center text-gray-400">暂无文章</div> : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 w-8">
                  <button onClick={toggleAll} className="text-gray-300 hover:text-blue-500">
                    {selected.size === posts.length ? <CheckSquare className="h-4 w-4 text-blue-500" /> : <Square className="h-4 w-4" />}
                  </button>
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
                <tr key={post.id} className={`hover:bg-gray-50 ${selected.has(post.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(post.id)} className="text-gray-300 hover:text-blue-500">
                      {selected.has(post.id) ? <CheckSquare className="h-4 w-4 text-blue-500" /> : <Square className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link to={`/posts/${post.id}/edit`} className="font-medium text-gray-900 hover:text-blue-600">{post.title}</Link>
                        {post.isPinned && <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">置顶</span>}
                        {post.isFeatured && <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">精选</span>}
                      </div>
                      {post.excerpt && (
                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{post.excerpt}</p>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {post.tags.map((t: any) => {
                            const tag = t?.tag || t;
                            return tag?.name ? (
                              <span key={tag.id || tag.name} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{tag.name}</span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{post.category?.name || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                      post.status === 'PUBLISHED' ? 'bg-green-50 text-green-700'
                      : post.status === 'DRAFT' ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-gray-50 text-gray-500'
                    }`}>{POST_STATUS_LABELS[post.status] || post.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(post.updatedAt).toLocaleDateString('zh-CN')}</td>
                   <td className="px-4 py-3">
                     <div className="flex gap-2">
                       <Tooltip content="编辑文章"><button onClick={() => navigate(`/posts/${post.id}/edit`)} className="rounded p-1 text-gray-400 hover:text-blue-600"><Edit3 className="h-4 w-4" /></button></Tooltip>
                       <Tooltip content="发布到平台"><button onClick={() => handleOpenPublishModal(post.id, post.title)} className="rounded p-1 text-gray-400 hover:text-green-600"><Send className="h-4 w-4" /></button></Tooltip>
                       <Tooltip content="删除文章"><button onClick={() => handleDelete(post.id, post.title)} className="rounded p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></Tooltip>
                     </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">共 {total} 篇文章</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50">上一页</button>
            <span className="px-3 py-1 text-sm text-gray-500">{page} / {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage(page + 1)} disabled={page * 20 >= total}
              className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50">下一页</button>
          </div>
        </div>
      )}

      {/* 发布到平台弹窗 */}
      {publishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setPublishModal(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
                      <img src={p.qrcode} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Send className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.platform === 'wechat' ? '微信公众号' : p.platform}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="px-5 py-3 border-t bg-gray-50 rounded-b-xl">
              <button onClick={() => setPublishModal(null)}
                className="w-full rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-white">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
