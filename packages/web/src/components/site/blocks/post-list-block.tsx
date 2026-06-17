import { fetchAPI } from '@/lib/api-client';
import { PostList } from '@/components/site/post-list';
import type { Post } from '@zqcms/shared/types';

interface PostListBlockProps {
  config: {
    categoryId?: number;
    limit?: number;
    sortBy?: string;
    layout?: string;
    columns?: number;
  };
}

export async function PostListBlock({ config }: PostListBlockProps) {
  const { categoryId, limit = 6, layout = 'grid', columns = 3 } = config;

  const queryParams = new URLSearchParams({
    pageSize: String(limit),
    status: 'PUBLISHED',
  });

  if (categoryId) queryParams.set('categoryId', String(categoryId));

  const result = await fetchAPI<{ data: Post[] }>(`/posts?${queryParams.toString()}`).catch(() => ({ data: [] }));

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <PostList
          posts={result.data}
          layout={layout as 'grid' | 'list'}
          columns={columns}
          emptyMessage="暂无文章"
        />
      </div>
    </section>
  );
}
