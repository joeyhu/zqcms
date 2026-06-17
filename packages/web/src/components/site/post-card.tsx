import Link from 'next/link';
import type { Post } from '@zqcms/shared/types';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/${post.category?.slug}/${post.slug}`}
      className="block rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      {post.coverImage && (
        <img src={post.coverImage} alt={post.title} className="mb-4 h-40 w-full rounded-lg object-cover" />
      )}
      <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{post.title}</h3>
      {post.excerpt && (
        <p className="mt-2 text-sm text-gray-500 line-clamp-3">{post.excerpt}</p>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
        {post.publishedAt && (
          <time>{new Date(post.publishedAt).toLocaleDateString('zh-CN')}</time>
        )}
        {post.category && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">{post.category.name}</span>
        )}
      </div>
    </Link>
  );
}
