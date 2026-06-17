import { fetchAPI } from '@/lib/api-client';
import type { PageBlock } from '@zqcms/shared/types';
import { PageBlockRenderer } from '@/components/site/blocks';

function FallbackHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-28 sm:py-40">
      {/* Decorative blobs */}
      <div className="blob w-80 h-80 bg-blue-500 -top-40 -right-20 animate-float" />
      <div className="blob w-64 h-64 bg-indigo-500 bottom-10 -left-20 animate-float-slow" style={{ animationDelay: '-2s' }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Animated icon */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/25 animate-float">
          <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>

        <h1 className="animate-fade-in-up text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl [text-shadow:0_2px_20px_rgba(59,130,246,0.3)]">
          欢迎使用 ZQCMS
        </h1>

        <p className="animate-fade-in-up stagger-1 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-blue-100/80">
          数据驱动的现代内容管理系统，轻松构建多站点内容平台
        </p>

        <div className="animate-fade-in-up stagger-2 mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="http://localhost:11002"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-bold text-blue-700 shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:scale-105 active:scale-95"
          >
            进入管理后台
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </a>
        </div>

        <p className="animate-fade-in stagger-3 mt-8 text-sm text-blue-200/50">
          默认管理员：admin@zqcms.com / admin123
        </p>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const blocks = await fetchAPI<PageBlock[]>(
    '/page-blocks?pageType=home'
  ).catch(() => []);

  const visibleBlocks = blocks.filter((b) => b.isVisible);

  if (visibleBlocks.length === 0) {
    return <FallbackHero />;
  }

  return (
    <>
      {visibleBlocks.map((block) => (
        <PageBlockRenderer key={block.id} block={block} />
      ))}
    </>
  );
}
