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
    <div className="flex min-h-screen flex-col">
      <Header settings={settings} categories={categories} />
      <BreadcrumbWrapper categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <SiteSwitcher />
      <BackToTop />
    </div>
  );
}
