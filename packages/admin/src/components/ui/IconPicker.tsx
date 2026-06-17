import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { ICON_LIST } from '@/lib/icons';

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
  onClose: () => void;
}

export function IconPicker({ value, onChange, onClose }: IconPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return ICON_LIST;
    const q = search.toLowerCase().trim();
    return ICON_LIST.filter((item) =>
      item.name.toLowerCase().includes(q) || item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [search]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-lg text-gray-900">选择图标</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索图标名称或关键词..."
              className="block w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none"
            />
          </div>
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
            {filtered.map((item) => {
              const Icon = item.component;
              const isSelected = value === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => { onChange(item.name); onClose(); }}
                  title={item.name}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg transition-colors ${
                    isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                  <span className="text-[9px] text-gray-400 truncate w-full text-center leading-tight">{item.name}</span>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">未找到匹配的图标</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
