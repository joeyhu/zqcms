import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Lock, Copy } from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { CardPreview } from '@/components/builder/CardPreview';
import type { CardTemplate } from '@zqcms/shared/types';
import toast from 'react-hot-toast';

export function CardTemplateListPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setTemplates(await fetchAPI<CardTemplate[]>('/card-templates')); }
    catch { toast.error('加载失败'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({ title: '删除卡片模板', message: `确定删除「${name}」？`, danger: true });
    if (!ok) return;
    try { await fetchAPI(`/card-templates/${id}`, { method: 'DELETE' }); toast.success('已删除'); load(); }
    catch { toast.error('删除失败'); }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await fetchAPI(`/card-templates/${id}/duplicate`, { method: 'POST' });
      toast.success('已复制'); load();
    } catch { toast.error('复制失败'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">卡片管理</h1>
          <p className="mt-1 text-sm text-gray-400">每个卡片直接呈现其真实样式效果</p>
        </div>
        <button onClick={() => navigate('/cards/new')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />新建卡片
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">加载中...</div>
      ) : templates.length === 0 ? (
        <div className="py-12 text-center text-gray-400">暂无卡片模板，点击右上角新建</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="group relative rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* System preset badge */}
              {t.isPreset && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  <Lock className="h-3 w-3" /> 预设
                </div>
              )}

              {/* Card preview — shows actual card style, click to edit */}
              <div className="mb-3 cursor-pointer" onClick={() => navigate(`/cards/${t.id}/edit`)}>
                <CardPreview
                  config={t.config || {}}
                  sampleData={{
                    primaryText: t.name,
                    secondaryText: t.description || '卡片模板示例描述文字',
                    tagItems: t.isPreset ? ['预设'] : ['自定义'],
                  }}
                />
              </div>

              {/* Hover actions on bottom */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-600 truncate">{t.name}</p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/cards/${t.id}/edit`); }}
                    className="rounded p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    title="编辑"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDuplicate(t.id); }}
                    className="rounded p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50"
                    title="复制"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {!t.isPreset && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.name); }}
                      className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
