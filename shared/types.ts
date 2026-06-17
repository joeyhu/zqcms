// ==========================================
// ZQCMS Shared Types
// ==========================================

// ---------- Enums ----------
export enum BlockType {
  HERO = 'HERO',
  FEATURES = 'FEATURES',
  CTA = 'CTA',
  POST_LIST = 'POST_LIST',
  CATEGORY_LIST = 'CATEGORY_LIST',
  TAG_LIST = 'TAG_LIST',
  CARD_GRID = 'CARD_GRID',
  FAQ = 'FAQ',
  MARKDOWN = 'MARKDOWN',
  TESTIMONIALS = 'TESTIMONIALS',
  CONTACT = 'CONTACT',
  DIVIDER = 'DIVIDER',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum Role {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
}

// ---------- Site Settings ----------
export interface SiteSettings {
  id: number;
  siteName: string;
  siteDescription: string | null;
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  socialLinks: Record<string, string> | null;
  socialQRCodes: Record<string, string> | null;
  footerText: string | null;
  copyright: string | null;
  gaId: string | null;
  icp: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettingsInput {
  siteName?: string;
  siteDescription?: string | null;
  logo?: string | null;
  favicon?: string | null;
  primaryColor?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  socialLinks?: Record<string, string> | null;
  socialQRCodes?: Record<string, string> | null;
  footerText?: string | null;
  copyright?: string | null;
  gaId?: string | null;
  icp?: string | null;
}

// ---------- Category ----------
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  url: string | null;
  sortOrder: number;
  isVisible: boolean;
  parentId: number | null;
  children?: Category[];
  posts?: Post[];
  _count?: { posts: number };
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  url?: string | null;
  sortOrder?: number;
  isVisible?: boolean;
  parentId?: number | null;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

// ---------- Post ----------
export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  status: PostStatus;
  sortOrder: number;
  categoryId: number | null;
  category?: Category | null;
  authorId: string;
  author?: User;
  tags?: Tag[];
  seoTitle: string | null;
  seoDesc: string | null;
  viewCount: number;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  coverImage?: string | null;
  status?: PostStatus;
  sortOrder?: number;
  categoryId?: number | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  isFeatured?: boolean;
  publishedAt?: string | null;
  tagIds?: number[];
}

// ---------- Page Block ----------
export interface PageBlock {
  id: number;
  pageType: string;
  blockType: BlockType;
  title: string | null;
  config: Record<string, unknown>;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageBlockInput {
  pageType: string;
  blockType: BlockType;
  title?: string | null;
  config?: Record<string, unknown>;
  sortOrder?: number;
  isVisible?: boolean;
}

// ---------- User ----------
export interface User {
  id: string;
  email: string;
  password?: string;
  name: string | null;
  role: Role;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

// ---------- Tag ----------
export interface Tag {
  id: number;
  name: string;
  slug: string;
  _count?: { posts: number };
}

export interface TagInput {
  name: string;
  slug: string;
}

// ---------- Media ----------
export interface Media {
  id: number;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  altText: string | null;
  createdAt: string;
}

// ---------- BlockTemplate ----------
export interface BlockTemplate {
  id: number;
  siteId: number;
  name: string;
  description: string | null;
  cardTemplateId: number | null;
  cardTemplate?: { id: number; name: string } | null;
  contentSource: string;  // subcategories|articles|tags|all_categories|all_articles
  columns: { desktop: number; tablet: number; mobile: number };
  isPreset: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ---------- API Common ----------
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ReorderInput {
  items: { id: number; sortOrder: number }[];
}

// ---------- CardTemplate ----------

export interface CardIconConfig {
  bg: string;       // 背景色
  fg: string;       // 前景色（图标颜色）
  name: string;     // lucide 图标名
  size: number;     // 容器大小 px
  round: boolean;   // 圆角
  shadow: string;   // 阴影强度 none/sm/md/lg
}

export interface CardTextConfig {
  bg: string;       // 背景色
  fg: string;       // 文字颜色
  size: string;     // 字号 xs/sm/base/lg/xl
  weight?: string;  // 字重（仅 primary）
  maxLines?: number;// 最大行数
}

export interface CardTagsConfig {
  bg: string;       // 标签区域背景色
  fg: string;       // 标签文字色
  tagBg: string;    // 单个标签背景色
  tagFg: string;    // 单个标签文字色
  rounded: boolean; // 标签圆角
  visible: boolean;
  items: string[];  // 多个标签内容
}

export type CardElementType = 'icon' | 'primary' | 'secondary' | 'tags';

export interface CardTemplateConfig {
  icon: CardIconConfig;
  primary: CardTextConfig;
  secondary: CardTextConfig;
  tags: CardTagsConfig;
  order: CardElementType[];
  direction: 'vertical' | 'horizontal';
  align: 'start' | 'center';
  gap: number;
  // 容器样式
  containerBg: string;        // 背景色或渐变 CSS（如 linear-gradient(135deg, #3B82F6, #8B5CF6)）
  containerBorderWidth: number;// 边框粗细 px
  containerBorderColor: string;
  containerShadow: string;     // none/sm/md/lg/xl
  containerRadius: string;     // none/md/lg/xl/2xl
  // 链接
  linkType: string;
  linkPattern?: string;
  linkHref?: string;
  customCss: string;
}

export interface CardTemplate {
  id: number;
  siteId: number;
  name: string;
  description: string | null;
  isPreset: boolean;
  config: CardTemplateConfig;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
