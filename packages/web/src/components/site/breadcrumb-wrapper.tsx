'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumb } from './breadcrumb';

interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
}

interface BreadcrumbWrapperProps {
  categories: CategoryInfo[];
}

export function BreadcrumbWrapper({ categories }: BreadcrumbWrapperProps) {
  const pathname = usePathname();
  if (pathname === '/') return null; // 首页不显示

  const segments = pathname.split('/').filter(Boolean);
  const items: { label: string; href?: string }[] = [
    { label: '首页', href: '/' },
  ];

  let accumulatedPath = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    accumulatedPath += `/${seg}`;
    const isLast = i === segments.length - 1;

    // ── Tag pages ──
    if (seg === 'tag') {
      items.push({ label: '标签', href: isLast ? undefined : '/tag' });
      continue;
    }

    // ── Numeric = article ID → "文章内容" ──
    if (/^\d+$/.test(seg)) {
      items.push({ label: '文章内容' });
      continue;
    }

    // ── Try to match a known category ──
    const cat = categories.find(
      (c) => c.slug === seg || c.slug.endsWith(`/${seg}`),
    );
    if (cat) {
      items.push({ label: cat.name, href: isLast ? undefined : accumulatedPath });
      continue;
    }

    // ── Unknown slug segment (e.g., article slug, or unmatched path) ──
    if (isLast) {
      const displayName = seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      items.push({ label: displayName });
    } else {
      items.push({ label: seg, href: accumulatedPath });
    }
  }

  return <Breadcrumb items={items} />;
}
