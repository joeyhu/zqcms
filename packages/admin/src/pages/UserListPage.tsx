import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api-client';
import { getUser } from '@/lib/auth';
import { Plus, Edit3, Trash2, Shield, ShieldCheck, UserCheck, UserX, Key } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  permissions: string[] | null;
  createdAt: string;
  updatedAt: string;
  _count: { posts: number };
}

const ROLE_LABELS: Record<string, string> = { ADMIN: '管理员', EDITOR: '编辑' };

const ALL_MENUS = [
  { key: 'dashboard', label: '仪表盘' },
  { key: 'categories', label: '目录管理' },
  { key: 'posts', label: '文章管理' },
  { key: 'tags', label: '标签管理' },
  { key: 'icons', label: '图标管理' },
  { key: 'media', label: '媒体库' },
  { key: 'settings', label: '站点配置' },
  { key: 'llm', label: 'LLM 设置' },
  { key: 'publish', label: '内容平台' },
  { key: 'feedback', label: '用户反馈' },
  { key: 'sites', label: '站点管理' },
  { key: 'users', label: '用户管理' },
];

export function UserListPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'EDITOR', isActive: true, permissions: [] as string[] });
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();
  const currentUser = getUser();

  const load = async () => {
    try {
      const data = await fetchAPI<UserItem[]>('/users');
      setUsers(data);
    } catch { toast.error('加载用户失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ email: '', password: '', name: '', role: 'EDITOR', isActive: true, permissions: [] });
    setShowForm(true);
  };

  const openEdit = (user: UserItem) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      password: '',
      name: user.name || '',
      role: user.role,
      isActive: user.isActive,
      permissions: (user.permissions || []) as string[],
    });
    setShowForm(true);
  };

  const togglePermission = (key: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(k => k !== key)
        : [...prev.permissions, key],
    }));
  };

  const handleSubmit = async () => {
    if (!form.email) { toast.error('请输入邮箱'); return; }
    if (!editingUser && !form.password) { toast.error('请输入密码'); return; }

    setSaving(true);
    try {
      if (editingUser) {
        const body: Record<string, unknown> = { email: form.email, name: form.name, role: form.role, isActive: form.isActive, permissions: form.permissions };
        if (form.password) body.password = form.password;
        await fetchAPI(`/users/${editingUser.id}`, { method: 'PUT', body: JSON.stringify(body) });
        toast.success('用户已更新');
      } else {
        await fetchAPI('/users', { method: 'POST', body: JSON.stringify({ ...form }) });
        toast.success('用户已创建');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: UserItem) => {
    const ok = await confirm({ title: '删除用户', message: `确定删除用户「${user.email}」吗？`, danger: true, confirmText: '删除' });
    if (!ok) return;
    try {
      await fetchAPI(`/users/${user.id}`, { method: 'DELETE' });
      toast.success('已删除');
      load();
    } catch { toast.error('删除失败'); }
  };

  if (loading) return <div className="py-12 text-center text-gray-400">加载中...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="mt-1 text-sm text-gray-500">共 {users.length} 个用户</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />新建用户
        </button>
      </div>

      {/* User list */}
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="rounded-xl border bg-white p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">{user.name || user.email}</span>
                <span className="text-sm text-gray-400">{user.email}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.role === 'ADMIN' ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                  {ROLE_LABELS[user.role] || user.role}
                </span>
                {user.isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    <UserCheck className="h-3 w-3" />启用
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    <UserX className="h-3 w-3" />已禁用
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                <span>{user._count?.posts ?? 0} 篇文章</span>
                <span>创建于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Tooltip content="编辑用户">
                <button onClick={() => openEdit(user)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600">
                  <Edit3 className="h-4 w-4" />
                </button>
              </Tooltip>
              {user.id !== currentUser?.id && (
                <Tooltip content="删除用户">
                  <button onClick={() => handleDelete(user)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold">{editingUser ? '编辑用户' : '新建用户'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">邮箱 *</label>
                  <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">姓名</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">密码 {editingUser ? '(留空不修改)' : '*'}</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">角色</label>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    disabled={editingUser?.id === currentUser?.id}
                    className="block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400">
                    <option value="EDITOR">编辑</option>
                    <option value="ADMIN">管理员</option>
                  </select>
                  {editingUser?.id === currentUser?.id && (
                    <p className="mt-1 text-xs text-amber-600">不能修改自己的角色</p>
                  )}
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive}
                      disabled={editingUser?.id === currentUser?.id}
                      onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50" />
                    <span className={`text-sm ${editingUser?.id === currentUser?.id ? 'text-gray-400' : 'text-gray-700'}`}>启用账号</span>
                  </label>
                  {editingUser?.id === currentUser?.id && (
                    <p className="mt-1 text-xs text-amber-600">不能禁用自己</p>
                  )}
                </div>
              </div>

              {/* Menu Permissions */}
              <div>
                <label className="block text-sm font-medium mb-2">菜单权限</label>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_MENUS.map(menu => (
                    <label key={menu.key} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                      form.permissions.includes(menu.key) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                      <input type="checkbox" checked={form.permissions.includes(menu.key)}
                        onChange={() => togglePermission(menu.key)} className="sr-only" />
                      {menu.label}
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-400">管理员默认拥有全部权限，无需单独设置</p>
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleSubmit} disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? '保存中...' : editingUser ? '更新' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
