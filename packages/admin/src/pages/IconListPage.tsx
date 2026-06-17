import { useState, useMemo } from 'react';
import { Search, Copy, Check } from 'lucide-react';
import { ICON_LIST } from '@/lib/icons';
import toast from 'react-hot-toast';

export function IconListPage() {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return ICON_LIST;
    const q = search.toLowerCase().trim();
    return ICON_LIST.filter((item) =>
      item.name.toLowerCase().includes(q) || item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [search]);

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name).then(() => {
      setCopied(name);
      toast.success(`Icon ${name} 已复制`);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">图标管理</h1>
          <p className="mt-1 text-sm text-gray-400">共 {ICON_LIST.length} 个图标，点击可复制名称</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索图标..."
            className="block w-full rounded-lg border px-3 py-2 pl-10 text-sm focus:border-blue-400 outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
          {filtered.map((item) => {
            const Icon = item.component;
            const isCopied = copied === item.name;
            return (
              <button
                key={item.name}
                onClick={() => handleCopy(item.name)}
                title={`${item.name} — 点击复制`}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-gray-50 transition-colors group relative"
              >
                <Icon className={`h-6 w-6 ${isCopied ? 'text-green-500' : 'text-gray-500 group-hover:text-gray-700'}`} />
                <span className="text-[10px] text-gray-400 truncate w-full text-center leading-tight">{item.name}</span>
                {isCopied && (
                  <Check className="absolute top-1 right-1 h-3 w-3 text-green-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
