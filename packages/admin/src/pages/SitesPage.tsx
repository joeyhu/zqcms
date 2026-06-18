import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Globe, CheckCircle2 } from 'lucide-react';
import { fetchAPI, setCurrentSiteId, getCurrentSiteId } from '@/lib/api-client';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Tooltip } from '@/components/ui/Tooltip';
import toast from 'react-hot-toast';

interface SiteItem {
  id: number;
  name: string;
  slug: string;
  domain: string;
  isActive: boolean;
  isDefault: boolean;
  _count: { posts: number; categories: number };
}

export function SitesPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSiteId, setCurrent] = useState<number | null>(getCurrentSiteId());

  const loadSites = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<SiteItem[]>('/sites');
      setSites(data);
    } catch {
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSites(); }, []);

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({ title: '删除站点', message: `确定删除站点「${name}」？所有文章、分类、媒体将被永久删除！`, danger: true, confirmText: '永久删除' });
    if (!ok) return;
    try {
      await fetchAPI(`/sites/${id}`, { method: 'DELETE' });
      toast.success('已删除');
      loadSites();
    } catch {
      toast.error('删除失败');
    }
  };

  const handleSwitch = (site: SiteItem) => {
    setCurrentSiteId(site.id);
    setCurrent(site.id);
    toast.success(`已切换到「${site.name}」`);
  };

  if (loading) return <div className="py-12 text-center text-gray-400">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">站点管理</h1>
        <button
          onClick={() => navigate('/sites/new')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />新建站点
        </button>
      </div>

      {sites.length === 0 ? (
        <div className="py-12 text-center text-gray-400">暂无站点</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => {
            const isCurrent = site.id === currentSiteId;

            return (
            <div
              key={site.id}
              className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                isCurrent
                  ? 'ring-2 ring-blue-500 border-blue-300 shadow-blue-100'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-900">{site.name}</h3>
                    {isCurrent && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <Globe className="h-3 w-3" />
                    {site.domain}
                  </div>
                </div>
                <div className="flex gap-1">
                  {site.isDefault && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">默认</span>
                  )}
                  {!site.isActive && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">已停用</span>
                  )}
                </div>
              </div>

              <div className="flex gap-4 text-sm text-gray-500 mb-4">
                <span>{site._count.posts} 文章</span>
                <span>{site._count.categories} 分类</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSwitch(site)}
                  className="flex-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  切换管理
                </button>
                <Tooltip content="删除站点">
                  <button
                    onClick={() => handleDelete(site.id, site.name)}
                    className="rounded-lg border px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
