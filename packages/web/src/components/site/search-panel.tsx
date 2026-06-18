'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, FolderOpen } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  id: number;
  title: string;
  excerpt: string | null;
  category?: { id: number; name: string; slug: string } | null;
  updatedAt: string;
}

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchPanel({ isOpen, onClose }: SearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Search with debounce
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:11003/api';
      const url = new URL(`${apiBase}/posts`);
      url.searchParams.set('search', q.trim());
      url.searchParams.set('status', 'PUBLISHED');
      url.searchParams.set('pageSize', '5');
      url.searchParams.set('orderBy', 'publishedAt');
      url.searchParams.set('orderDir', 'desc');

      const res = await fetch(url.toString());
      const data = await res.json();
      setResults(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        const r = results[selectedIndex];
        const url = r.category?.slug ? `/${r.category.slug}/${r.id}` : `/${r.id}`;
        router.push(url);
        onClose();
      } else if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const highlightText = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 text-amber-900 rounded-sm px-0.5">{part}</mark>
      ) : (
        part
      ),
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="搜索文章"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
        role="search"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="h-5 w-5 text-gray-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章..."
            className="flex-1 text-base text-gray-900 placeholder-gray-400 outline-none bg-transparent"
            aria-label="搜索关键词"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="search-results-list"
            aria-activedescendant={
              selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined
            }
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-gray-400 hover:text-gray-600"
              aria-label="清除搜索"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          id="search-results-list"
          className="max-h-[60vh] overflow-y-auto"
          role="listbox"
          aria-label="搜索结果"
        >
          {loading && (
            <div className="py-8 text-center text-sm text-gray-400" role="status">
              搜索中...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-12 text-center">
              <Search className="mx-auto h-8 w-8 text-gray-300 mb-3" aria-hidden="true" />
              <p className="text-sm text-gray-500">未找到相关文章</p>
              <p className="text-xs text-gray-400 mt-1">尝试使用不同关键词</p>
            </div>
          )}

          {!loading &&
            results.map((item, i) => {
              const url = item.category?.slug
                ? `/${item.category.slug}/${item.id}`
                : `/${item.id}`;
              return (
                <Link
                  key={item.id}
                  href={url}
                  onClick={onClose}
                  id={`search-result-${i}`}
                  role="option"
                  aria-selected={i === selectedIndex}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    i === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <FileText
                    className="h-4 w-4 text-gray-400 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {query ? highlightText(item.title, query) : item.title}
                    </div>
                    {item.excerpt && (
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {item.excerpt}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      {item.category && (
                        <span className="inline-flex items-center gap-0.5">
                          <FolderOpen className="h-3 w-3" aria-hidden="true" />
                          {item.category.name}
                        </span>
                      )}
                      <span>
                        {new Date(item.updatedAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}

          {/* View all */}
          {total > 5 && query && (
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              查看全部 {total} 条结果
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
