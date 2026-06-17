import Link from 'next/link';
import type { Post } from '@zqcms/shared/types';
import { Calendar, FolderOpen, ArrowRight, Flame, Hash } from 'lucide-react';

interface PostCardProps {
  post: Post;
  cardClass?: string;
  isLightText?: boolean;
}

export function PostCard({ post, cardClass, isLightText }: PostCardProps) {
  const baseClass = cardClass || 'bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-lg';
  const textClass = isLightText ? 'text-current' : 'text-gray-900';
  const mutedClass = isLightText ? 'opacity-80' : 'text-gray-500';
  const metaClass = isLightText ? 'opacity-60' : 'text-gray-400';

  const articleUrl = post.category?.slug
    ? `/${post.category.slug}/${post.id}`
    : `/${post.id}`;

  const tagItems = (post.tags as unknown as Array<{ tag?: { id?: number; name?: string; slug?: string } }>)
    ?.map(t => t.tag)
    .filter(Boolean) || [];

  return (
    <Link
      href={articleUrl}
      className={`group relative flex flex-col overflow-hidden transition-all duration-500 hover:-translate-y-1.5 ${baseClass}`}
    >
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Category badge (top) */}
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

        {/* Spacer — pushes footer to bottom */}
        <div className="mt-auto pt-4" />

        {/* Footer: tags + hot + date/views all in one row */}
        <div className={`flex items-center justify-between gap-2 border-t pt-3 ${isLightText ? 'border-white/20' : 'border-gray-50'}`}>
          {/* Left: tags + hot badge + date */}
          <div className={`flex items-center gap-2 text-xs min-w-0 flex-1 ${metaClass}`}>
            {/* Tags (compact) */}
            {tagItems.length > 0 && !isLightText && (
              <span className="inline-flex items-center gap-0.5 shrink-0">
                <Hash className="h-3 w-3 text-gray-400" />
                <span className="text-gray-500 truncate">
                  {tagItems.slice(0, 3).map((t, i) => (
                    <span key={t?.id}>
                      {t?.name}{i < Math.min(tagItems.length, 3) - 1 ? ', ' : ''}
                    </span>
                  ))}
                  {tagItems.length > 3 && <span className="text-gray-400"> +{tagItems.length - 3}</span>}
                </span>
              </span>
            )}

            {/* Hot badge */}
            {post.isFeatured && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-600 border border-orange-200 shrink-0">
                <Flame className="h-3 w-3" />
                热门
              </span>
            )}

            {/* Separator */}
            {(tagItems.length > 0 || post.isFeatured) && (
              <span className="text-gray-300 shrink-0">|</span>
            )}

            {/* Date + views */}
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <Calendar className="h-3 w-3" />
              {post.publishedAt && (
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
                </time>
              )}
            </span>
            {post.viewCount > 0 && (
              <span className="shrink-0">{post.viewCount} 阅读</span>
            )}
          </div>

          {/* Right: read more arrow */}
          <span className={`inline-flex items-center gap-1 text-xs font-medium transition-all duration-300 shrink-0 ${isLightText ? 'text-current/70' : 'text-blue-600'} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0`}>
            阅读
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
