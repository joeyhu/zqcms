import { fetchAPI } from '@/lib/api-client';
import type { Post, Tag, Category } from '@zqcms/shared/types';
import { PostList } from '@/components/site/post-list';
import { Flame, Hash, FolderOpen } from 'lucide-react';
import { getIconComponent } from '@/lib/icon';
import Link from 'next/link';

// ── Section Title ──
function SectionTitle({
  icon: Icon,
  title,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-2.5 mb-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group inline-block">
        {content}
      </Link>
    );
  }
  return content;
}

// ── Home Page ──
export default async function HomePage() {
  // 1. Hot articles: sorted by viewCount desc
  const hotResult = await fetchAPI<{ data: Post[]; total: number }>(
    '/posts?orderBy=viewCount&orderDir=desc&status=PUBLISHED&pageSize=12',
  ).catch(() => ({ data: [] as Post[], total: 0 }));

  // 2. All tags, sorted by post count desc, top 30
  const tags = await fetchAPI<Tag[]>('/tags').catch(() => [] as Tag[]);
  const topTags = [...tags]
    .sort((a, b) => (b._count?.posts ?? 0) - (a._count?.posts ?? 0))
    .slice(0, 30);

  // 3. Category tree (top-level with children)
  const topCategories = await fetchAPI<Category[]>(
    '/categories?tree=true',
  ).catch(() => [] as Category[]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* ================================================================ */}
      {/* Section 1: Hot Articles                                          */}
      {/* ================================================================ */}
      {hotResult.data.length > 0 && (
        <section className="mb-14">
          <SectionTitle icon={Flame} title="热门文章" />
          <PostList posts={hotResult.data} layout="grid" columns={3} />
        </section>
      )}

      {/* ================================================================ */}
      {/* Section 2: Top Tags                                              */}
      {/* ================================================================ */}
      {topTags.length > 0 && (
        <section className="mb-14">
          <SectionTitle icon={Hash} title="热门标签" />
          <div className="flex flex-wrap gap-2.5">
            {topTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 hover:shadow-md"
              >
                <Hash className="h-3.5 w-3.5 text-amber-400" />
                {tag.name}
                <span className="ml-0.5 text-xs text-gray-400">
                  {tag._count?.posts ?? 0}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* Section 3: Category Sections                                     */}
      {/* ================================================================ */}
      {topCategories.map((cat) => (
        <section key={cat.id} className="mb-14">
          <SectionTitle
            icon={FolderOpen}
            title={cat.name}
            href={`/${cat.slug}`}
          />

          {cat.children && cat.children.length > 0 ? (
            /* Subcategory cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.children.map((child) => {
                const ChildIcon = getIconComponent(child.icon);
                return (
                  <Link
                    key={child.id}
                    href={`/${child.slug}`}
                    className="group flex items-start gap-4 rounded-lg border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 transition-colors group-hover:from-blue-100 group-hover:to-indigo-100">
                      <ChildIcon className="h-5 w-5" />
                    </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {child.name}
                    </h3>
                    {child.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {child.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-xs text-gray-400">
                        {child._count?.posts ?? 0} 篇文章
                      </span>
                    </div>
                  </div>
                </Link>
                );
              })}
            </div>
          ) : (
            /* No subcategories: show recent posts from this category */
            <CategoryLatestPosts categorySlug={cat.slug} />
          )}
        </section>
      ))}

      {/* Empty state */}
      {hotResult.data.length === 0 &&
        topTags.length === 0 &&
        topCategories.length === 0 && (
          <div className="py-32 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl">
              <Flame className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">欢迎使用 ZQCMS</h2>
            <p className="mt-3 text-gray-500">
              开始创建文章和目录来构建您的站点
            </p>
          </div>
        )}
    </div>
  );
}

// ── Async component: latest posts for a category ──
async function CategoryLatestPosts({
  categorySlug,
}: {
  categorySlug: string;
}) {
  const result = await fetchAPI<{ data: Post[]; total: number }>(
    `/posts?categorySlug=${encodeURIComponent(categorySlug)}&status=PUBLISHED&pageSize=4`,
  ).catch(() => ({ data: [] as Post[], total: 0 }));

  if (result.data.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4">该分类下暂无文章</p>
    );
  }

  return <PostList posts={result.data} layout="grid" columns={2} />;
}
