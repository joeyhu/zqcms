export const BLOCK_TYPE_LABELS: Record<string, string> = {
  HERO: '横幅',
  FEATURES: '特性列表',
  CTA: '行动号召',
  POST_LIST: '文章列表',
  CATEGORY_LIST: '分类列表',
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
