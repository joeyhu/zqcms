import { PostCard } from './post-card';
import type { Post } from '@zqcms/shared/types';

interface PostListProps {
  posts: Post[];
  layout?: 'grid' | 'list';
  columns?: number;
  emptyMessage?: string;
}

export function PostList({ posts, layout = 'grid', columns = 3, emptyMessage }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        {emptyMessage || '暂无文章'}
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="divide-y">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    );
  }

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid gap-6 ${gridCols[columns as keyof typeof gridCols] || gridCols[3]}`}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
