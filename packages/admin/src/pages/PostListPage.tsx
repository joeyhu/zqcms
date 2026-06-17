import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, GripVertical } from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';
import type { Post, PaginatedResponse } from '@zqcms/shared/types';
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

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI<PaginatedResponse<Post>>(`/posts?page=${page}&pageSize=20`);
      setPosts(res.data);
      setTotal(res.total);
    } catch (err) {
      toast.error('加载文章列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, [page]);

  const handleDelete = async (id: number, title: string) => {
    const ok = await confirm({ title: '删除文章', message: `确定删除文章「${title}」？`, danger: true });
    if (!ok) return;
    try {
      await fetchAPI(`/posts/by-id/${id}`, { method: 'DELETE' });
      toast.success('已删除');
      loadPosts();
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">文章管理</h1>
        <button
          onClick={() => navigate('/posts/new')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />新建文章
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">加载中...</div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center text-gray-400">暂无文章，点击右上角新建</div>
      ) : (
        <>
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium w-8"><GripVertical className="h-4 w-4" /></th>
                  <th className="px-4 py-3 font-medium">标题</th>
                  <th className="px-4 py-3 font-medium">分类</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">更新时间</th>
                  <th className="px-4 py-3 font-medium w-24">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-300 cursor-grab">
                      <GripVertical className="h-4 w-4" />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link to={`/posts/${post.id}/edit`} className="hover:text-blue-600">
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{post.category?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        post.status === 'PUBLISHED' ? 'bg-green-50 text-green-700'
                        : post.status === 'DRAFT' ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-gray-50 text-gray-500'
                      }`}>
                        {POST_STATUS_LABELS[post.status] || post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(post.updatedAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/posts/${post.id}/edit`)} className="rounded p-1 text-gray-400 hover:text-blue-600">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(post.id, post.title)} className="rounded p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">共 {total} 篇文章</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm text-gray-500">{page} / {Math.ceil(total / 20)}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * 20 >= total}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
