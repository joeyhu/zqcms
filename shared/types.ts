// ==========================================
// ZQCMS Shared Types
// ==========================================

// ---------- Enums ----------
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
  isPinned: boolean;
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
  authorId?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  isPinned?: boolean;
  isFeatured?: boolean;
  publishedAt?: string | null;
  tagIds?: number[];
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

// ---------- Feedback ----------
export interface Feedback {
  id: number;
  siteId: number;
  name: string;
  phone: string | null;
  email: string | null;
  content: string;
  pageUrl: string | null;
  status: string; // pending | reviewed | resolved | closed
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  content: string;
  pageUrl?: string | null;
}

// ---------- LLM Config ----------
export interface LlmConfig {
  id: number;
  name: string;
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LlmConfigInput {
  name: string;
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  isActive?: boolean;
}

// ---------- LLM Assist ----------
export type LlmAssistAction = 'generate' | 'summarize' | 'extractTags' | 'classify' | 'generateTitle' | 'format' | 'generateSeo';

export interface LlmAssistRequest {
  action: LlmAssistAction;
  content: string;
  title?: string;
  categories?: string[];
  existingTags?: string[];
}

export interface LlmAssistResponse {
  success: boolean;
  result?: string;
  tags?: string[];
  category?: string;
  seoTitle?: string;
  seoDesc?: string;
  error?: string;
}

// ---------- Publish Platform ----------
export interface PublishPlatform {
  id: number;
  name: string;
  platform: string;
  appId: string;
  appSecret: string;
  qrcode: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublishPlatformInput {
  name: string;
  platform: string;
  appId: string;
  appSecret: string;
  qrcode?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface PublishRecord {
  id: number;
  postId: number;
  platformId: number;
  platform?: PublishPlatform;
  status: string;
  publishId: string | null;
  errorMsg: string | null;
  createdAt: string;
}
