import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, Check, X, Star, Zap, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Tooltip } from '@/components/ui/Tooltip';
import type { LlmConfig } from '@zqcms/shared/types';
import toast from 'react-hot-toast';

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'qwen', label: '通义千问' },
  { value: 'custom', label: '自定义' },
];

const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; model: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  qwen: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-max' },
  custom: { baseUrl: '', model: '' },
};

interface LlmForm {
  name: string;
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  isActive: boolean;
}

const emptyForm = (): LlmForm => ({
  name: '', provider: 'deepseek', apiKey: '', baseUrl: PROVIDER_DEFAULTS.deepseek.baseUrl,
  model: PROVIDER_DEFAULTS.deepseek.model, isActive: true,
});

export function LlmConfigPage() {
  const confirm = useConfirm();
  const [configs, setConfigs] = useState<LlmConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<LlmForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [modelList, setModelList] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<LlmConfig[]>('/llm/configs');
      setConfigs(data || []);
    } catch { toast.error('加载 LLM 配置失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleProviderChange = (provider: string) => {
    const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.custom;
    setForm((prev) => ({ ...prev, provider, baseUrl: defaults.baseUrl, model: defaults.model }));
    setModelList([]); // 切换提供商时清除模型列表
  };

  const handleFetchModels = async () => {
    if (!form.baseUrl || !form.apiKey) {
      toast.error('请先填写 API 端点和 API Key');
      return;
    }
    setFetchingModels(true);
    setModelList([]);
    try {
      const res = await fetchAPI<{ success: boolean; models: string[] }>('/llm/fetch-models', {
        method: 'POST',
        body: JSON.stringify({ baseUrl: form.baseUrl, apiKey: form.apiKey }),
      });
      if (res.models && res.models.length > 0) {
        setModelList(res.models);
        toast.success(`获取到 ${res.models.length} 个模型`);
        // 如果当前模型不在列表中，自动选第一个
        if (!res.models.includes(form.model) && res.models.length > 0) {
          setForm((prev) => ({ ...prev, model: res.models[0] }));
        }
      } else {
        toast.error('未获取到模型列表');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '获取模型列表失败');
    } finally {
      setFetchingModels(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.apiKey || !form.baseUrl || !form.model) {
      toast.error('请填写完整信息');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await fetchAPI(`/llm/configs/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('配置已更新');
      } else {
        await fetchAPI('/llm/configs', { method: 'POST', body: JSON.stringify(form) });
        toast.success('配置已添加');
      }
      setShowForm(false);
      setForm(emptyForm());
      setEditingId(null);
      setModelList([]);
      setShowApiKey(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally { setSaving(false); }
  };

  const handleEdit = (cfg: LlmConfig) => {
    setForm({
      name: cfg.name, provider: cfg.provider, apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl, model: cfg.model, isActive: cfg.isActive,
    });
    setEditingId(cfg.id);
    setShowApiKey(false);
    setShowForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({ title: '删除 LLM 配置', message: `确定删除配置「${name}」？`, danger: true });
    if (!ok) return;
    try {
      await fetchAPI(`/llm/configs/${id}`, { method: 'DELETE' });
      toast.success('已删除');
      load();
    } catch { toast.error('删除失败'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LLM 配置</h1>
          <p className="text-sm text-gray-500 mt-1">
            配置 OpenAI 兼容的 LLM 模型，用于 AI 辅助写作、标签提取和自动分类
          </p>
        </div>
        <button onClick={() => { setForm(emptyForm()); setEditingId(null); setModelList([]); setShowApiKey(false); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />添加配置
        </button>
      </div>

      {/* 配置列表 */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">加载中...</div>
      ) : configs.length === 0 && !showForm ? (
        <div className="py-12 text-center text-gray-400">
          <Zap className="mx-auto h-10 w-10 mb-3 text-gray-300" />
          暂无 LLM 配置，点击"添加配置"开始
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden mb-6">
          {configs.map((cfg) => (
            <div key={cfg.id} className="flex items-center justify-between border-b last:border-0 px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{cfg.name}</span>
                  {cfg.isActive && <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-600">启用中</span>}
                  <span className="text-xs text-gray-400">{cfg.provider}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{cfg.model} · {cfg.baseUrl}</div>
              </div>
              <div className="flex gap-2">
                <Tooltip content="编辑">
                  <button onClick={() => handleEdit(cfg)} className="rounded p-1 text-gray-400 hover:text-blue-600">
                    <Edit3 className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip content="删除">
                  <button onClick={() => handleDelete(cfg.id, cfg.name)} className="rounded p-1 text-gray-400 hover:text-red-600">
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
            {editingId ? '编辑 LLM 配置' : '添加 LLM 配置'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">配置名称</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="block w-full rounded-lg border px-3 py-2 text-sm" placeholder="如：DeepSeek V3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">提供商</label>
              <select value={form.provider} onChange={(e) => handleProviderChange(e.target.value)}
                className="block w-full rounded-lg border px-3 py-2 text-sm">
                {PROVIDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <div className="flex gap-1">
                <input
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  type={showApiKey ? 'text' : 'password'}
                  className="block w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="sk-..."
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="shrink-0 rounded-lg border px-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  title={showApiKey ? '隐藏 API Key' : '显示 API Key'}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">API 端点</label>
              <input value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                className="block w-full rounded-lg border px-3 py-2 text-sm" placeholder="https://api.deepseek.com/v1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
              <div className="flex gap-2">
                {modelList.length > 0 ? (
                  <select
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="block w-full rounded-lg border px-3 py-2 text-sm flex-1"
                  >
                    {modelList.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="block w-full rounded-lg border px-3 py-2 text-sm flex-1"
                    placeholder="deepseek-chat"
                  />
                )}
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={fetchingModels || !form.baseUrl || !form.apiKey}
                  title="从 API 获取可用模型列表"
                  className="shrink-0 flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium text-purple-600 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${fetchingModels ? 'animate-spin' : ''}`} />
                  {fetchingModels ? '获取中' : '刷新模型'}
                </button>
              </div>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded" />
                启用此配置
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              <Check className="h-4 w-4" />{saving ? '保存中...' : '保存'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); setModelList([]); setShowApiKey(false); }}
              className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
