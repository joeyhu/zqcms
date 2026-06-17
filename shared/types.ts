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
  footerText: string | null;
  copyright: string | null;
  gaId: string | null;
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
  footerText?: string | null;
  copyright?: string | null;
  gaId?: string | null;
}

// ---------- Category ----------
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
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
  categoryId: number;
  category?: Category;
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
  categoryId: number;
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
