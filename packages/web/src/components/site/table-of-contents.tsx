"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { List, X } from "lucide-react";

export interface TocItem {
  id: string;
  text: string;
  level: number; // 1-6
}

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const inlineRef = useRef<HTMLDivElement>(null);
  const headingObserverRef = useRef<IntersectionObserver | null>(null);

  // ── Portal target (SSR-safe) ──
  useEffect(() => {
    setPortalReady(true);
  }, []);

  // ── Track visible headings for active highlight ──
  useEffect(() => {
    if (items.length === 0) return;

    const headingElements = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (headingElements.length === 0) return;

    const visibleHeadings = new Map<string, boolean>();

    headingObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleHeadings.set(entry.target.id, entry.isIntersecting);
        });
        for (const item of items) {
          if (visibleHeadings.get(item.id)) {
            setActiveId(item.id);
            return;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    headingElements.forEach((el) => headingObserverRef.current?.observe(el));
    return () => headingObserverRef.current?.disconnect();
  }, [items]);

  // ── Track inline TOC visibility → show/hide sticky TOC ──
  useEffect(() => {
    const el = inlineRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { rootMargin: "-40px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ── Scroll to heading ──
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top, behavior: "smooth" });
        setActiveId(id);
        setIsOpen(false);
      }
    },
    [],
  );

  // ── Close drawer on Escape ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (items.length === 0) return null;

  // ── Shared TOC nav ──
  const TocNav = ({ compact }: { compact?: boolean }) => (
    <nav className="space-y-0.5">
      <h4
        className={
          compact
            ? "text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3"
            : "text-sm font-semibold text-gray-900 mb-3"
        }
      >
        目录
      </h4>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={(e) => handleClick(e, item.id)}
          className={`
            group flex items-center py-1.5 text-sm leading-snug transition-colors duration-150 border-l-2
            ${item.level === 1 || item.level === 2 ? "pl-3" : ""}
            ${item.level === 3 ? "pl-6" : ""}
            ${item.level === 4 ? "pl-9" : ""}
            ${item.level === 5 ? "pl-12" : ""}
            ${item.level === 6 ? "pl-[60px]" : ""}
            ${
              activeId === item.id
                ? "border-blue-500 text-blue-700 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }
          `}
        >
          <span className="truncate">{item.text}</span>
        </a>
      ))}
    </nav>
  );

  const portalTarget = portalReady
    ? document.getElementById("toc-sidebar")
    : null;

  return (
    <>
      {/* ================================================================ */}
      {/*  Inline TOC — between ArticleHeader and content body             */}
      {/* ================================================================ */}
      <div ref={inlineRef}>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <TocNav />
        </div>
      </div>

      {/* ================================================================ */}
      {/*  Sticky TOC → Portal to right sidebar (#toc-sidebar)             */}
      {/* ================================================================ */}
      {portalTarget &&
        createPortal(
          <div
            className={`
              sticky top-20 max-h-[calc(100vh-7rem)] overflow-y-auto
              rounded-xl border border-gray-100 bg-white shadow-lg p-4
              transition-all duration-300 ease-out
              ${
                showSticky
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 pointer-events-none"
              }
            `}
          >
            <TocNav compact />
          </div>,
          portalTarget,
        )}

      {/* ================================================================ */}
      {/*  Mobile: floating button + bottom drawer                         */}
      {/* ================================================================ */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-white shadow-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:shadow-xl transition-shadow"
        >
          <List className="h-4 w-4" />
          目录
        </button>

        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}

        <div
          className={`
            fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl
            transition-transform duration-300 ease-out
            max-h-[70vh] overflow-y-auto p-5
            ${isOpen ? "translate-y-0" : "translate-y-full"}
          `}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">目录</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <TocNav />
        </div>
      </div>
    </>
  );
}
