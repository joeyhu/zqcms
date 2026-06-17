import Link from 'next/link';
import { fetchAPI } from '@/lib/api-client';
import type { Category } from '@zqcms/shared/types';

interface CategoryListBlockProps {
  config: {
    parentId?: number;
    layout?: string;
    columns?: number;
    showCount?: boolean;
  };
}

export async function CategoryListBlock({ config }: CategoryListBlockProps) {
  const { columns = 3, showCount = true } = config;

  const categories = await fetchAPI<Category[]>('/categories').catch(() => []);

  const visible = categories.filter((c) => c.isVisible);

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className={`grid gap-4 ${gridCols[columns as keyof typeof gridCols] || gridCols[3]}`}>
          {visible.map((cat) => (
            <Link
              key={cat.id}
              href={`/${cat.slug}`}
              className="block rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-lg text-gray-900">{cat.name}</h3>
              {cat.description && (
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{cat.description}</p>
              )}
              {showCount && cat._count && (
                <p className="mt-3 text-xs text-gray-400">
                  {cat._count.posts} 篇文章
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
