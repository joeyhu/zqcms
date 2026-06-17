import { PostCard } from './post-card';
import type { Post } from '@zqcms/shared/types';

interface PostListProps {
  posts: Post[];
  layout?: 'grid' | 'list';
  columns?: number;
  cardClass?: string;
  isLightText?: boolean;
  gridClass?: string;
  emptyMessage?: string;
}

export function PostList({ posts, layout = 'grid', columns = 3, cardClass, isLightText, gridClass, emptyMessage }: PostListProps) {
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
          <PostCard key={post.id} post={post} cardClass={cardClass} isLightText={isLightText} />
        ))}
      </div>
    );
  }

  const grid = gridClass || `grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(columns, 4)}`;

  return (
    <div className={`grid gap-6 ${grid}`}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} cardClass={cardClass} isLightText={isLightText} />
      ))}
    </div>
  );
}
