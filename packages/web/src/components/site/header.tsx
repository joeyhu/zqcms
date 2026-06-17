'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import type { SiteSettings, Category } from '@zqcms/shared/types';

interface HeaderProps {
  settings: SiteSettings;
  categories: Category[];
}

export function Header({ settings, categories }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo / Site Name */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          {settings.logo ? (
            <img src={settings.logo} alt={settings.siteName} className="h-8 w-auto" />
          ) : (
            <span className="text-blue-600">{settings.siteName}</span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {topCategories.map((cat) => {
            const children = childMap.get(cat.id) || [];
            const href = `/${cat.slug}`;

            if (children.length === 0) {
              return (
                <Link
                  key={cat.id}
                  href={href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  {cat.name}
                </Link>
              );
            }

            return (
              <div key={cat.id} className="group relative">
                <Link
                  href={href}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  {cat.name}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Link>
                <div className="invisible absolute left-0 top-full pt-1 opacity-0 group-hover:visible group-hover:opacity-100 transition-all">
                  <div className="rounded-lg border bg-white py-2 shadow-lg min-w-[160px]">
                    {children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/${child.slug}`}
                        className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
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
            return (
              <div key={cat.id}>
                <Link
                  href={`/${cat.slug}`}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {cat.name}
                </Link>
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/${child.slug}`}
                    className="ml-4 block rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
      )}
    </header>
  );
}
