import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api-client';
import type { Feedback } from '@zqcms/shared/types';
import { MessageSquare, Phone, Mail, Eye, Check, X, Trash2, ExternalLink } from 'lucide-react';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Tooltip } from '@/components/ui/Tooltip';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  reviewed: '已查看',
  resolved: '已解决',
  closed: '已关闭',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

export function FeedbackListPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const confirm = useConfirm();

  const load = async () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', '20');
    if (statusFilter) params.set('status', statusFilter);

    const res = await fetchAPI<{ data: Feedback[]; total: number }>(
      `/feedback?${params.toString()}`,
    ).catch(() => ({ data: [], total: 0 }));
    setItems(res.data);
    setTotal(res.total);
  };

  useEffect(() => {
    load();
  }, [page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (id: number, status: string) => {
    await fetchAPI(`/feedback/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    toast.success('状态已更新');
    load();
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: '确认删除', message: '删除后不可恢复，确定要删除这条反馈吗？' });
    if (!ok) return;
    await fetchAPI(`/feedback/${id}`, { method: 'DELETE' });
    toast.success('已删除');
    load();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户反馈</h1>
          <p className="mt-1 text-sm text-gray-500">共 {total} 条反馈</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="reviewed">已查看</option>
            <option value="resolved">已解决</option>
            <option value="closed">已关闭</option>
          </select>
          <button onClick={load} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            刷新
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <MessageSquare className="mx-auto h-12 w-12 mb-3 text-gray-300" />
          <p>暂无反馈</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                expandedId === item.id ? 'ring-2 ring-blue-200' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                  <div className="mb-2 flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status] || ''}`}>
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                    <span className="font-semibold text-gray-900">{item.name}</span>
                    {item.phone && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {item.phone}
                      </span>
                    )}
                    {item.email && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {item.email}
                      </span>
                    )}
                  </div>

                  <p className={`text-sm text-gray-700 ${expandedId !== item.id ? 'line-clamp-2' : ''}`}>
                    {item.content}
                  </p>

                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                    <span>{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
                    {item.pageUrl && (
                      <a
                        href={item.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        来源页面
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {item.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'reviewed')}
                      className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                      title="标记已查看"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  {item.status !== 'resolved' && item.status !== 'closed' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(item.id, 'resolved')}
                        className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600"
                        title="标记已解决"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.id, 'closed')}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="关闭"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30"
              >
                上一页
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
