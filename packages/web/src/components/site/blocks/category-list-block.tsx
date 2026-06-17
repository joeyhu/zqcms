import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { fetchAPI } from '@/lib/api-client';
import type { Category } from '@zqcms/shared/types';
import { getCardStyleClasses, getResponsiveGridClass, type CardStyleConfig, type ResponsiveColumnsConfig } from './card-style-utils';

interface CategoryListBlockProps {
  config: {
    parentId?: number;
    columns?: number;
    showCount?: boolean;
    cardStyle?: CardStyleConfig;
    responsiveColumns?: ResponsiveColumnsConfig;
  };
}

export async function CategoryListBlock({ config }: CategoryListBlockProps) {
  const { showCount = true } = config;
  const { baseClass: cardClass, isLightText } = getCardStyleClasses(config.cardStyle);
  const gridClass = getResponsiveGridClass(config.responsiveColumns || { desktop: config.columns || 3 });

  const categories = await fetchAPI<Category[]>('/categories').catch(() => []);
  const visible = config.parentId
    ? categories.filter((c) => c.parentId === config.parentId && c.isVisible)
    : categories.filter((c) => c.isVisible && !c.parentId);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className={`grid gap-4 ${gridClass}`}>
          {visible.map((cat) => {
            const content = (
              <>
                <div className="flex items-start justify-between">
                  <h3 className={`font-semibold text-lg ${isLightText ? 'text-current' : 'text-gray-900'}`}>
                    {cat.name}
                  </h3>
                  {cat.url && (
                    <ExternalLink className={`h-4 w-4 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isLightText ? 'text-current opacity-60' : 'text-gray-300'}`} />
                  )}
                </div>
                {cat.description && (
                  <p className={`mt-2 text-sm line-clamp-2 ${isLightText ? 'text-current opacity-80' : 'text-gray-500'}`}>
                    {cat.description}
                  </p>
                )}
                {!cat.url && showCount && cat._count && (
                  <p className={`mt-3 text-xs ${isLightText ? 'text-current opacity-50' : 'text-gray-400'}`}>
                    {cat._count.posts} 篇文章
                  </p>
                )}
              </>
            );

            const className = `block ${cardClass} p-6 shadow-sm hover:shadow-md transition-all duration-300 relative group`;

            if (cat.url) {
              return (
                <a key={cat.id} href={cat.url} target="_blank" rel="noopener noreferrer" className={className}>
                  {content}
                </a>
              );
            }
            return (
              <Link key={cat.id} href={`/${cat.slug}`} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
