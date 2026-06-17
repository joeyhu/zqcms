import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAPI } from '@/lib/api-client';
import type { SiteSettings } from '@zqcms/shared/types';
import toast from 'react-hot-toast';

export function SiteFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    name: '', slug: '', domain: '', description: '', primaryColor: '#3B82F6',
    contactEmail: '', contactPhone: '', address: '',
    logo: '', favicon: '', footerText: '', copyright: '', gaId: '', icp: '',
  });

  useEffect(() => {
    if (isEdit) {
      fetchAPI<Record<string, unknown>>(`/sites/${id}`).then((data) => {
        setForm((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(prev)) {
            next[key] = String(data[key] ?? '');
          }
          return next;
        });
      });
    }
  }, [id, isEdit]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      body[k] = v || null;
    }

    try {
      if (isEdit) {
        await fetchAPI(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(body) });
        toast.success('站点已更新');
      } else {
        await fetchAPI('/sites', { method: 'POST', body: JSON.stringify(body) });
        toast.success('站点已创建');
      }
      navigate('/sites');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? '编辑站点' : '新建站点'}</h1>
        <button onClick={() => navigate('/sites')} className="text-sm text-gray-500">返回列表</button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">基本信息</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ['name', '站点名称'],
              ['slug', '标识 (slug)'],
              ['domain', '绑定域名'],
            ] as [string, string][]).map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  value={form[key] || ''} onChange={(e) => handleChange(key, e.target.value)}
                  required
                  className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder={key === 'domain' ? 'example.com' : ''}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">站点描述</label>
            <textarea
              value={form['description'] || ''} onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">品牌与联系</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['primaryColor', '主题色'],
              ['contactEmail', '联系邮箱'],
              ['contactPhone', '联系电话'],
              ['address', '地址'],
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
          <h2 className="font-semibold text-lg">页脚与分析</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[['footerText', '页脚文案'], ['copyright', '版权信息'], ['gaId', 'Google Analytics ID'], ['icp', 'ICP 备案号']]
              .map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input value={form[key] || ''} onChange={(e) => handleChange(key, e.target.value)}
                    className="block w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              ))}
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? '保存中...' : isEdit ? '更新站点' : '创建站点'}
        </button>
      </form>
    </div>
  );
}
