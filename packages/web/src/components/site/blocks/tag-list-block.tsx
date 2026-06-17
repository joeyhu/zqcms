import Link from 'next/link';
import { fetchAPI } from '@/lib/api-client';
import type { Tag } from '@zqcms/shared/types';

interface TagListBlockProps {
  config: {
    limit?: number;
    layout?: string;
    columns?: number;
  };
}

export async function TagListBlock({ config }: TagListBlockProps) {
  const { limit = 20, layout = 'grid', columns = 4 } = config;
  const tags = await fetchAPI<Tag[]>('/tags').catch(() => []);
  const display = tags.slice(0, limit);
  const gridClass = columns === 3 ? 'grid-cols-2 md:grid-cols-3' : columns === 4 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2';

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className={layout === 'grid' ? `grid gap-3 ${gridClass}` : 'flex flex-wrap gap-2'}>
          {display.map((tag) => (
            <Link key={tag.id} href={`/tag/${tag.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow-md hover:-translate-y-0.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              {tag.name}
              {tag._count && tag._count.posts > 0 && (
                <span className="text-xs text-gray-300">({tag._count.posts})</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
