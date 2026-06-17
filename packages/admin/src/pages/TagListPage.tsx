import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import type { Tag } from '@zqcms/shared/types';
import toast from 'react-hot-toast';

export function TagListPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<Tag[]>('/tags');
      setTags(data);
    } catch { toast.error('加载失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({ title: '删除标签', message: `确定删除标签「${name}」？`, danger: true });
    if (!ok) return;
    try {
      await fetchAPI(`/tags/${id}`, { method: 'DELETE' });
      toast.success('已删除');
      load();
    } catch { toast.error('删除失败'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">标签管理</h1>
        <button onClick={() => navigate('/tags/new')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />新建标签
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">加载中...</div>
      ) : tags.length === 0 ? (
        <div className="py-12 text-center text-gray-400">暂无标签</div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between border-b last:border-0 px-4 py-3">
              <div>
                <span className="font-medium text-gray-900">{tag.name}</span>
                <span className="ml-2 text-xs text-gray-400">/{tag.slug}</span>
                {tag._count && <span className="ml-2 text-xs text-gray-400">({tag._count.posts} 篇)</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/tags/${tag.id}/edit`)} className="rounded p-1 text-gray-400 hover:text-blue-600">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(tag.id, tag.name)} className="rounded p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
