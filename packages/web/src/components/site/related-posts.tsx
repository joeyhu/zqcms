import { PostList } from './post-list';
import type { Post } from '@zqcms/shared/types';

interface RelatedPostsProps {
  posts: Post[];
  currentPostId: number;
}

export function RelatedPosts({ posts, currentPostId }: RelatedPostsProps) {
  const filtered = posts.filter((p) => p.id !== currentPostId).slice(0, 3);

  if (filtered.length === 0) return null;

  return (
    <section className="mt-16 border-t border-gray-100 pt-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">相关文章</h2>
        <p className="mt-1 text-sm text-gray-500">继续阅读更多精彩内容</p>
      </div>

      <PostList
        posts={filtered}
        layout="grid"
        columns={3}
        emptyMessage="暂无相关文章"
      />
    </section>
  );
}
