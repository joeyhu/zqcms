import Link from "next/link";
import type { Post } from "@zqcms/shared/types";
import { Calendar, FolderOpen, ArrowRight, Flame, Hash } from "lucide-react";

interface PostCardProps {
  post: Post;
  cardClass?: string;
  isLightText?: boolean;
}

export function PostCard({ post, cardClass, isLightText }: PostCardProps) {
  const baseClass =
    cardClass ||
    "bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-lg";
  const textClass = isLightText ? "text-current" : "text-gray-900";
  const mutedClass = isLightText ? "opacity-80" : "text-gray-500";
  const metaClass = isLightText ? "opacity-60" : "text-gray-400";

  const articleUrl = post.category?.slug
    ? `/${post.category.slug}/${post.id}`
    : `/${post.id}`;

  const categoryUrl = post.category?.slug ? `/${post.category.slug}` : "";

  const tagItems =
    (
      post.tags as unknown as Array<{
        tag?: { id?: number; name?: string; slug?: string };
      }>
    )
      ?.map((t) => t.tag)
      .filter(Boolean) || [];

  return (
    <div
      className={`group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 ${baseClass}`}
    >
      {/* Hover accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* ── Cover Image (links to article) ── */}
      {post.coverImage && (
        <Link
          href={articleUrl}
          className="relative overflow-hidden bg-gray-50 block"
          style={{ aspectRatio: "16/9" }}
        >
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>
      )}

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col p-2 sm:p-4">
        {/* Category badge — always shown */}
        {!isLightText && (
          <div className="mb-2">
            {post.category && categoryUrl ? (
              <Link
                href={categoryUrl}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <FolderOpen className="h-3 w-3" />
                {post.category.name}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-400">
                <FolderOpen className="h-3 w-3" />
                未分类
              </span>
            )}
          </div>
        )}

        {/* ── Title (links to article) ── */}
        <Link href={articleUrl} className="block">
          <h3
            className={`text-lg font-bold leading-snug line-clamp-1 transition-colors group-hover:text-blue-600 ${textClass}`}
          >
            {post.title}
          </h3>
        </Link>

        {/* Excerpt (fixed 2-line area) */}
        <p
          className={`mt-2.5 text-sm leading-relaxed line-clamp-2 min-h-[2.5rem] ${mutedClass}`}
        >
          {post.excerpt || " "}
        </p>

        {/* Spacer */}
        <div className="mt-auto pt-1" />

        {/* ── Footer ── */}
        <div
          className={`flex items-center justify-between gap-2 border-t pt-3 ${isLightText ? "border-white/20" : "border-gray-50"} min-h-9`}
        >
          {/* Left side: tags (clickable) + date/views (info) */}
          <div
            className={`flex items-center gap-2 text-xs min-w-0 flex-1 ${metaClass}`}
          >
            {/* Tags — each links to tag page */}
            {tagItems.length > 0 && !isLightText && (
              <span className="inline-flex items-center gap-1 shrink-0">
                <Hash className="h-3 w-3 text-gray-400" />
                <span className="text-gray-500 truncate">
                  {tagItems.slice(0, 3).map((t, i) => (
                    <span key={t?.id}>
                      <Link
                        href={`/tag/${t?.slug}`}
                        className="hover:text-blue-600 hover:underline transition-colors"
                      >
                        {t?.name}
                      </Link>
                      {i < Math.min(tagItems.length, 3) - 1 && ", "}
                    </span>
                  ))}
                  {tagItems.length > 3 && (
                    <span className="text-gray-400">
                      {" "}
                      +{tagItems.length - 3}
                    </span>
                  )}
                </span>
              </span>
            )}

            {/* Hot badge (non-clickable indicator) */}
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

            {/* Date + views (non-clickable) */}
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <Calendar className="h-3 w-3" />
              <time dateTime={post.updatedAt || post.publishedAt || ""}>
                {new Date(
                  post.updatedAt || post.publishedAt || "",
                ).toLocaleDateString("zh-CN")}
              </time>
            </span>
            {post.viewCount > 0 && (
              <span className="shrink-0">{post.viewCount} 阅读</span>
            )}
          </div>

          {/* Right side: "阅读" (links to article) */}
          <Link
            href={articleUrl}
            className={`inline-flex items-center gap-1 text-xs font-medium transition-all duration-300 shrink-0 ${isLightText ? "text-current/70" : "text-blue-600"} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0`}
          >
            阅读
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
