import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAPI } from '@/lib/api-client';
import type { BlockTemplate, CardTemplate } from '@zqcms/shared/types';
import toast from 'react-hot-toast';

const SOURCE_OPTIONS = [
  { value: 'subcategories', label: '子目录列表 - 所在页面目录的子目录' },
  { value: 'articles', label: '文章列表 - 所在页面目录的文章' },
  { value: 'tags', label: '标签列表 - 所在页面目录的文章标签' },
  { value: 'all_categories', label: '全部目录列表' },
  { value: 'all_articles', label: '全部文章列表' },
];

export function BlockTemplateFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cardTemplateId, setCardTemplateId] = useState<number | null>(null);
  const [contentSource, setContentSource] = useState('articles');
  const [columns, setColumns] = useState({ desktop: 3, tablet: 2, mobile: 1 });
  const [saving, setSaving] = useState(false);
  const [cardTemplates, setCardTemplates] = useState<CardTemplate[]>([]);

  useEffect(() => {
    fetchAPI<CardTemplate[]>('/card-templates').then(setCardTemplates).catch(() => {});
    if (isEdit) {
      fetchAPI<BlockTemplate>(`/block-templates/${id}`).then((t) => {
        setName(t.name); setDescription(t.description || '');
        setCardTemplateId(t.cardTemplateId);
        setContentSource(t.contentSource);
        setColumns(t.columns);
      });
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    const body = { name, description: description || null, cardTemplateId, contentSource, columns };
    try {
      if (isEdit) await fetchAPI(`/block-templates/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      else await fetchAPI('/block-templates', { method: 'POST', body: JSON.stringify(body) });
      toast.success(isEdit ? '已更新' : '已创建');
      navigate('/blocks');
    } catch (err) { toast.error(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? '编辑区块' : '新建区块'}</h1>
        <button onClick={() => navigate('/blocks')} className="text-sm text-gray-500">返回列表</button>
      </div>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">基本信息</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 outline-none" />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">📋 选择卡片模板</h2>
          <p className="text-sm text-gray-400 -mt-1">卡片定义了区块的视觉样式</p>
          <select value={cardTemplateId || ''} onChange={(e) => setCardTemplateId(e.target.value ? Number(e.target.value) : null)}
            className="block w-full rounded-lg border px-3 py-2 text-sm">
            <option value="">无（使用默认样式）</option>
            {cardTemplates.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.name}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">📊 内容来源</h2>
          <p className="text-sm text-gray-400 -mt-1">区块显示什么数据</p>
          <div className="space-y-2">
            {SOURCE_OPTIONS.map((opt) => (
              <label key={opt.value} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                contentSource === opt.value ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="radio" name="contentSource" value={opt.value} checked={contentSource === opt.value}
                  onChange={(e) => setContentSource(e.target.value)} className="mt-1" />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">📐 响应式列数</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">🖥 桌面</label>
              <select value={columns.desktop} onChange={(e) => setColumns((c) => ({ ...c, desktop: Number(e.target.value) }))}
                className="block w-full rounded-lg border px-3 py-2 text-sm">
                {[1,2,3,4,5,6].map(n => (<option key={n} value={n}>{n} 列</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">📱 平板</label>
              <select value={columns.tablet} onChange={(e) => setColumns((c) => ({ ...c, tablet: Number(e.target.value) }))}
                className="block w-full rounded-lg border px-3 py-2 text-sm">
                {[1,2,3,4].map(n => (<option key={n} value={n}>{n} 列</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">📱 手机</label>
              <select value={columns.mobile} onChange={(e) => setColumns((c) => ({ ...c, mobile: Number(e.target.value) }))}
                className="block w-full rounded-lg border px-3 py-2 text-sm">
                {[1,2].map(n => (<option key={n} value={n}>{n} 列</option>))}
              </select>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? '保存中...' : isEdit ? '更新区块' : '创建区块'}
        </button>
      </form>
    </div>
  );
}
