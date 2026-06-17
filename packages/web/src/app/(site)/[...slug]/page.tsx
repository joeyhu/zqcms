import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchAPI } from "@/lib/api-client";
import type { Category, Post } from "@zqcms/shared/types";
import { MarkdownRenderer } from "@/components/site/markdown-renderer";
import { PostList } from "@/components/site/post-list";
import { ArticleHeader } from "@/components/site/article-header";
import { AuthorCard } from "@/components/site/author-card";
import { RelatedPosts } from "@/components/site/related-posts";
import { CategoryHeader } from "@/components/site/category-header";
import { SubCategoryList } from "@/components/site/sub-category-list";
import { TableOfContents } from "@/components/site/table-of-contents";
import { parseTocFromMarkdown } from "@/lib/toc";
import { Pagination } from "@/components/site/pagination";

interface PageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lastSegment = slug[slug.length - 1];
  const isNumericId = /^\d+$/.test(lastSegment);

  // Article page (URL ends with numeric ID)
  if (isNumericId) {
    const post = await fetchAPI<Post | null>(
      `/posts/by-id/${lastSegment}`,
    ).catch(() => null);
    if (post) {
      return {
        title: post.seoTitle || post.title,
        description: post.seoDesc || post.excerpt || "",
        openGraph: {
          title: post.seoTitle || post.title,
          description: post.seoDesc || post.excerpt || "",
          type: "article",
          publishedTime: post.publishedAt || undefined,
          images: post.coverImage ? [post.coverImage] : undefined,
        },
      };
    }
    return { title: "文章未找到" };
  }

  // Category page (all segments form the category slug path)
  const fullSlug = slug.join("/");
  const category = await fetchAPI<Category | null>(
    `/categories/${fullSlug}`,
  ).catch(() => null);
  if (category) {
    return {
      title: category.name,
      description: category.description || `${category.name} 相关文章`,
    };
  }

  return { title: "页面未找到" };
}

// ============================================================
// Category Page Fallback Layout (当没有配置区块时使用)
// ============================================================
function CategoryFallbackLayout({
  category,
  page,
  pageSize,
  totalPosts,
}: {
  category: Category & { posts?: Post[] };
  page: number;
  pageSize: number;
  totalPosts: number;
}) {
  const posts = category.posts || [];
  const children = category.children || [];
  const totalPages = Math.max(1, Math.ceil(totalPosts / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CategoryHeader category={category} />

      {/* Sub-category list */}
      <SubCategoryList categories={children} />

      {/* Post list */}
      {posts.length > 0 ? (
        <section>
          <div className="mb-5 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">全部文章</h2>
            <span className="text-sm text-gray-400">({totalPosts})</span>
          </div>
          <PostList posts={posts} layout="grid" columns={2} />
          <Pagination currentPage={page} totalPages={totalPages} />
        </section>
      ) : (
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-500">该分类下暂无文章</p>
          <p className="mt-1 text-sm text-gray-400">
            请稍后再来，或浏览其他分类
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Article Detail Page
// ============================================================
async function ArticleDetailPage({ post }: { post: Post }) {
  // Fetch related posts from the same category
  let relatedPosts: Post[] = [];
  if (post.categoryId) {
    const result = await fetchAPI<{ data: Post[] }>(
      `/posts?categoryId=${post.categoryId}&pageSize=4&status=PUBLISHED`,
    ).catch(() => ({ data: [] }));
    relatedPosts = result.data;
  }

  // Parse TOC from markdown headings
  const tocItems = parseTocFromMarkdown(post.content);

  return (
    <article className="mx-auto px-4 py-8">
      {/* Content body + TOC sidebar */}
      <div className="flex justify-center">
        {/* Left: main content column */}
        <div className="flex-1 max-w-5xl min-w-0">
          {/* Article Header with cover image, meta, author */}
          <ArticleHeader post={post} />

          {/* Inline TOC (between header and body) + Sticky TOC portal */}
          {tocItems.length > 0 && <TableOfContents items={tocItems} />}

          {/* Post Content */}
          <div className="bg-white rounded-lg border border-gray-100 px-6 py-8 sm:px-10 sm:py-10 shadow-sm">
            <MarkdownRenderer content={post.content} />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                标签
              </span>
              {(
                post.tags as unknown as Array<{
                  tagId?: number;
                  tag?: { id?: number; name?: string; slug?: string };
                }>
              ).map((pt) => (
                <a
                  key={pt.tagId || pt.tag?.id}
                  href={pt.tag?.slug ? `/tag/${pt.tag.slug}` : "#"}
                  className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
                >
                  #{pt.tag?.name || ""}
                </a>
              ))}
            </div>
          )}

          {/* Author Card */}
          {post.author && <AuthorCard author={post.author} />}

          {/* Related Posts */}
          <RelatedPosts posts={relatedPosts} currentPostId={post.id} />
        </div>

        {/* Right: TOC sidebar (portal target) — only rendered when there are items */}
        {tocItems.length > 0 && (
          <div
            id="toc-sidebar"
            className="hidden lg:block w-[260px] shrink-0 ml-2"
          />
        )}
      </div>
    </article>
  );
}

// ============================================================
// Main Catch-All Page
// ============================================================
// URL routing rules:
//   Last segment is numeric → Article page  (/42, /docs/42, /docs/guide/42)
//   Otherwise              → Category page (/docs, /docs/guide)
export default async function CatchAllPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const lastSegment = slug[slug.length - 1];
  const isNumericId = /^\d+$/.test(lastSegment);

  // ── Article page ──
  if (isNumericId) {
    const post = await fetchAPI<Post | null>(
      `/posts/by-id/${lastSegment}`,
    ).catch(() => null);

    if (!post) notFound();
    return <ArticleDetailPage post={post} />;
  }

  // ── Category page ──
  const fullSlug = slug.join("/");
  const page = Math.max(1, parseInt(pageStr || "1") || 1);
  const pageSize = 20;

  const category = await fetchAPI<
    | (Category & {
        posts?: Post[];
        _page?: number;
        _pageSize?: number;
        _totalPosts?: number;
      })
    | null
  >(
    `/categories/${fullSlug}?withPosts=true&includeDescendants=true&page=${page}&pageSize=${pageSize}`,
  ).catch(() => null);

  if (!category) notFound();

  return (
    <CategoryFallbackLayout
      category={category}
      page={category._page || page}
      pageSize={category._pageSize || pageSize}
      totalPosts={category._totalPosts || category.posts?.length || 0}
    />
  );
}
