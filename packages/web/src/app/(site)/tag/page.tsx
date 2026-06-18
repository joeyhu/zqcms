import type { Metadata } from 'next';
import { fetchAPI } from '@/lib/api-client';
import type { Tag } from '@zqcms/shared/types';
import Link from 'next/link';
import { Hash } from 'lucide-react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:11001';

export const metadata: Metadata = {
  title: '标签',
  description: '浏览所有标签',
  alternates: {
    canonical: `${siteUrl}/tag`,
  },
  openGraph: {
    title: '标签',
    description: '浏览所有标签',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '标签',
    description: '浏览所有标签',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function TagListPage() {
  const tags = await fetchAPI<Tag[]>('/tags').catch(() => [] as Tag[]);

  // Sort by post count descending, then alphabetically
  const sorted = [...tags].sort((a, b) => {
    const countA = a._count?.posts ?? 0;
    const countB = b._count?.posts ?? 0;
    if (countB !== countA) return countB - countA;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 mb-4">
          <Hash className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">标签</h1>
        <p className="mt-2 text-gray-500">
          共 {tags.length} 个标签
        </p>
      </div>

      {/* Tag cloud */}
      {sorted.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-3">
          {sorted.map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 hover:shadow-md"
            >
              <Hash className="h-3.5 w-3.5 text-amber-400 group-hover:text-amber-500" />
              {tag.name}
              <span className="text-xs text-gray-400 group-hover:text-amber-400">
                ({tag._count?.posts ?? 0})
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-lg text-gray-400">暂无标签</p>
        </div>
      )}
    </div>
  );
}
