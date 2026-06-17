import { fetchAPI } from '@/lib/api-client';
import { PostList } from '@/components/site/post-list';
import { getCardStyleClasses, getResponsiveGridClass, type CardStyleConfig, type ResponsiveColumnsConfig } from './card-style-utils';
import type { Post } from '@zqcms/shared/types';

interface PostListBlockProps {
  config: {
    categoryId?: number;
    limit?: number;
    sortBy?: string;
    layout?: string;
    columns?: number;
    cardStyle?: CardStyleConfig;
    responsiveColumns?: ResponsiveColumnsConfig;
  };
}

export async function PostListBlock({ config }: PostListBlockProps) {
  const { categoryId, limit = 6, layout = 'grid' } = config;
  const { baseClass: cardClass, isLightText } = getCardStyleClasses(config.cardStyle);
  const gridClass = getResponsiveGridClass(config.responsiveColumns || { desktop: config.columns || 3 });

  const queryParams = new URLSearchParams({
    pageSize: String(limit),
    status: 'PUBLISHED',
  });
  if (categoryId) queryParams.set('categoryId', String(categoryId));

  const result = await fetchAPI<{ data: Post[] }>(`/posts?${queryParams.toString()}`).catch(() => ({ data: [] }));

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <PostList
          posts={result.data}
          layout={layout as 'grid' | 'list'}
          columns={config.responsiveColumns?.desktop || config.columns || 3}
          cardClass={cardClass}
          isLightText={isLightText}
          gridClass={gridClass}
          emptyMessage="暂无文章"
        />
      </div>
    </section>
  );
}
