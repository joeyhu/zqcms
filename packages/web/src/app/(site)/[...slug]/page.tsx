import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchAPI } from '@/lib/api-client';
import type { Category, Post } from '@zqcms/shared/types';
import type { PageBlock } from '@zqcms/shared/types';
import { PageBlockRenderer } from '@/components/site/blocks';
import { MarkdownRenderer } from '@/components/site/markdown-renderer';
import { PostList } from '@/components/site/post-list';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Category page
  if (slug.length === 1) {
    const category = await fetchAPI<Category | null>(`/categories/${slug[0]}`);
    if (category) {
      return {
        title: category.name,
        description: category.description || `${category.name} 相关文章`,
      };
    }
  }

  // Post page
  if (slug.length >= 2) {
    const categorySlug = slug[slug.length - 2];
    const lastSegment = slug[slug.length - 1];
    const isNumericId = /^\d+$/.test(lastSegment);
    const post = await fetchAPI<Post | null>(
      isNumericId ? `/posts/by-id/${lastSegment}` : `/posts/${categorySlug}/${lastSegment}`
    ).catch(() => null);
    if (post) {
      return {
        title: post.seoTitle || post.title,
        description: post.seoDesc || post.excerpt || '',
        openGraph: {
          title: post.seoTitle || post.title,
          description: post.seoDesc || post.excerpt || '',
          type: 'article',
          publishedTime: post.publishedAt || undefined,
        },
      };
    }
  }

  return { title: '页面未找到' };
}

// Hardcoded fallback layout for category pages (when no blocks configured)
function CategoryFallbackLayout({ category }: { category: Category & { posts?: Post[] } }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Category Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="mt-3 text-lg text-gray-500">{category.description}</p>
        )}
        {category.children && category.children.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {category.children.map((child: { id: number; name: string; slug: string }) => (
              <a
                key={child.id}
                href={`/${child.slug}`}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
              >
                {child.name}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Posts List */}
      <PostList
        posts={category.posts || []}
        layout="grid"
        columns={3}
        emptyMessage="该分类下暂无文章"
      />
    </div>
  );
}

export default async function CatchAllPage({ params }: PageProps) {
  const { slug } = await params;

  // Case 1: Single segment → Category page (e.g., /docs)
  if (slug.length === 1) {
    const [blocks, category] = await Promise.all([
      fetchAPI<PageBlock[]>(`/categories/blocks?slug=${slug[0]}`).catch(() => [] as PageBlock[]),
      fetchAPI<Category & { posts: Post[] } | null>(
        `/categories/${slug[0]}?withPosts=true`
      ).catch(() => null),
    ]);

    if (!category) notFound();

    const visibleBlocks = blocks.filter((b: PageBlock) => b.isVisible);
    if (visibleBlocks.length > 0) {
      return (
        <>
          {visibleBlocks.map((block) => (
            <PageBlockRenderer key={block.id} block={block} />
          ))}
        </>
      );
    }

    // Fallback to hardcoded layout
    return <CategoryFallbackLayout category={category} />;
  }

  // Case 2: Two segments → Post page (e.g., /docs/42 or /docs/getting-started)
  const categorySlug = slug[slug.length - 2];
  const lastSegment = slug[slug.length - 1];
  const isNumericId = /^\d+$/.test(lastSegment);

  let post: Post | null = null;
  if (isNumericId) {
    // URL 使用数字 ID /docs/42
    post = await fetchAPI<Post | null>(`/posts/by-id/${lastSegment}`).catch(() => null);
  } else {
    // 兼容旧版 slug URL /docs/getting-started
    post = await fetchAPI<Post | null>(`/posts/${categorySlug}/${lastSegment}`).catch(() => null);
  }

  if (!post) {
    // Maybe it's a nested category page? Try fetching as a category
    const fullSlug = slug.join('/');
    const [blocks, category] = await Promise.all([
      fetchAPI<PageBlock[]>(`/categories/blocks?slug=${encodeURIComponent(fullSlug)}`).catch(() => [] as PageBlock[]),
      fetchAPI<Category & { posts: Post[] } | null>(
        `/categories/${fullSlug}?withPosts=true`
      ).catch(() => null),
    ]);

    if (category) {
      const visibleBlocks = blocks.filter((b: PageBlock) => b.isVisible);
      if (visibleBlocks.length > 0) {
        return (
          <>
            {visibleBlocks.map((block) => (
              <PageBlockRenderer key={block.id} block={block} />
            ))}
          </>
        );
      }

      // Fallback to hardcoded layout
      return <CategoryFallbackLayout category={category} />;
    }

    notFound();
  }

  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
      {/* Post Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
          {post.category && (
            <a href={`/${post.category.slug}`} className="text-blue-600 hover:text-blue-800">
              {post.category.name}
            </a>
          )}
          {post.publishedAt && (
            <time>{new Date(post.publishedAt).toLocaleDateString('zh-CN')}</time>
          )}
          {post.viewCount > 0 && (
            <span>{post.viewCount} 次浏览</span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{post.title}</h1>
        {post.excerpt && (
          <p className="mt-3 text-lg text-gray-500">{post.excerpt}</p>
        )}
        {post.author && (
          <p className="mt-2 text-sm text-gray-400">作者：{post.author.name || post.author.email}</p>
        )}
      </header>

      {/* Post Content */}
      <MarkdownRenderer content={post.content} />

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2 border-t pt-6">
          {(post.tags as unknown as Array<{ tagId?: number; tag?: { name?: string } }>).map((pt) => (
            <span key={pt.tagId} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              {pt.tag?.name || ''}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
