import Link from 'next/link';
import type { Post } from '@zqcms/shared/types';
import { Calendar, FolderOpen, ArrowRight } from 'lucide-react';

interface PostCardProps {
  post: Post;
  cardClass?: string;
  isLightText?: boolean;
}

export function PostCard({ post, cardClass, isLightText }: PostCardProps) {
  const baseClass = cardClass || 'bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg';
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

      {/* Cover Image */}
      {post.coverImage && (
        <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '16/9' }}>
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Category badge */}
        {post.category && !isLightText && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
              <FolderOpen className="h-3 w-3" />
              {post.category.name}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className={`text-lg font-bold leading-snug line-clamp-2 transition-colors group-hover:text-blue-600 ${textClass}`}>
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className={`mt-2.5 text-sm leading-relaxed line-clamp-2 ${mutedClass}`}>
            {post.excerpt}
          </p>
        )}

        {/* Spacer */}
        <div className="mt-auto pt-4" />

        {/* Footer meta */}
        <div className={`flex items-center justify-between border-t pt-3.5 ${isLightText ? 'border-white/20' : 'border-gray-50'}`}>
          <div className={`flex items-center gap-2 text-xs ${metaClass}`}>
            <Calendar className="h-3.5 w-3.5" />
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
              </time>
            )}
            {post.viewCount > 0 && (
              <span>{post.viewCount} 阅读</span>
            )}
          </div>

          {/* Read more arrow (visible on hover) */}
          <span className={`inline-flex items-center gap-1 text-xs font-medium transition-all duration-300 ${isLightText ? 'text-current/70' : 'text-blue-600'} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0`}>
            阅读
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
