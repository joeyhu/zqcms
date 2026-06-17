export const BLOCK_TYPE_LABELS: Record<string, string> = {
  HERO: '横幅',
  FEATURES: '特性列表',
  CTA: '行动号召',
  POST_LIST: '文章列表',
  CATEGORY_LIST: '分类列表',
  TAG_LIST: '标签列表',
  CARD_GRID: '卡片网格',
  FAQ: '问答',
  MARKDOWN: '自由内容',
  TESTIMONIALS: '客户评价',
  CONTACT: '联系方式',
  DIVIDER: '分割线',
};

export const BLOCK_TYPE_ICONS: Record<string, string> = {
  HERO: 'Layout',
  FEATURES: 'Grid3X3',
  CTA: 'Megaphone',
  POST_LIST: 'FileText',
  CATEGORY_LIST: 'FolderTree',
  FAQ: 'MessageCircleQuestion',
  MARKDOWN: 'FileCode',
  TESTIMONIALS: 'Quote',
  CONTACT: 'Phone',
  DIVIDER: 'Minus',
};

export const POST_STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ARCHIVED: '已归档',
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: '管理员',
  EDITOR: '编辑',
};

export const API_BASE_URL = 'http://localhost:11003/api';

export const DEFAULT_PAGE_SIZE = 20;

export const MEDIA_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
];

export const MEDIA_MAX_SIZE = 10 * 1024 * 1024; // 10MB

// ── 卡片样式预设 ──
export interface CardStylePreset {
  id: string;
  name: string;
  /** 应用于卡片的 Tailwind 类名 */
  className: string;
  /** 是否建议使用白色/浅色文字 */
  lightText: boolean;
}

export const CARD_STYLE_PRESETS: CardStylePreset[] = [
  {
    id: 'simple-white',
    name: '简约白',
    className: 'bg-white border border-gray-100 hover:border-gray-200',
    lightText: false,
  },
  {
    id: 'gradient-blue',
    name: '渐变蓝',
    className: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white',
    lightText: true,
  },
  {
    id: 'gradient-purple',
    name: '渐变紫',
    className: 'bg-gradient-to-br from-purple-500 to-pink-600 text-white',
    lightText: true,
  },
  {
    id: 'gradient-green',
    name: '渐变绿',
    className: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
    lightText: true,
  },
  {
    id: 'gradient-warm',
    name: '渐变暖',
    className: 'bg-gradient-to-br from-orange-400 to-rose-500 text-white',
    lightText: true,
  },
  {
    id: 'glass',
    name: '毛玻璃',
    className: 'glass border border-white/20 bg-white/70 backdrop-blur-xl',
    lightText: false,
  },
  {
    id: 'dark',
    name: '暗色卡片',
    className: 'bg-gray-800 text-gray-100 border border-gray-700',
    lightText: true,
  },
  {
    id: 'custom',
    name: '自定义',
    className: '',
    lightText: false,
  },
];

export const SHADOW_OPTIONS = [
  { id: 'none', name: '无', className: 'shadow-none' },
  { id: 'sm', name: '小', className: 'shadow-sm' },
  { id: 'md', name: '中', className: 'shadow-md' },
  { id: 'lg', name: '大', className: 'shadow-lg' },
  { id: 'xl', name: '超大', className: 'shadow-xl' },
];

export const BORDER_RADIUS_OPTIONS = [
  { id: 'none', name: '直角', className: 'rounded-none' },
  { id: 'md', name: '小圆角', className: 'rounded-lg' },
  { id: 'lg', name: '中圆角', className: 'rounded-xl' },
  { id: 'xl', name: '大圆角', className: 'rounded-2xl' },
  { id: '2xl', name: '全圆角', className: 'rounded-3xl' },
];

export const ALIGN_OPTIONS = [
  { id: 'left', name: '左对齐', className: 'text-left' },
  { id: 'center', name: '居中', className: 'text-center' },
];

/** 响应式列数默认值 */
export const RESPONSIVE_COLUMNS_DEFAULTS = { desktop: 3, tablet: 2, mobile: 1 };
