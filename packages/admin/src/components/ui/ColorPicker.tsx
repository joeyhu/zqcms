import { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#6B7280',
  '#78716C', '#1F2937', '#111827', '#ffffff', '#000000',
];

/**
 * Color picker with text input + native palette popup + preset swatches.
 */
export function ColorPicker({
  value,
  onChange,
  className = '',
  placeholder = '#3B82F6',
}: ColorPickerProps) {
  const [showPalette, setShowPalette] = useState(false);
  const [textValue, setTextValue] = useState(value || '');
  const paletteRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Sync external value
  useEffect(() => {
    setTextValue(value || '');
  }, [value]);

  // Close palette on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setShowPalette(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setTextValue(newVal);
    // Only propagate if it looks like a valid color
    if (/^#?[0-9a-fA-F]{0,8}$/.test(newVal)) {
      const normalized = newVal.startsWith('#') ? newVal : `#${newVal}`;
      if (normalized.length >= 4) {
        onChange(normalized);
      }
    }
  };

  const handleTextBlur = () => {
    // Normalize on blur
    let normalized = textValue.trim();
    if (normalized && !normalized.startsWith('#')) normalized = `#${normalized}`;
    if (/^#[0-9a-fA-F]{3,8}$/.test(normalized)) {
      onChange(normalized);
      setTextValue(normalized);
    }
  };

  const handlePresetClick = (color: string) => {
    onChange(color);
    setTextValue(color);
    setShowPalette(false);
  };

  const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    onChange(color);
    setTextValue(color);
  };

  const isValidColor = /^#[0-9a-fA-F]{3,8}$/.test(textValue);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        {/* Color preview swatch */}
        <button
          type="button"
          onClick={() => {
            setShowPalette(!showPalette);
            colorInputRef.current?.click();
          }}
          className="h-8 w-8 shrink-0 rounded-lg border border-gray-300 cursor-pointer shadow-sm transition-shadow hover:shadow-md"
          style={{
            backgroundColor: isValidColor ? textValue : '#e5e7eb',
            backgroundImage: !isValidColor
              ? 'linear-gradient(45deg, #d1d5db 25%, transparent 25%, transparent 75%, #d1d5db 75%)'
              : undefined,
          }}
          title="点击选择颜色"
        />

        {/* Hidden native color input */}
        <input
          ref={colorInputRef}
          type="color"
          value={isValidColor ? textValue : '#000000'}
          onChange={handleNativeColorChange}
          className="sr-only"
        />

        {/* Text input */}
        <input
          type="text"
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          placeholder={placeholder}
          className="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Preset palette popup */}
      {showPalette && (
        <div
          ref={paletteRef}
          className="absolute z-50 mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">预设颜色</span>
            <button
              type="button"
              onClick={() => setShowPalette(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              关闭
            </button>
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handlePresetClick(color)}
                className="h-6 w-6 rounded-md border border-gray-200 cursor-pointer transition-transform hover:scale-125 hover:shadow-md"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
