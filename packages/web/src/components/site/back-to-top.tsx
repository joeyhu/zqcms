'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    setVisible(window.scrollY > 300);
  }, []);

  useEffect(() => {
    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="回到顶部"
      title="回到顶部"
      className={`
        fixed bottom-6 right-6 z-50
        flex h-10 w-10 items-center justify-center
        rounded-full bg-blue-600 text-white
        shadow-lg shadow-blue-600/30
        transition-all duration-300 ease-in-out
        hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40 hover:scale-110
        active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}
      `}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
