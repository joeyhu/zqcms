import { useState, useRef, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: ReactNode;
  /** 额外延迟，秒（默认0.35） */
  delay?: number;
}

export function Tooltip({ content, children, delay = 0.35 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [flip, setFlip] = useState<'top' | 'bottom'>('top');
  const timerRef = useRef<number | null>(null);
  const childRef = useRef<HTMLSpanElement | null>(null);

  const show = useCallback(() => {
    timerRef.current = window.setTimeout(() => {
      const el = childRef.current?.firstElementChild as HTMLElement;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // 默认在元素上方居中
      let y = rect.top - 8;
      let dir: 'top' | 'bottom' = 'top';
      // 如果上方空间不足，翻转到下方
      if (y < 60) {
        y = rect.bottom + 8;
        dir = 'bottom';
      }
      setPos({ x: rect.left + rect.width / 2, y });
      setFlip(dir);
      setVisible(true);
    }, delay * 1000);
  }, [delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <span ref={childRef} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: pos.x,
              top: pos.y,
              transform: `translate(-50%, ${flip === 'top' ? '-100%' : '0'})`,
            }}
          >
            <div className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg animate-in fade-in zoom-in-95 whitespace-nowrap">
              {content}
              <div
                className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
                  flip === 'top'
                    ? 'top-full border-t-gray-900'
                    : 'bottom-full border-b-gray-900'
                }`}
              />
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}
