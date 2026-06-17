import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchAPI } from '@/lib/api-client';
import type { Post, Tag } from '@zqcms/shared/types';
import { PostList } from '@/components/site/post-list';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await fetchAPI<Tag | null>(`/tags/${slug}`).catch(() => null);
  return {
    title: tag ? `标签：${tag.name}` : '标签未找到',
    description: tag ? `${tag.name} 相关的文章` : '',
  };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const tag = await fetchAPI<Tag | null>(`/tags/${slug}`).catch(() => null);
  if (!tag) notFound();

  const result = await fetchAPI<{ data: Post[]; total: number }>(
    `/posts?tagSlug=${slug}&status=PUBLISHED&pageSize=50`
  ).catch(() => ({ data: [], total: 0 }));

  const posts = result.data || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">标签：{tag.name}</h1>
        <p className="mt-2 text-gray-500">共 {result.total || posts.length} 篇文章</p>
      </div>
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="h-20 w-20 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="mt-4 text-lg text-gray-400">该标签下暂无文章</p>
        </div>
      ) : (
        <PostList posts={posts} layout="grid" columns={3} emptyMessage="暂无文章" />
      )}
    </div>
  );
}
