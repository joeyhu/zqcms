import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import '@/styles/globals.css';
import { fetchAPI } from '@/lib/api-client';

async function getSettings(): Promise<Record<string, unknown>> {
  try {
    return await fetchAPI<Record<string, unknown>>('/site');
  } catch {
    return { siteName: 'ZQCMS', siteDescription: '内容管理系统' };
  }
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:11001';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = (settings.siteName as string) || 'ZQCMS';
  const description = (settings.siteDescription as string) || '内容管理系统';

  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: `%s | ${title}`,
      default: title,
    },
    description,
    keywords: [title, 'CMS', '内容管理', '博客', '文章'],
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
    openGraph: {
      type: 'website',
      siteName: title,
      title,
      description,
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: '/',
      types: {
        'application/rss+xml': `${siteUrl}/rss.xml`,
      },
    },
    icons: (settings.favicon as string)
      ? { icon: new URL(settings.favicon as string, siteUrl).toString() }
      : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Sitemap discovery — 搜索引擎发现站点地图 */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </head>
      <body className="min-h-screen text-gray-900 antialiased site-bg">
        {/* Skip to content — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none"
        >
          跳转到主内容
        </a>

        {children}

        {/* Google Analytics */}
        <GAScript />
      </body>
    </html>
  );
}

/** Server component that conditionally injects Google Analytics */
async function GAScript() {
  try {
    const settings = await fetchAPI<{ gaId?: string | null }>('/site');
    if (settings?.gaId) {
      return <GoogleAnalytics gaId={settings.gaId} />;
    }
  } catch {
    // ignore
  }
  return null;
}
