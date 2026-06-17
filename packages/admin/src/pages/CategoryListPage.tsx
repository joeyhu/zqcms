import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Edit3, Trash2, Layout, GripVertical } from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';
import type { Category } from '@zqcms/shared/types';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

// ── Helpers ──

function buildTree(cats: Category[]): Category[] {
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
}

interface FlatItem {
  id: number;
  category: Category;
  depth: number;
  parentSlug: string;
}

function flattenTree(nodes: Category[], depth: number, parentSlug: string): FlatItem[] {
  const result: FlatItem[] = [];
  for (const node of nodes) {
    const fullSlug = parentSlug ? `${parentSlug}/${node.slug}` : node.slug;
    result.push({ id: node.id, category: node, depth, parentSlug });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1, fullSlug));
    }
  }
  return result;
}

// ── Sortable Row ──

function SortableRow({
  item,
  onDelete,
}: {
  item: FlatItem;
  onDelete: (id: number, name: string) => void;
}) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const cat = item.category;
  const isSub = item.depth > 0;
  const baseType = isSub ? 'subcategory' : 'category';
  const fullSlug = item.parentSlug ? `${item.parentSlug}/${cat.slug}` : cat.slug;
  const pageUrl = `/pages/${baseType}?slug=${encodeURIComponent(fullSlug)}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-lg px-3 py-1.5 hover:bg-gray-50 group"
    >
      {/* Drag handle + name */}
      <div className="flex items-center gap-2 min-w-0 flex-1" style={{ paddingLeft: `${item.depth * 24}px` }}>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-500 flex-shrink-0 group-hover:opacity-100 opacity-0 transition-opacity"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="font-medium text-gray-900 truncate">{cat.name}</span>
        <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:inline">/{fullSlug}</span>
        {cat._count && (
          <span className="text-xs text-gray-400 flex-shrink-0">({cat._count.posts} 篇)</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 flex-shrink-0">
        <button onClick={() => navigate(pageUrl)} title="编辑页面布局"
          className="rounded p-1 text-gray-300 hover:text-purple-600">
          <Layout className="h-4 w-4" />
        </button>
        <button onClick={() => navigate(`/categories/${cat.id}/edit`)} title="编辑"
          className="rounded p-1 text-gray-300 hover:text-blue-600">
          <Edit3 className="h-4 w-4" />
        </button>
        <button onClick={() => onDelete(cat.id, cat.name)} title="删除"
          className="rounded p-1 text-gray-300 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main Component ──

export function CategoryListPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [rawCategories, setRawCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor));

  const loadCategories = async () => {
    setLoading(true);
    try {
      const cats = await fetchAPI<Category[]>('/categories?all=true');
      cats.sort((a, b) => a.sortOrder - b.sortOrder);
      setRawCategories(cats);
    } catch {
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  // 构建树并扁平化
  const tree = useMemo(() => buildTree(rawCategories), [rawCategories]);
  const flatList = useMemo(() => flattenTree(tree, 0, ''), [tree]);

  // 用 ref 保持最新 flatList，避免 handleDragEnd 闭包过期
  const flatListRef = useRef(flatList);
  flatListRef.current = flatList;

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({ title: '删除目录', message: `确定删除目录「${name}」？该目录下的文章也会被删除。`, danger: true });
    if (!ok) return;
    try {
      await fetchAPI(`/categories/${id}`, { method: 'DELETE' });
      toast.success('已删除');
      loadCategories();
    } catch {
      toast.error('删除失败');
    }
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const list = flatListRef.current;
    const oldIndex = list.findIndex((f) => f.id === active.id);
    const newIndex = list.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = [...list];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const items = reordered.map((f, idx) => ({ id: f.id, sortOrder: idx }));
    try {
      await fetchAPI('/categories/reorder', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
    } catch (err) {
      toast.error(err instanceof Error ? `排序失败: ${err.message}` : '排序保存失败');
      return;
    }

    loadCategories();
  }, []);

  if (loading) return <div className="py-12 text-center text-gray-400">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">目录管理</h1>
          <p className="mt-1 text-sm text-gray-400">拖拽左侧手柄调整排序</p>
        </div>
        <button
          onClick={() => navigate('/categories/new')}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />新建目录
        </button>
      </div>

      {rawCategories.length === 0 ? (
        <div className="py-12 text-center text-gray-400">暂无目录</div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm py-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={flatList.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              {flatList.map((item) => (
                <SortableRow key={item.id} item={item} onDelete={handleDelete} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
