import Link from 'next/link';
import type { Category } from '@zqcms/shared/types';
import { FolderOpen, ChevronRight } from 'lucide-react';
import { getIconComponent } from '@/lib/icon';

interface SubCategoryListProps {
  categories: Category[];
}

export function SubCategoryList({ categories }: SubCategoryListProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="mb-5 flex items-center gap-2">
        <FolderOpen className="h-5 w-5 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-800">子目录</h2>
        <span className="text-sm text-gray-400">({categories.length})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((child) => {
          const IconComp = getIconComponent(child.icon);

          return (
            <Link
              key={child.id}
              href={`/${child.slug}`}
              className="group flex items-start gap-4 rounded-lg border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5"
            >
              {/* Icon */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 transition-colors group-hover:from-blue-100 group-hover:to-indigo-100">
                <IconComp className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {child.name}
                  </h3>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-blue-400" />
                </div>

                {child.description && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {child.description}
                  </p>
                )}

                {/* Post count */}
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs text-gray-400">
                    {child._count?.posts ?? 0} 篇文章
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
