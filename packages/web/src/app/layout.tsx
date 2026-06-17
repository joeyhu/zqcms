import type { Metadata } from 'next';
import '@/styles/globals.css';
import { fetchAPI } from '@/lib/api-client';

async function getSettings(): Promise<Record<string, unknown>> {
  try {
    return await fetchAPI<Record<string, unknown>>('/site');
  } catch {
    return { siteName: 'ZQCMS', siteDescription: '内容管理系统' };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: {
      template: `%s | ${settings.siteName}`,
      default: settings.siteName as string,
    },
    description: (settings.siteDescription as string) || '',
    icons: (settings.favicon as string) ? { icon: settings.favicon as string } : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
