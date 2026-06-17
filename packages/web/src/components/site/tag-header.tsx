import type { Tag } from '@zqcms/shared/types';
import { Hash } from 'lucide-react';

interface TagHeaderProps {
  tag: Tag;
  postCount: number;
}

export function TagHeader({ tag, postCount }: TagHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-500 to-rose-500 mb-8">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute -top-32 -right-16 w-72 h-72 rounded-full bg-orange-400/20 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-rose-400/20 blur-3xl" />

      <div className="relative px-6 py-10 sm:px-10 sm:py-12">
        {/* Tag badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 border border-white/20">
          <Hash className="h-4 w-4 text-white/70" />
          <span className="text-sm font-medium text-white/80">标签</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {tag.name}
        </h1>

        {/* Post count */}
        <div className="mt-3 flex items-center gap-2 text-white/70">
          <span className="text-sm">{postCount} 篇文章</span>
        </div>
      </div>
    </div>
  );
}
