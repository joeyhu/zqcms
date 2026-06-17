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
  /** Enable staggered fade-in-up animation for grid items */
  staggered?: boolean;
}

const STAGGER_CLASSES = [
  'animate-fade-in-up stagger-1',
  'animate-fade-in-up stagger-2',
  'animate-fade-in-up stagger-3',
  'animate-fade-in-up stagger-4',
  'animate-fade-in-up stagger-5',
  'animate-fade-in-up stagger-6',
  'animate-fade-in-up stagger-7',
  'animate-fade-in-up stagger-8',
  'animate-fade-in-up stagger-9',
  'animate-fade-in-up stagger-10',
  'animate-fade-in-up stagger-11',
  'animate-fade-in-up stagger-12',
];

export function PostList({
  posts,
  layout = 'grid',
  columns = 3,
  cardClass,
  isLightText,
  gridClass,
  emptyMessage,
  staggered = false,
}: PostListProps) {
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
      {posts.map((post, i) => (
        <div
          key={post.id}
          className={staggered ? (STAGGER_CLASSES[i % STAGGER_CLASSES.length] || '') : ''}
        >
          <PostCard post={post} cardClass={cardClass} isLightText={isLightText} />
        </div>
      ))}
    </div>
  );
}
