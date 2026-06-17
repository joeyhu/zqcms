"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb } from "./breadcrumb";

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
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const items: { label: string; href?: string }[] = [
    { label: "首页", href: "/" },
  ];

  let accumulatedPath = "";

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    accumulatedPath += `/${seg}`;
    const isLast = i === segments.length - 1;

    // ── Tag pages ──
    if (seg === "tag") {
      items.push({ label: "标签", href: isLast ? undefined : "/tag" });
      continue;
    }

    // ── Numeric = article ID → "文章内容" ──
    if (/^\d+$/.test(seg)) {
      items.push({ label: "文章内容" });
      continue;
    }

    // ── Match category by building the full slug from accumulated segments ──
    // For URL /docs/guide, the fullSlug at i=0 is "docs", at i=1 is "docs/guide"
    const fullSlug = segments.slice(0, i + 1).join("/");
    const cat = categories.find((c) => c.slug === fullSlug);

    if (cat) {
      items.push({
        label: cat.name,
        // Last category segment: still link it (useful for subcategory pages)
        href: accumulatedPath,
      });
      continue;
    }

    // ── Unknown segment ──
    // Try to make it human-readable
    const displayName = seg
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    items.push({
      label: displayName,
      href: isLast ? undefined : accumulatedPath,
    });
  }

  return <Breadcrumb items={items} />;
}
