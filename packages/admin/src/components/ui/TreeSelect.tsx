import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';

// ---------- types ----------

export interface TreeNode {
  id: number;
  name: string;
  parentId: number | null;
  children?: TreeNode[];
}

interface FlattenedNode {
  node: TreeNode;
  depth: number;
}

// ---------- helpers ----------

function buildTree(flat: { id: number; name: string; parentId: number | null }[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  for (const item of flat) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of flat) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function flattenTree(nodes: TreeNode[], depth: number, expandedIds: Set<number>): FlattenedNode[] {
  const result: FlattenedNode[] = [];
  for (const node of nodes) {
    result.push({ node, depth });
    if (node.children && node.children.length > 0 && expandedIds.has(node.id)) {
      result.push(...flattenTree(node.children, depth + 1, expandedIds));
    }
  }
  return result;
}

// ---------- TreeSelect Props ----------

interface TreeSelectProps {
  items: { id: number; name: string; parentId: number | null }[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
  excludeId?: number;
  className?: string;
}

// ---------- TreeSelect Component ----------

const INDENT_PER_LEVEL = 24; // px per depth

export function TreeSelect({
  items,
  value,
  onChange,
  placeholder = '无（顶级目录）',
  excludeId,
  className = '',
}: TreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => {
    const filtered = excludeId ? items.filter((i) => i.id !== excludeId) : items;
    return buildTree(filtered);
  }, [items, excludeId]);

  // 选中时展开祖先链
  useEffect(() => {
    if (value == null) return;
    const map = new Map<number, { id: number; parentId: number | null }>();
    for (const item of items) map.set(item.id, item);
    const newExpanded = new Set(expandedIds);
    // Walk up ancestors and expand them
    let cursor: number | null = value;
    while (cursor !== null && cursor !== undefined) {
      const item = map.get(cursor);
      if (!item) break;
      if (item.parentId) newExpanded.add(item.parentId);
      cursor = item.parentId ?? null;
    }
    setExpandedIds(newExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // 初次打开自动展开根节点
  useEffect(() => {
    if (open && expandedIds.size === 0 && tree.length > 0) {
      const ids = new Set(tree.filter((n) => n.children?.length).map((n) => n.id));
      if (ids.size > 0) setExpandedIds(ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tree]);

  // 外部点击关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const flatNodes = useMemo(() => flattenTree(tree, 0, expandedIds), [tree, expandedIds]);

  const selectedName = useMemo(() => {
    if (value == null) return '';
    return items.find((i) => i.id === value)?.name || '';
  }, [value, items]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = (id: number | null) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
          open ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className={selectedName ? 'text-gray-900' : 'text-gray-400'}>
          {selectedName || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border bg-white shadow-lg">
          {/* None option */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
              value === null ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600'
            }`}
          >
            <Check className={`h-4 w-4 flex-shrink-0 ${value === null ? 'opacity-100' : 'opacity-0'}`} />
            <span className="italic">{placeholder}</span>
          </button>

          {/* Divider */}
          {flatNodes.length > 0 && <div className="border-t mx-2" />}

          {/* Tree nodes */}
          {flatNodes.map(({ node, depth }) => {
            const hasChildren = node.children && node.children.length > 0;
            const isExpanded = expandedIds.has(node.id);
            const isSelected = value === node.id;
            const paddingLeft = 12 + depth * INDENT_PER_LEVEL;

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => handleSelect(node.id)}
                className={`flex w-full items-center gap-1 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                  isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
                style={{ paddingLeft }}
              >
                {/* Expand toggle */}
                <span
                  onClick={hasChildren ? (e) => { e.stopPropagation(); toggleExpand(node.id); } : undefined}
                  className={`flex h-5 w-5 items-center justify-center rounded flex-shrink-0 ${
                    hasChildren ? 'cursor-pointer hover:bg-gray-200' : ''
                  }`}
                >
                  {hasChildren && (
                    isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                      : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </span>

                {/* Label */}
                <span className="truncate">{node.name}</span>

                {/* Check */}
                {isSelected && <Check className="ml-auto h-4 w-4 text-blue-600 flex-shrink-0" />}
              </button>
            );
          })}

          {flatNodes.length === 0 && tree.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-gray-400">暂无可用目录</div>
          )}
        </div>
      )}
    </div>
  );
}
