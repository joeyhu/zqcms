"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, ExternalLink, Search } from "lucide-react";
import type { SiteSettings, Category } from "@zqcms/shared/types";
import { SearchPanel } from "./search-panel";

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
      {cat.url && <ExternalLink className="h-3 w-3 opacity-40" aria-hidden="true" />}
    </>
  );

  const linkClass = `group relative inline-flex items-center gap-1 transition-colors ${className}`;

  if (cat.url) {
    return (
      <a
        href={cat.url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        aria-current={isActive ? "page" : undefined}
      >
        {linkContent}
      </a>
    );
  }

  return (
    <Link
      href={`/${cat.slug}`}
      className={linkClass}
      aria-current={isActive ? "page" : undefined}
    >
      {linkContent}
      <span
        className={`
          absolute -bottom-0.5 left-0 right-0 mx-auto h-0.5 rounded-full
          bg-gradient-to-r from-blue-400 to-indigo-400
          transition-all duration-300
          ${isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"}
        `}
      />
    </Link>
  );
}

export function Header({ settings, categories }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  // Keyboard shortcut: ⌘K / Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";

  function isCategoryActive(cat: Category): boolean {
    return cat.slug === firstSegment;
  }

  const desktopLinkClass = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-white/10 text-white"
        : "text-gray-300 hover:text-white hover:bg-white/8"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl" aria-label={settings.siteName}>
          {settings.logo && (
            <img
              src={settings.logo}
              alt={settings.siteName}
              className="h-8 w-auto"
            />
          )}
          {settings.siteName && (
            <span className="text-white">{settings.siteName}</span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center md:flex" aria-label="主导航">
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
                    <div className="rounded-lg border border-gray-700 bg-gray-800 py-2 shadow-xl min-w-[160px]">
                      {children.map((child) => (
                        <NavLink
                          key={child.id}
                          cat={child}
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/8 hover:text-white"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Search + Mobile Toggle */}
        <div className="flex items-center gap-1">
          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
            aria-label="打开搜索 (⌘K)"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">搜索...</span>
            <kbd className="hidden lg:inline-flex items-center rounded border border-gray-600 bg-gray-700 px-1.5 py-0.5 text-xs font-mono text-gray-400">
              ⌘K
            </kbd>
          </button>

          {/* Mobile Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden rounded-lg p-2 text-gray-300 hover:bg-white/10"
            aria-label="打开搜索"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Mobile Toggle */}
          <button
            className="md:hidden rounded-lg p-2 text-gray-300 hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav
          id="mobile-menu"
          className="border-t border-gray-800 bg-gray-900 px-4 py-3 md:hidden"
          aria-label="移动端导航"
        >
          {topCategories.map((cat) => {
            const children = childMap.get(cat.id) || [];
            const active = isCategoryActive(cat);
            return (
              <div key={cat.id}>
                <div
                  className="block rounded-lg px-3 py-2 text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  <NavLink
                    cat={cat}
                    isActive={active}
                    className={active ? "text-white" : "text-gray-300"}
                  />
                </div>
                {!cat.url &&
                  children.map((child) => (
                    <div
                      key={child.id}
                      className="ml-4"
                      onClick={() => setMobileOpen(false)}
                    >
                      <NavLink
                        cat={child}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200"
                      />
                    </div>
                  ))}
              </div>
            );
          })}
        </nav>
      )}

      {/* Search Panel (global modal) */}
      <SearchPanel isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
