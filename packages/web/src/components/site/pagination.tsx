'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageUrl = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page <= 1) {
        params.delete('page');
      } else {
        params.set('page', String(page));
      }
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams],
  );

  if (totalPages <= 1) return null;

  // Generate page numbers to display (show max 7 with ellipsis)
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-10">
      {/* Previous */}
      {currentPage > 1 ? (
        <a
          href={createPageUrl(currentPage - 1)}
          onClick={(e) => {
            e.preventDefault();
            router.push(createPageUrl(currentPage - 1));
          }}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          上一页
        </a>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
          上一页
        </span>
      )}

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className="w-9 text-center text-sm text-gray-400">
              ...
            </span>
          ) : (
            <a
              key={page}
              href={createPageUrl(page)}
              onClick={(e) => {
                e.preventDefault();
                router.push(createPageUrl(page));
              }}
              className={`
                inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors
                ${page === currentPage
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              {page}
            </a>
          ),
        )}
      </div>

      {/* Next */}
      {currentPage < totalPages ? (
        <a
          href={createPageUrl(currentPage + 1)}
          onClick={(e) => {
            e.preventDefault();
            router.push(createPageUrl(currentPage + 1));
          }}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          下一页
          <ChevronRight className="h-4 w-4" />
        </a>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 cursor-not-allowed">
          下一页
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
