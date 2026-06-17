import Link from 'next/link';
import type { Post } from '@zqcms/shared/types';

interface PostCardProps {
  post: Post;
  cardClass?: string;
  isLightText?: boolean;
}

export function PostCard({ post, cardClass, isLightText }: PostCardProps) {
  const baseClass = cardClass || 'bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md';
  const textClass = isLightText ? 'text-current' : 'text-gray-900';
  const mutedClass = isLightText ? 'opacity-80' : 'text-gray-500';
  const metaClass = isLightText ? 'opacity-60' : 'text-gray-400';

  return (
    <Link
      href={`/${post.category?.slug}/${post.id}`}
      className={`group relative flex flex-col overflow-hidden transition-all duration-500 hover:-translate-y-1.5 ${baseClass}`}
    >
      {/* Gradient top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {post.coverImage && (
        <div className="flex items-center justify-center overflow-hidden bg-gray-50" style={{ maxHeight: '240px' }}>
          <img
            src={post.coverImage}
            alt={post.title}
            className="max-h-[200px] w-full object-contain transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <h3 className={`text-lg font-bold line-clamp-2 transition-colors ${textClass}`}>
          {post.title}
        </h3>

        {post.excerpt && (
          <p className={`mt-2.5 text-sm leading-relaxed line-clamp-3 ${mutedClass}`}>
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto pt-4" />

        <div className={`flex items-center justify-between border-t pt-3.5 ${isLightText ? 'border-white/20' : 'border-gray-50'}`}>
          <div className={`flex items-center gap-2 text-xs ${metaClass}`}>
            {post.publishedAt && (
              <time className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
              </time>
            )}
          </div>
          {post.category && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${isLightText ? 'bg-white/20 text-current' : 'bg-blue-50 text-blue-600'}`}>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              {post.category.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
