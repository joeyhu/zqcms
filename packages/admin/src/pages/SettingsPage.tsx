import { useEffect, useState, FormEvent } from 'react';
import { fetchAPI } from '@/lib/api-client';
import type { SiteSettings } from '@zqcms/shared/types';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAPI<SiteSettings>('/site').then((data) => {
      setSettings(data);
      setForm({
        siteName: data.siteName,
        siteDescription: data.siteDescription || '',
        primaryColor: data.primaryColor,
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        address: data.address || '',
        logo: data.logo || '',
        favicon: data.favicon || '',
        footerText: data.footerText || '',
        copyright: data.copyright || '',
        gaId: data.gaId || '',
      });
      setLoading(false);
    });
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(form)) {
      body[key] = value || null;
    }

    try {
      await fetchAPI('/site', { method: 'PUT', body: JSON.stringify(body) });
      toast.success('配置已保存');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-gray-400">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">站点配置</h1>
        <button onClick={handleSubmit} disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>

      <form className="max-w-2xl space-y-6">
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">基本信息</h2>

          {/* 站点描述 — 独占一行，用 textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">站点描述</label>
            <textarea
              value={form['siteDescription'] || ''}
              onChange={(e) => handleChange('siteDescription', e.target.value)}
              rows={3}
              className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
              placeholder="简要描述站点内容，用于 SEO 和首页展示"
            />
          </div>

          {/* 其余基本字段 */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['siteName', '站点名称'],
              ['primaryColor', '主题色'],
              ['contactEmail', '联系邮箱'],
              ['contactPhone', '联系电话'],
              ['address', '地址'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input value={form[key] || ''} onChange={(e) => handleChange(key, e.target.value)}
                  className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">品牌资源</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['logo', 'Logo URL'],
              ['favicon', 'Favicon URL'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input value={form[key] || ''} onChange={(e) => handleChange(key, e.target.value)}
                  className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">页脚设置</h2>
          <div className="space-y-4">
            {[
              ['footerText', '页脚文案'],
              ['copyright', '版权信息'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input value={form[key] || ''} onChange={(e) => handleChange(key, e.target.value)}
                  className="block w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">分析</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
            <input value={form['gaId'] || ''} onChange={(e) => handleChange('gaId', e.target.value)}
              className="block w-full rounded-lg border px-3 py-2 text-sm" placeholder="G-XXXXXXXXXX" />
          </div>
        </div>
      </form>
    </div>
  );
}
