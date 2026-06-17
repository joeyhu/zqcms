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

  // 逐段查找对应的目录名
  let accumulatedPath = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    accumulatedPath += `/${seg}`;

    // Handle tag pages specially
    if (seg === 'tag') {
      items.push({ label: '标签' });
      continue;
    }

    if (i === segments.length - 1 && segments.length >= 2) {
      // 最后一段可能是文章 ID（纯数字）或子目录 slug
      if (/^\d+$/.test(seg)) {
        // 数字 ID → 文章详情页
        items.push({ label: '文章内容' });
      } else {
        const cat = categories.find((c) => c.slug === seg || c.slug.endsWith(`/${seg}`));
        if (cat) {
          items.push({ label: cat.name, href: accumulatedPath });
        } else {
          const displayName = seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          items.push({ label: displayName });
        }
      }
    } else {
      const cat = categories.find((c) => c.slug === seg || c.slug.endsWith(`/${seg}`));
      if (cat) {
        items.push({ label: cat.name, href: accumulatedPath });
      } else {
        items.push({ label: seg, href: accumulatedPath });
      }
    }
  }

  return <Breadcrumb items={items} />;
}
