import { fetchAPI } from '@/lib/api-client';
import type { PageBlock } from '@zqcms/shared/types';
import { PageBlockRenderer } from '@/components/site/blocks';

export default async function HomePage() {
  const blocks = await fetchAPI<PageBlock[]>(
    '/page-blocks?pageType=home'
  ).catch(() => []);

  const visibleBlocks = blocks.filter((b) => b.isVisible);

  if (visibleBlocks.length === 0) {
    // Fallback: show a basic hero if no blocks configured
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900">欢迎使用 ZQCMS</h1>
        <p className="mt-4 text-lg text-gray-500">
          请在管理后台配置首页内容。默认管理员账号：admin@zqcms.com / admin123
        </p>
      </div>
    );
  }

  return (
    <>
      {visibleBlocks.map((block) => (
        <PageBlockRenderer key={block.id} block={block} />
      ))}
    </>
  );
}
