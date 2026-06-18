import { useRef, useEffect, useCallback } from 'react';

interface AutoExpandingTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Minimum rows when empty (default: 2) */
  minRows?: number;
  /** Maximum rows before showing scrollbar (default: 20) */
  maxRows?: number;
}

/**
 * A textarea that automatically expands vertically as the user types,
 * eliminating the need for internal scrollbars.
 */
export function AutoExpandingTextarea({
  minRows = 2,
  maxRows = 20,
  onChange,
  className = '',
  ...props
}: AutoExpandingTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // Reset to auto to get correct scrollHeight
    el.style.height = 'auto';

    // Calculate line height from computed style
    const style = getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const minHeight = lineHeight * minRows + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const maxHeight = lineHeight * maxRows + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

    const newHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [minRows, maxRows]);

  // Adjust on value change
  useEffect(() => {
    adjustHeight();
  }, [props.value, adjustHeight]);

  // Initial adjustment on mount
  useEffect(() => {
    adjustHeight();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    onChange?.(e);
  };

  const baseClass =
    'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-colors';

  return (
    <textarea
      ref={ref}
      onChange={handleChange}
      className={`${baseClass} ${className}`}
      rows={minRows}
      {...props}
    />
  );
}
