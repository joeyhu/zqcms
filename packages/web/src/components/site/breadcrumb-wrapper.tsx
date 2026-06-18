"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Breadcrumb } from "./breadcrumb";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:11001';

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
  const [articleTitle, setArticleTitle] = useState<string | null>(null);

  // ── Fetch article title when on an article page ──
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const lastSeg = segments[segments.length - 1];
    const isArticle = /^\d+$/.test(lastSeg);
    if (!isArticle) {
      setArticleTitle(null);
      return;
    }

    let cancelled = false;
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:11003/api';

    fetch(`${apiBase}/posts/by-id/${lastSeg}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((post) => {
        if (!cancelled && post?.title) {
          setArticleTitle(post.title);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pathname]);

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
      items.push({
        label: "标签",
        href: isLast ? undefined : "/tag",
      });
      continue;
    }

    // ── Numeric = article ID ──
    if (/^\d+$/.test(seg)) {
      items.push({
        label: articleTitle || "文章内容",
      });
      continue;
    }

    // ── Match category by building the full slug from accumulated segments ──
    const fullSlug = segments.slice(0, i + 1).join("/");
    const cat = categories.find((c) => c.slug === fullSlug);

    if (cat) {
      items.push({
        label: cat.name,
        href: accumulatedPath,
      });
      continue;
    }

    // ── Unknown segment ──
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
