import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAPI } from '@/lib/api-client';
import type { Tag } from '@zqcms/shared/types';
import toast from 'react-hot-toast';

export function TagFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchAPI<Tag>(`/tags/${id}`).then((tag) => {
        setName(tag.name);
        setSlug(tag.slug);
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = { name, slug };
    try {
      if (isEdit) {
        await fetchAPI(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(body) });
        toast.success('标签已更新');
      } else {
        await fetchAPI('/tags', { method: 'POST', body: JSON.stringify(body) });
        toast.success('标签已创建');
      }
      navigate('/tags');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? '编辑标签' : '新建标签'}</h1>
        <button onClick={() => navigate('/tags')} className="text-sm text-gray-500">返回列表</button>
      </div>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required
            className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <button type="submit" disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? '保存中...' : isEdit ? '更新标签' : '创建标签'}
        </button>
      </form>
    </div>
  );
}
