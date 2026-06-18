import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAPI } from '@/lib/api-client';
import toast from 'react-hot-toast';

export function SiteFormPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    name: '', slug: '', domain: '', description: '',
    primaryColor: '#3B82F6', contactEmail: '', contactPhone: '', address: '',
    logo: '', favicon: '', footerText: '', copyright: '', gaId: '', icp: '',
  });

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
      await fetchAPI('/sites', { method: 'POST', body: JSON.stringify(body) });
      toast.success('站点已创建');
      navigate('/sites');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const inputFields = (fields: [string, string][]) =>
    fields.map(([key, label]) => (
      <div key={key}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          value={form[key] || ''} onChange={(e) => handleChange(key, e.target.value)}
          required={['name', 'slug', 'domain'].includes(key)}
          className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder={key === 'domain' ? 'example.com' : ''}
        />
      </div>
    ));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">新建站点</h1>
        <button onClick={() => navigate('/sites')} className="text-sm text-gray-500">返回列表</button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="font-semibold text-lg">基本信息</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {inputFields([['name', '站点名称'], ['slug', '标识 (slug)'], ['domain', '绑定域名']])}
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

        <button type="submit" disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? '创建中...' : '创建站点'}
        </button>
      </form>
    </div>
  );
}
