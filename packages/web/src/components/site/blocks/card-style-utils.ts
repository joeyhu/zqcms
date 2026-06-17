import {
  CARD_STYLE_PRESETS,
  SHADOW_OPTIONS,
  BORDER_RADIUS_OPTIONS,
  ALIGN_OPTIONS,
  RESPONSIVE_COLUMNS_DEFAULTS,
} from '@zqcms/shared/constants';

export interface CardStyleConfig {
  preset?: string;
  shadow?: string;
  borderRadius?: string;
  alignment?: string;
  customCss?: string;
}

export interface ResponsiveColumnsConfig {
  desktop?: number;
  tablet?: number;
  mobile?: number;
}

/**
 * 将卡片样式配置转为 Tailwind 类名字符串
 */
export function getCardStyleClasses(cardStyle?: CardStyleConfig): {
  baseClass: string;
  isLightText: boolean;
} {
  if (!cardStyle) {
    return { baseClass: 'bg-white border border-gray-100 rounded-xl shadow-sm', isLightText: false };
  }

  const preset = CARD_STYLE_PRESETS.find((p) => p.id === cardStyle.preset);
  const presetClass = preset?.className || '';
  const isLightText = preset?.lightText || false;

  const shadow = SHADOW_OPTIONS.find((s) => s.id === cardStyle.shadow);
  const radius = BORDER_RADIUS_OPTIONS.find((r) => r.id === cardStyle.borderRadius);
  const align = ALIGN_OPTIONS.find((a) => a.id === cardStyle.alignment);

  const parts = [presetClass];
  if (shadow?.id !== 'none') parts.push(shadow?.className || 'shadow-sm');
  if (radius) parts.push(radius.className);
  else parts.push('rounded-xl');
  if (align) parts.push(align.className);
  if (cardStyle.customCss) parts.push(cardStyle.customCss);

  return {
    baseClass: parts.filter(Boolean).join(' ') || 'bg-white border border-gray-100 rounded-xl shadow-sm',
    isLightText,
  };
}

/**
 * 将响应式列数配置转为 Tailwind grid 类名
 */
export function getResponsiveGridClass(columns?: ResponsiveColumnsConfig): string {
  const c = { ...RESPONSIVE_COLUMNS_DEFAULTS, ...columns };
  const parts: string[] = [];

  if (c.mobile) parts.push(`grid-cols-${Math.min(c.mobile, 4)}`);
  if (c.tablet) parts.push(`md:grid-cols-${Math.min(c.tablet, 6)}`);
  if (c.desktop) parts.push(`lg:grid-cols-${Math.min(c.desktop, 6)}`);

  return parts.join(' ') || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
}
