import type { Metadata } from "next";
import { fetchAPI } from "@/lib/api-client";
import type { Post } from "@zqcms/shared/types";
import Link from "next/link";
import { Search, FileText, FolderOpen, Calendar } from "lucide-react";
import { Pagination } from "@/components/site/pagination";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:11001';

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { q, page: pageStr } = await searchParams;
  const page = parseInt(pageStr || '1') || 1;

  return {
    title: q ? `搜索: ${q}` : '搜索',
    description: q ? `搜索 "${q}" 的结果` : '搜索文章',
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: q
        ? `${siteUrl}/search?q=${encodeURIComponent(q)}${page > 1 ? `&page=${page}` : ''}`
        : `${siteUrl}/search`,
    },
    openGraph: {
      title: q ? `搜索: ${q}` : '搜索',
      description: q ? `搜索 "${q}" 的结果` : '搜索文章',
      type: 'website',
    },
  };
}

function highlightText(text: string, keyword: string) {
  if (!keyword.trim()) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <mark key={i} className="bg-amber-200 text-amber-900 rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q: query, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1") || 1);
  const pageSize = 20;

  if (!query) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">搜索文章</h1>
        <p className="mt-2 text-gray-500">输入关键词搜索站内文章</p>
      </div>
    );
  }

  const result = await fetchAPI<{
    data: Post[];
    total: number;
    totalPages: number;
  }>(
    `/posts?search=${encodeURIComponent(query)}&status=PUBLISHED&pageSize=${pageSize}&page=${page}`,
  ).catch(() => ({ data: [], total: 0, totalPages: 0 }));

  const posts = result.data || [];
  const total = result.total || 0;
  const totalPages = result.totalPages || 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          搜索: <span className="text-blue-600">{query}</span>
        </h1>
        <div className="flex-grow" />
        <p className="mt-1 text-sm text-gray-500">
          {total > 0 ? (
            <div className="flex items-center">
              共找到 <span className="text-blue-600 px-1">{total}</span> 条结果
            </div>
          ) : (
            "未找到相关结果"
          )}
        </p>
      </div>

      {/* Results */}
      {posts.length === 0 ? (
        <div className="py-16 text-center">
          <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-lg text-gray-500">未找到与 &quot;{query}&quot; 相关的文章</p>
          <p className="mt-2 text-sm text-gray-400">
            尝试使用不同的关键词，或减少关键词数量
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const url = post.category?.slug
              ? `/${post.category.slug}/${post.id}`
              : `/${post.id}`;

            return (
              <Link
                key={post.id}
                href={url}
                className="block rounded-lg border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {highlightText(post.title, query)}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">
                        {highlightText(post.excerpt, query)}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
                      {post.category && (
                        <span className="inline-flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          {post.category.name}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(
                          post.updatedAt || post.publishedAt || "",
                        ).toLocaleDateString("zh-CN")}
                      </span>
                      {post.viewCount > 0 && <span>{post.viewCount} 阅读</span>}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          <Pagination currentPage={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
