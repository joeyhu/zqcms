import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Lock, Copy, Layout } from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import type { BlockTemplate } from '@zqcms/shared/types';
import toast from 'react-hot-toast';

const SOURCE_LABELS: Record<string, string> = {
  subcategories: '子目录列表', articles: '文章列表', tags: '标签列表',
  all_categories: '全部目录', all_articles: '全部文章',
};

export function BlockTemplateListPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [templates, setTemplates] = useState<BlockTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setTemplates(await fetchAPI<BlockTemplate[]>('/block-templates')); }
    catch { toast.error('加载失败'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({ title: '删除区块模板', message: `确定删除「${name}」？`, danger: true });
    if (!ok) return;
    try { await fetchAPI(`/block-templates/${id}`, { method: 'DELETE' }); toast.success('已删除'); load(); }
    catch { toast.error('删除失败'); }
  };

  const handleDuplicate = async (id: number) => {
    try { await fetchAPI(`/block-templates/${id}/duplicate`, { method: 'POST' }); toast.success('已复制'); load(); }
    catch { toast.error('复制失败'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">区块管理</h1>
          <p className="mt-1 text-sm text-gray-400">预定义区块，可引用卡片模板作为展示样式</p>
        </div>
        <button onClick={() => navigate('/blocks/new')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />新建区块
        </button>
      </div>

      {loading ? <div className="py-12 text-center text-gray-400">加载中...</div> :
       templates.length === 0 ? <div className="py-12 text-center text-gray-400">暂无区块模板</div> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="group relative rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              {t.isPreset && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  <Lock className="h-3 w-3" /> 预设
                </div>
              )}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                  <Layout className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{t.name}</h3>
                  {t.description && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{t.description}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">
                  {SOURCE_LABELS[t.contentSource] || t.contentSource}
                </span>
                {t.cardTemplate && (
                  <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] text-purple-600">
                    卡片: {t.cardTemplate.name}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-[10px] text-gray-400">
                  🖥{t.columns.desktop} 📱{t.columns.tablet} 📱{t.columns.mobile} 列
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/blocks/${t.id}/edit`); }}
                    className="rounded p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="编辑">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDuplicate(t.id); }}
                    className="rounded p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50" title="复制">
                    <Copy className="h-4 w-4" />
                  </button>
                  {!t.isPreset && (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.name); }}
                      className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50" title="删除">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => navigate(`/blocks/${t.id}/edit`)}
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity cursor-pointer" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
