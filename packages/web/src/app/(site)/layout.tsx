import { fetchAPI } from '@/lib/api-client';
import type { SiteSettings } from '@zqcms/shared/types';
import type { Category } from '@zqcms/shared/types';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { SiteSwitcher } from '@/components/site/site-switcher';
import { Breadcrumb } from '@/components/site/breadcrumb';
import { BreadcrumbWrapper } from '@/components/site/breadcrumb-wrapper';
import { BackToTop } from '@/components/site/back-to-top';

async function getSiteData(): Promise<{
  settings: SiteSettings;
  categories: Category[];
}> {
  try {
    const [site, categories] = await Promise.all([
      fetchAPI<SiteSettings>('/site'),
      fetchAPI<Category[]>('/categories?all=true'),
    ]);
    return { settings: site, categories };
  } catch {
    return {
      settings: {
        id: 0, siteName: 'ZQCMS', siteDescription: null,
        logo: null, favicon: null, primaryColor: '#3B82F6',
        contactEmail: null, contactPhone: null, address: null,
        socialLinks: null, footerText: null, copyright: null, gaId: null, icp: null,
        socialQRCodes: null,
        createdAt: '', updatedAt: '',
      } as SiteSettings,
      categories: [],
    };
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings, categories } = await getSiteData();

  return (
    <div className="flex min-h-screen flex-col relative z-[1]">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="blob w-[600px] h-[600px] bg-blue-400 -top-60 -right-40 animate-float" style={{ animationDuration: '20s', opacity: 0.08 }} />
        <div className="blob w-[500px] h-[500px] bg-indigo-400 bottom-0 -left-40 animate-float-slow" style={{ animationDuration: '16s', opacity: 0.06 }} />
        <div className="blob w-[300px] h-[300px] bg-purple-400 top-1/2 -right-20 animate-float-slow" style={{ animationDuration: '14s', animationDelay: '-3s', opacity: 0.05 }} />
      </div>

      <Header settings={settings} categories={categories} />
      <BreadcrumbWrapper categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <SiteSwitcher />
      <BackToTop />
    </div>
  );
}
