import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, Check, X, Send, QrCode } from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Tooltip } from '@/components/ui/Tooltip';
import type { PublishPlatform } from '@zqcms/shared/types';
import toast from 'react-hot-toast';

const PLATFORM_OPTIONS = [
  { value: 'wechat', label: '微信公众号' },
];

interface PlatformForm {
  name: string;
  platform: string;
  appId: string;
  appSecret: string;
  qrcode: string;
  description: string;
  isActive: boolean;
}

const emptyForm = (): PlatformForm => ({
  name: '', platform: 'wechat', appId: '', appSecret: '',
  qrcode: '', description: '', isActive: true,
});

export function PublishPlatformPage() {
  const confirm = useConfirm();
  const [platforms, setPlatforms] = useState<PublishPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PlatformForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<PublishPlatform[]>('/publish/platforms');
      setPlatforms(data || []);
    } catch { toast.error('加载平台列表失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.appId || !form.appSecret) {
      toast.error('请填写必填项');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await fetchAPI(`/publish/platforms/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('平台已更新');
      } else {
        await fetchAPI('/publish/platforms', { method: 'POST', body: JSON.stringify(form) });
        toast.success('平台已添加');
      }
      setShowForm(false);
      setForm(emptyForm());
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally { setSaving(false); }
  };

  const handleEdit = (p: PublishPlatform) => {
    setForm({
      name: p.name, platform: p.platform, appId: p.appId,
      appSecret: p.appSecret, qrcode: p.qrcode || '',
      description: p.description || '', isActive: p.isActive,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({ title: '删除平台', message: `确定删除「${name}」？`, danger: true });
    if (!ok) return;
    try {
      await fetchAPI(`/publish/platforms/${id}`, { method: 'DELETE' });
      toast.success('已删除');
      load();
    } catch { toast.error('删除失败'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">内容平台管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            配置微信公众平台等社交账号，用于文章一键发布
          </p>
        </div>
        <button onClick={() => { setForm(emptyForm()); setEditingId(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />添加平台
        </button>
      </div>

      {/* 平台列表 */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">加载中...</div>
      ) : platforms.length === 0 && !showForm ? (
        <div className="py-12 text-center text-gray-400">
          <Send className="mx-auto h-10 w-10 mb-3 text-gray-300" />
          暂无平台，点击"添加平台"开始
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden mb-6">
          {platforms.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b last:border-0 px-4 py-3">
              <div className="flex items-center gap-3">
                {p.qrcode ? (
                  <img src={p.qrcode} alt={p.name} className="h-10 w-10 rounded-lg object-cover border" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-gray-300" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    {p.isActive && <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-600">启用</span>}
                    <span className="text-xs text-gray-400">{p.platform === 'wechat' ? '微信公众号' : p.platform}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">AppID: {p.appId}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Tooltip content="编辑平台">
                  <button onClick={() => handleEdit(p)} className="rounded p-1 text-gray-400 hover:text-blue-600">
                    <Edit3 className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip content="删除平台">
                  <button onClick={() => handleDelete(p.id, p.name)} className="rounded p-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加/编辑表单 */}
      {showForm && (
        <div className="rounded-xl border bg-white shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {editingId ? '编辑平台' : '添加平台'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">账号名称 *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="block w-full rounded-lg border px-3 py-2 text-sm" placeholder="如：ZQCMS官方公众号" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">平台类型</label>
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="block w-full rounded-lg border px-3 py-2 text-sm">
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AppID *</label>
              <input value={form.appId} onChange={(e) => setForm({ ...form, appId: e.target.value })}
                className="block w-full rounded-lg border px-3 py-2 text-sm" placeholder="wx1234567890abcdef" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AppSecret *</label>
              <input value={form.appSecret} onChange={(e) => setForm({ ...form, appSecret: e.target.value })}
                type="password" className="block w-full rounded-lg border px-3 py-2 text-sm" placeholder="密钥" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">二维码图片 URL</label>
              <input value={form.qrcode} onChange={(e) => setForm({ ...form, qrcode: e.target.value })}
                className="block w-full rounded-lg border px-3 py-2 text-sm" placeholder="https://... 或 /uploads/..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">备注说明</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="block w-full rounded-lg border px-3 py-2 text-sm" placeholder="可选的备注信息" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded" />
                启用此平台
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              <Check className="h-4 w-4" />{saving ? '保存中...' : '保存'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }}
              className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
