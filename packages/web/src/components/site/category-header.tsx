import type { Category } from '@zqcms/shared/types';
import { FolderOpen, ChevronRight } from 'lucide-react';
import { getIconComponent } from '@/lib/icon';

interface CategoryHeaderProps {
  category: Category & { posts?: { id: number }[] };
}

export function CategoryHeader({ category }: CategoryHeaderProps) {
  const postCount = category._count?.posts ?? category.posts?.length ?? 0;
  const IconComp = getIconComponent(category.icon);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 mb-8">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute -top-40 -right-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative px-6 py-10 sm:px-10 sm:py-14">
        {/* Breadcrumb hint */}
        <div className="flex items-center gap-2 text-sm text-blue-200/60 mb-4">
          <a href="/" className="hover:text-blue-200 transition-colors">首页</a>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-blue-200">{category.name}</span>
        </div>

        {/* Icon + Title */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-sm">
            <IconComp className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {category.name}
            </h1>
            <div className="mt-1.5 flex items-center gap-2 text-blue-200/80">
              <span className="text-sm">{postCount} 篇文章</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {category.description && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-blue-100/80">
            {category.description}
          </p>
        )}
      </div>
    </div>
  );
}
