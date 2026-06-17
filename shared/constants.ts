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
