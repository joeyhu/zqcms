import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Layout } from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';
import type { Category } from '@zqcms/shared/types';
import toast from 'react-hot-toast';

export function CategoryListPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    setLoading(true);
    try {
      // Get all categories as flat list
      const cats = await fetchAPI<Category[]>('/categories?all=true');
      // Build tree for display
      const tree = buildTree(cats);
      setCategories(tree);
    } catch {
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const buildTree = (cats: Category[]): Category[] => {
    const map = new Map<number, Category>();
    const roots: Category[] = [];

    for (const cat of cats) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of cats) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        const parent = map.get(cat.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除目录「${name}」？该目录下的文章也会被删除。`)) return;
    try {
      await fetchAPI(`/categories/${id}`, { method: 'DELETE' });
      toast.success('已删除');
      loadCategories();
    } catch {
      toast.error('删除失败');
    }
  };

  const renderCategory = (cat: Category, depth = 0, parentSlug = '') => {
    const isSubcategory = depth > 0;
    const fullSlug = parentSlug ? `${parentSlug}/${cat.slug}` : cat.slug;
    const baseType = isSubcategory ? 'subcategory' : 'category';
    const pageUrl = `/pages/${baseType}?slug=${encodeURIComponent(fullSlug)}`;

    return (
    <div key={cat.id}>
      <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50" style={{ paddingLeft: `${depth * 24 + 12}px` }}>
        <div>
          <span className="font-medium text-gray-900">{cat.name}</span>
          <span className="ml-2 text-xs text-gray-400">/{fullSlug}</span>
          {cat._count && (
            <span className="ml-2 text-xs text-gray-400">({cat._count.posts} 篇)</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(pageUrl)}
            title="编辑页面布局"
            className="rounded p-1 text-gray-400 hover:text-purple-600">
            <Layout className="h-4 w-4" />
          </button>
          <button onClick={() => navigate(`/categories/${cat.id}/edit`)} className="rounded p-1 text-gray-400 hover:text-blue-600">
            <Edit3 className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(cat.id, cat.name)} className="rounded p-1 text-gray-400 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {cat.children?.map((child) => renderCategory(child, depth + 1, fullSlug))}
    </div>
  );};

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">目录管理</h1>
        <button
          onClick={() => navigate('/categories/new')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />新建目录
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">加载中...</div>
      ) : categories.length === 0 ? (
        <div className="py-12 text-center text-gray-400">暂无目录</div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm p-2">
          {categories.map((cat) => renderCategory(cat))}
        </div>
      )}
    </div>
  );
}
