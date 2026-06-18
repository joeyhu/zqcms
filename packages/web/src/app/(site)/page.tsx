import { fetchAPI } from "@/lib/api-client";
import type { Post, Tag, Category } from "@zqcms/shared/types";
import { PostList } from "@/components/site/post-list";
import { Flame, Hash, FolderOpen, ArrowRight } from "lucide-react";
import { getIconComponent } from "@/lib/icon";
import Link from "next/link";

// ── Enhanced Section Title ──
function SectionTitle({
  icon: Icon,
  title,
  subtitle,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  href?: string;
}) {
  const content = (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {href && (
          <span className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
            查看全部
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block">
        {content}
      </Link>
    );
  }
  return content;
}

// ── Home Page ──
export default async function HomePage() {
  const hotResult = await fetchAPI<{ data: Post[]; total: number }>(
    "/posts?orderBy=viewCount&orderDir=desc&status=PUBLISHED&pageSize=12",
  ).catch(() => ({ data: [] as Post[], total: 0 }));

  const tags = await fetchAPI<Tag[]>("/tags").catch(() => [] as Tag[]);
  const topTags = [...tags]
    .sort((a, b) => (b._count?.posts ?? 0) - (a._count?.posts ?? 0))
    .slice(0, 30);

  const topCategories = await fetchAPI<Category[]>(
    "/categories?tree=true",
  ).catch(() => [] as Category[]);

  const hasContent =
    hotResult.data.length > 0 || topTags.length > 0 || topCategories.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-0 sm:px-6">
      {/* ================================================================ */}
      {/* Hero / Welcome Banner (shown when there's content)                */}
      {/* ================================================================ */}
      {hasContent && (
        <div className="relative overflow-hidden  bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 mb-12 mt-0">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />
          <div className="absolute -top-32 -right-16 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative px-6 py-10 sm:px-10 sm:py-12">
            <h1 className="animate-fade-in-up text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              探索精彩内容
            </h1>
            <p className="animate-fade-in-up stagger-1 mt-3 max-w-xl text-base text-blue-200/70 leading-relaxed">
              发现热门文章、探索标签话题、浏览分类目录
            </p>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Section 1: Hot Articles                                          */}
      {/* ================================================================ */}
      {hotResult.data.length > 0 && (
        <section className="animate-fade-in-up mb-16">
          <SectionTitle
            icon={Flame}
            title="热门文章"
            subtitle="最受欢迎的内容"
          />
          <PostList
            posts={hotResult.data}
            layout="grid"
            columns={2}
            staggered
          />
        </section>
      )}

      {/* ================================================================ */}
      {/* Section 2: Top Tags                                              */}
      {/* ================================================================ */}
      {topTags.length > 0 && (
        <section className="animate-fade-in-up stagger-1 mb-16">
          <SectionTitle
            icon={Hash}
            title="热门标签"
            subtitle={`共 ${tags.length} 个标签，展示前 ${topTags.length} 个`}
          />
          <div className="flex flex-wrap gap-2.5">
            {topTags.map((tag, i) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className={`animate-scale-in inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 hover:shadow-md hover:-translate-y-0.5`}
                style={{ animationDelay: `${i * 0.03}s` }}
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
      {/* Empty State                                                      */}
      {/* ================================================================ */}
      {!hasContent && (
        <div className="py-32 text-center animate-fade-in">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl animate-float">
            <Flame className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">欢迎使用 ZQCMS</h2>
          <p className="mt-3 text-gray-500">开始创建文章和目录来构建您的站点</p>
        </div>
      )}
    </div>
  );
}

// ── Async component: latest posts for a category ──
async function CategoryLatestPosts({ categorySlug }: { categorySlug: string }) {
  const result = await fetchAPI<{ data: Post[]; total: number }>(
    `/posts?categorySlug=${encodeURIComponent(categorySlug)}&status=PUBLISHED&pageSize=4`,
  ).catch(() => ({ data: [] as Post[], total: 0 }));

  if (result.data.length === 0) {
    return <p className="text-sm text-gray-400 py-4">该分类下暂无文章</p>;
  }

  return <PostList posts={result.data} layout="grid" columns={2} staggered />;
}
