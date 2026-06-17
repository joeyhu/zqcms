import type { Post, Category } from '@zqcms/shared/types';
import { estimateReadingTime, formatRelativeTime, countWords } from '@/lib/utils';
import { Calendar, Clock, Eye, User, FolderOpen } from 'lucide-react';

interface ArticleHeaderProps {
  post: Post;
}

export function ArticleHeader({ post }: ArticleHeaderProps) {
  const readingTime = estimateReadingTime(post.content);
  const wordCount = countWords(post.content);
  const category = post.category as Category | null | undefined;

  return (
    <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 mb-10">
      {/* Cover Image */}
      {post.coverImage && (
        <div className="relative w-full overflow-hidden rounded-t-xl" style={{ maxHeight: '420px' }}>
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full object-cover"
            style={{ maxHeight: '420px' }}
          />
          {/* Gradient overlay at bottom of image */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50/90 to-transparent" />
        </div>
      )}

      <div className={`px-6 sm:px-10 ${post.coverImage ? 'pt-0 pb-10' : 'py-10 sm:py-14'}`}>
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
          {category && (
            <a
              href={`/${category.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              {category.name}
            </a>
          )}

          {post.publishedAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span className="text-gray-300">·</span>
              <span>{formatRelativeTime(post.publishedAt)}</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            阅读约 {readingTime} 分钟
          </span>

          <span className="inline-flex items-center gap-1" title={`共 ${wordCount} 字`}>
            <span className="text-gray-300">·</span>
            {wordCount.toLocaleString()} 字
          </span>

          {post.viewCount > 0 && (
            <span className="inline-flex items-center gap-1" title={`${post.viewCount} 次浏览`}>
              <Eye className="h-3.5 w-3.5" />
              {post.viewCount.toLocaleString()} 次浏览
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl leading-tight">
          {post.title}
        </h1>

        {/* Excerpt / Subtitle */}
        {post.excerpt && (
          <p className="mt-4 text-lg leading-relaxed text-gray-500 max-w-3xl">
            {post.excerpt}
          </p>
        )}

        {/* Author */}
        {post.author && (
          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-sm">
              {(post.author.name || post.author.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {post.author.name || post.author.email}
              </p>
              <p className="text-xs text-gray-400">作者</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
