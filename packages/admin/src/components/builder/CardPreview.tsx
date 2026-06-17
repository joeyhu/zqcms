import {
  Zap, Star, Shield, Database, FileText, Search, Blocks, Rocket, Code2,
  GripVertical, BookOpen, Newspaper, Layers, MessageCircleQuestion,
  Sun, Moon, Heart, Bell, Camera, Cloud, Globe, Home, Settings, User,
  ExternalLink,
} from 'lucide-react';
import type { CardTemplateConfig, CardElementType } from '@zqcms/shared/types';

const ALL_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Zap, Star, Shield, Database, FileText, Search, Blocks, Rocket, Code2,
  GripVertical, BookOpen, Newspaper, Layers, MessageCircleQuestion,
  Sun, Moon, Heart, Bell, Camera, Cloud, Globe, Home, Settings, User,
};

interface CardPreviewProps {
  config: Partial<CardTemplateConfig>;
  sampleData?: { primaryText?: string; secondaryText?: string; tagItems?: string[] };
}

const DEFAULTS: CardTemplateConfig = {
  icon: { bg: '#EFF6FF', fg: '#3B82F6', name: 'Zap', size: 40, round: true, shadow: 'none' },
  primary: { bg: 'transparent', fg: '#111827', size: 'base', weight: 'semibold', maxLines: 2 },
  secondary: { bg: 'transparent', fg: '#6B7280', size: 'sm', maxLines: 2 },
  tags: { bg: 'transparent', fg: '#1D4ED8', tagBg: '#DBEAFE', tagFg: '#1D4ED8', rounded: true, visible: true, items: ['标签'] },
  order: ['icon', 'primary', 'secondary', 'tags'],
  direction: 'vertical',
  align: 'start',
  gap: 12,
  containerBg: '#ffffff',
  containerBorderWidth: 1,
  containerBorderColor: '#e5e7eb',
  containerShadow: 'sm',
  containerRadius: 'xl',
  linkType: 'none',
  customCss: '',
};

const radiusMap: Record<string, string> = { none: '0px', md: '8px', lg: '12px', xl: '14px', '2xl': '20px' };
const shadowMap: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
};

function merge(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const r: Record<string, unknown> = { ...a };
  for (const k of Object.keys(b)) {
    const av = a[k], bv = b[k];
    r[k] = (typeof av === 'object' && typeof bv === 'object' && av && bv && !Array.isArray(av))
      ? merge(av as Record<string, unknown>, bv as Record<string, unknown>)
      : (bv ?? av);
  }
  return r;
}

export function CardPreview({ config, sampleData }: CardPreviewProps) {
  const cfg = merge(DEFAULTS as unknown as Record<string, unknown>, (config || {}) as Record<string, unknown>) as unknown as CardTemplateConfig;
  const sample = {
    primaryText: sampleData?.primaryText || '示例卡片标题',
    secondaryText: sampleData?.secondaryText || '示例描述文字',
    tagItems: sampleData?.tagItems || cfg.tags.items,
  };

  const IconComp = ALL_ICONS[cfg.icon.name] || null;
  const fontSizeMap: Record<string, string> = { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem' };
  const weightMap: Record<string, number> = { normal: 400, medium: 500, semibold: 600, bold: 700 };
  const isCenter = cfg.align === 'center';
  const centerWrap = (el: React.ReactNode) => isCenter ? <div className="flex justify-center w-full">{el}</div> : el;

  const renderElement = (type: CardElementType) => {
    switch (type) {
      case 'icon':
        return IconComp ? centerWrap(
          <div
            className="flex items-center justify-center"
            style={{
              width: cfg.icon.size, height: cfg.icon.size,
              backgroundColor: cfg.icon.bg, borderRadius: cfg.icon.round ? 12 : 4,
              boxShadow: cfg.icon.shadow === 'md' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : cfg.icon.shadow === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : cfg.icon.shadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            <IconComp style={{ width: cfg.icon.size * 0.55, height: cfg.icon.size * 0.55, color: cfg.icon.fg }} />
          </div>
        ) : null;

      case 'primary':
        return centerWrap(
          <div style={{ backgroundColor: cfg.primary.bg, borderRadius: 4, padding: cfg.primary.bg !== 'transparent' ? '4px 8px' : 0 }}>
            <h3 className={isCenter ? 'text-center' : ''} style={{ fontSize: fontSizeMap[cfg.primary.size] || '1rem', fontWeight: weightMap[cfg.primary.weight || 'semibold'] || 600, color: cfg.primary.fg }}>
              {sample.primaryText}
            </h3>
          </div>
        );

      case 'secondary':
        return centerWrap(
          <div style={{ backgroundColor: cfg.secondary.bg, borderRadius: 4, padding: cfg.secondary.bg !== 'transparent' ? '4px 8px' : 0 }}>
            <p className={isCenter ? 'text-center' : ''} style={{
              fontSize: fontSizeMap[cfg.secondary.size] || '0.875rem', color: cfg.secondary.fg,
              display: '-webkit-box', WebkitLineClamp: cfg.secondary.maxLines || 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {sample.secondaryText}
            </p>
          </div>
        );

      case 'tags':
        if (!cfg.tags.visible || !sample.tagItems.length) return null;
        return centerWrap(
          <div style={{ backgroundColor: cfg.tags.bg, borderRadius: 4, padding: cfg.tags.bg !== 'transparent' ? '4px 6px' : 0 }}>
            <div className={`flex flex-wrap gap-1.5 ${isCenter ? 'justify-center' : ''}`}>
              {sample.tagItems.map((t, i) => (
                <span key={i} style={{ backgroundColor: cfg.tags.tagBg, color: cfg.tags.tagFg, borderRadius: cfg.tags.rounded ? 9999 : 4, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 500 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        );
    }
  };

  const hoverClass = cfg.customCss || 'hover:shadow-lg hover:-translate-y-1';

  return (
    <div
      className={`flex transition-all duration-300 ${hoverClass} ${
        cfg.direction === 'horizontal' ? 'flex-row items-start' : 'flex-col'
      } ${isCenter ? 'items-center text-center' : ''}`}
      style={{
        gap: `${cfg.gap}px`,
        background: cfg.containerBg,
        borderWidth: cfg.containerBorderWidth,
        borderColor: cfg.containerBorderColor,
        borderStyle: cfg.containerBorderWidth > 0 ? 'solid' : 'none',
        borderRadius: radiusMap[cfg.containerRadius] || '14px',
        boxShadow: shadowMap[cfg.containerShadow] || 'none',
        padding: '20px',
      }}
    >
      {cfg.order.map((type) => (
        <div key={type}>{renderElement(type)}</div>
      ))}
      {cfg.linkType !== 'none' && <ExternalLink className="h-4 w-4 text-gray-300 flex-shrink-0 self-start mt-1 opacity-40" />}
    </div>
  );
}

export const ICON_OPTIONS = Object.keys(ALL_ICONS);
