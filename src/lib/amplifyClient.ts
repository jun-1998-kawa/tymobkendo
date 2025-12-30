/**
 * Amplify Client - 一元化されたAmplifyクライアントと型定義
 */
import { generateClient } from "aws-amplify/data";

// Amplifyクライアント（シングルトン）
export const client = generateClient();
export const models = client.models as Models;

// =============================================================================
// 型定義
// =============================================================================

/**
 * Tweet - 140文字投稿
 */
export interface Tweet {
  id: string;
  content: string;
  imagePaths?: string[] | null;
  author?: string | null;
  authorId?: string | null;
  replyToId?: string | null;
  replyCount?: number | null;
  favoriteCount?: number | null;
  isHidden?: boolean | null;
  owner?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Favorite - いいね
 */
export interface Favorite {
  id: string;
  tweetId: string;
  owner?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * BoardThread - 掲示板スレッド
 */
export interface BoardThread {
  id: string;
  title: string;
  pinned?: boolean | null;
  owner?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * BoardMessage - 掲示板メッセージ
 */
export interface BoardMessage {
  id: string;
  threadId: string;
  body: string;
  imagePaths?: string[] | null;
  author?: string | null;
  authorId?: string | null;
  isHidden?: boolean | null;
  owner?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * HistoryEntry - 歴史エントリ
 */
export interface HistoryEntry {
  id: string;
  year: number;
  title: string;
  bodyMd: string;
  imagePaths?: string[] | null;
  videoPaths?: string[] | null;
  isPublic?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Page - CMSページ
 */
export interface Page {
  id: string;
  slug: string;
  title: string;
  bodyMd: string;
  sections?: string[] | null;
  imagePaths?: string[] | null;
  videoPaths?: string[] | null;
  isPublic?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * News - ニュース
 */
export interface News {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  publishedAt?: string | null;
  isPublished?: boolean | null;
  isPinned?: boolean | null;
  imagePaths?: string[] | null;
  videoPaths?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * HeroSlide - ヒーロースライド
 */
export interface HeroSlide {
  id: string;
  order: number;
  mediaPath: string;
  mediaType?: "image" | "video" | null;
  title?: string | null;
  subtitle?: string | null;
  isActive?: boolean | null;
  kenBurnsEffect?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * SiteConfig - サイト設定
 */
export interface SiteConfig {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImagePath?: string | null;
  heroImagePaths?: string[] | null;
  heroSlideInterval?: number | null;
  useHeroSlides?: boolean | null;
  welcomeTitle: string;
  welcomeBody: string;
  featuresJson: string;
  ctaTitle: string;
  ctaBody: string;
  footerCopyright: string;
  isActive?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Amplify Models 型定義（内部用）
// =============================================================================

interface Models {
  Tweet: ModelOperations<Tweet>;
  Favorite: ModelOperations<Favorite>;
  BoardThread: ModelOperations<BoardThread>;
  BoardMessage: ModelOperations<BoardMessage>;
  HistoryEntry: ModelOperations<HistoryEntry>;
  Page: ModelOperations<Page>;
  News: ModelOperations<News>;
  HeroSlide: ModelOperations<HeroSlide>;
  SiteConfig: ModelOperations<SiteConfig>;
}

interface ModelOperations<T> {
  create: (data: Partial<T>) => Promise<{ data: T | null; errors?: unknown[] }>;
  update: (data: Partial<T> & { id: string }) => Promise<{ data: T | null; errors?: unknown[] }>;
  delete: (data: { id: string }) => Promise<{ data: T | null; errors?: unknown[] }>;
  get: (data: { id: string }) => Promise<{ data: T | null; errors?: unknown[] }>;
  list: (options?: ListOptions) => Promise<{ data: T[]; errors?: unknown[] }>;
  observeQuery: (options?: ObserveOptions) => {
    subscribe: (handlers: {
      next: (result: { items: T[]; isSynced?: boolean }) => void;
      error?: (error: unknown) => void;
    }) => { unsubscribe: () => void };
  };
}

interface ListOptions {
  filter?: Record<string, unknown>;
  limit?: number;
  nextToken?: string;
}

interface ObserveOptions {
  filter?: Record<string, unknown>;
}
