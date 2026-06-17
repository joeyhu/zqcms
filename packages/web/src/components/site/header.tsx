"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ExternalLink } from "lucide-react";
import type { SiteSettings, Category } from "@zqcms/shared/types";

interface HeaderProps {
  settings: SiteSettings;
  categories: Category[];
}

interface NavLinkProps {
  cat: Category;
  className?: string;
  isActive?: boolean;
}

function NavLink({ cat, className = "", isActive }: NavLinkProps) {
  const linkContent = (
    <>
      {cat.name}
      {cat.url && <ExternalLink className="h-3 w-3 opacity-40" />}
    </>
  );

  const linkClass = `group relative inline-flex items-center gap-1 transition-colors ${className}`;

  if (cat.url) {
    return (
      <a href={cat.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {linkContent}
      </a>
    );
  }

  return (
    <Link href={`/${cat.slug}`} className={linkClass}>
      {linkContent}
      <span
        className={`
          absolute -bottom-0.5 left-0 right-0 mx-auto h-0.5 rounded-full
          bg-gradient-to-r from-blue-500 to-indigo-500
          transition-all duration-300
          ${isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'}
        `}
      />
    </Link>
  );
}

export function Header({ settings, categories }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const visibleCategories = categories.filter((c) => c.isVisible);
  const topCategories = visibleCategories.filter((c) => !c.parentId);
  const childMap = new Map<number, Category[]>();
  for (const c of visibleCategories) {
    if (c.parentId) {
      const list = childMap.get(c.parentId) || [];
      list.push(c);
      childMap.set(c.parentId, list);
    }
  }

  // ── Determine active top-level category ──
  // /docs, /docs/guide, /docs/42, /docs/guide/42 → "docs" active
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] || '';

  function isCategoryActive(cat: Category): boolean {
    return cat.slug === firstSegment;
  }

  const desktopLinkClass = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          {settings.logo && (
            <img src={settings.logo} alt={settings.siteName} className="h-8 w-auto" />
          )}
          {settings.siteName && (
            <span className="text-blue-600">{settings.siteName}</span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {topCategories.map((cat) => {
            const children = childMap.get(cat.id) || [];
            const active = isCategoryActive(cat);

            if (children.length === 0) {
              return (
                <NavLink
                  key={cat.id}
                  cat={cat}
                  isActive={active}
                  className={desktopLinkClass(active)}
                />
              );
            }

            return (
              <div key={cat.id} className="group relative">
                <NavLink
                  cat={cat}
                  isActive={active}
                  className={`flex items-center gap-1 ${desktopLinkClass(active)}`}
                />
                {!cat.url && (
                  <div className="invisible absolute left-0 top-full pt-1 opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-50">
                    <div className="rounded-lg border bg-white py-2 shadow-lg min-w-[160px]">
                      {children.map((child) => (
                        <NavLink
                          key={child.id}
                          cat={child}
                          className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="border-t bg-white px-4 py-3 md:hidden">
          {topCategories.map((cat) => {
            const children = childMap.get(cat.id) || [];
            const active = isCategoryActive(cat);
            return (
              <div key={cat.id}>
                <div className="block rounded-lg px-3 py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
                  <NavLink
                    cat={cat}
                    isActive={active}
                    className={active ? 'text-blue-700' : 'text-gray-700'}
                  />
                </div>
                {!cat.url &&
                  children.map((child) => (
                    <div key={child.id} className="ml-4" onClick={() => setMobileOpen(false)}>
                      <NavLink
                        cat={child}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                      />
                    </div>
                  ))}
              </div>
            );
          })}
        </nav>
      )}
    </header>
  );
}
