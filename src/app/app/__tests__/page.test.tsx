import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from 'aws-amplify/storage';
import AppDashboard from '../page';

jest.mock('aws-amplify/data');
jest.mock('aws-amplify/storage');
jest.mock('@/hooks/useTabVisibility', () => ({
  useTabVisibility: jest.fn(),
}));

const mockGenerateClient = generateClient as unknown as jest.Mock;
const mockGetUrl = getUrl as jest.MockedFunction<typeof getUrl>;

import { useTabVisibility } from '@/hooks/useTabVisibility';
const mockUseTabVisibility = useTabVisibility as jest.MockedFunction<typeof useTabVisibility>;

const allTabsVisible = { showTweet: true, showFavorites: true, showBoard: true, loading: false };

const setupModels = (overrides: Record<string, unknown> = {}) => {
  mockGenerateClient.mockReturnValue({
    models: {
      Tweet:       { list: jest.fn().mockResolvedValue({ data: [] }) },
      Favorite:    { list: jest.fn().mockResolvedValue({ data: [] }) },
      BoardThread: { list: jest.fn().mockResolvedValue({ data: [] }) },
      News:        { list: jest.fn().mockResolvedValue({ data: [] }) },
      SiteConfig:  { list: jest.fn().mockResolvedValue({ data: [] }) },
      HeroSlide:   { list: jest.fn().mockResolvedValue({ data: [] }) },
      ...overrides,
    },
  } as any);
};

describe('App Dashboard (会員ダッシュボード)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTabVisibility.mockReturnValue(allTabsVisible);
    mockGetUrl.mockResolvedValue({ url: new URL('https://example.com/img.jpg') } as any);
    setupModels();
  });

  // ── ローディング ──────────────────────────────────────
  it('初期ローディング中はスケルトンを表示する', () => {
    mockGenerateClient.mockReturnValue({
      models: {
        Tweet:       { list: jest.fn().mockReturnValue(new Promise(() => {})) },
        Favorite:    { list: jest.fn().mockReturnValue(new Promise(() => {})) },
        BoardThread: { list: jest.fn().mockReturnValue(new Promise(() => {})) },
        News:        { list: jest.fn().mockReturnValue(new Promise(() => {})) },
        SiteConfig:  { list: jest.fn().mockReturnValue(new Promise(() => {})) },
        HeroSlide:   { list: jest.fn().mockReturnValue(new Promise(() => {})) },
      },
    } as any);
    render(<AppDashboard />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  // ── ユーザー情報 ──────────────────────────────────────
  it('ユーザー名（姓名）を表示する', async () => {
    // jest.setup.tsx: family_name=山田 given_name=太郎
    render(<AppDashboard />);
    await waitFor(() => expect(screen.getByText('山田 太郎さん')).toBeInTheDocument());
  });

  // ── 機能メニュー ──────────────────────────────────────
  it('全タブ有効時に全メニューを表示する', async () => {
    render(<AppDashboard />);
    await waitFor(() => expect(screen.getByText('近況投稿')).toBeInTheDocument());
    expect(screen.getByText('掲示板')).toBeInTheDocument();
    expect(screen.getByText('歴史アーカイブ')).toBeInTheDocument();
    // 「お気に入り」は統計ラベルとメニュー見出しの両方に表示される
    expect(screen.getAllByText('お気に入り').length).toBeGreaterThanOrEqual(1);
  });

  it('showTweet=false のとき「近況投稿」メニューを非表示にする', async () => {
    mockUseTabVisibility.mockReturnValue({ ...allTabsVisible, showTweet: false });
    render(<AppDashboard />);
    await waitFor(() => expect(screen.getByText('歴史アーカイブ')).toBeInTheDocument());
    expect(screen.queryByText('近況投稿')).not.toBeInTheDocument();
  });

  it('showBoard=false のとき「掲示板」メニューを非表示にする', async () => {
    mockUseTabVisibility.mockReturnValue({ ...allTabsVisible, showBoard: false });
    render(<AppDashboard />);
    await waitFor(() => expect(screen.getByText('歴史アーカイブ')).toBeInTheDocument());
    expect(screen.queryByText('掲示板')).not.toBeInTheDocument();
  });

  it('showFavorites=false のとき「お気に入り」メニューを非表示にする', async () => {
    mockUseTabVisibility.mockReturnValue({ ...allTabsVisible, showFavorites: false });
    render(<AppDashboard />);
    await waitFor(() => expect(screen.getByText('歴史アーカイブ')).toBeInTheDocument());
    expect(screen.queryByText('お気に入り')).not.toBeInTheDocument();
  });

  it('歴史アーカイブは常に表示する（管理不可）', async () => {
    mockUseTabVisibility.mockReturnValue({ showTweet: false, showFavorites: false, showBoard: false, loading: false });
    render(<AppDashboard />);
    await waitFor(() => expect(screen.getByText('歴史アーカイブ')).toBeInTheDocument());
  });

  // ── お知らせ ──────────────────────────────────────────
  it('公開済みニュースがある場合にお知らせセクションを表示する', async () => {
    const mockNews = [{
      id: 'n1', title: '重要なお知らせ', excerpt: '概要',
      category: 'お知らせ', isPublished: true, isPinned: false,
      publishedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    }];
    setupModels({ News: { list: jest.fn().mockResolvedValue({ data: mockNews }) } });

    render(<AppDashboard />);
    await waitFor(() => expect(screen.getByText('重要なお知らせ')).toBeInTheDocument());
  });

  it('ニュースが0件の場合はお知らせセクションを表示しない', async () => {
    render(<AppDashboard />);
    await waitFor(() => expect(screen.getByText('山田 太郎さん')).toBeInTheDocument());
    expect(screen.queryByText('重要なお知らせ')).not.toBeInTheDocument();
  });

  it('ピン留めニュースが先に表示される', async () => {
    const mockNews = [
      {
        id: 'n1', title: '通常ニュース', excerpt: '',
        category: 'お知らせ', isPublished: true, isPinned: false,
        publishedAt: new Date('2024-02-01').toISOString(), createdAt: new Date('2024-02-01').toISOString(),
      },
      {
        id: 'n2', title: 'ピン留めニュース', excerpt: '',
        category: 'お知らせ', isPublished: true, isPinned: true,
        publishedAt: new Date('2024-01-01').toISOString(), createdAt: new Date('2024-01-01').toISOString(),
      },
    ];
    setupModels({ News: { list: jest.fn().mockResolvedValue({ data: mockNews }) } });

    render(<AppDashboard />);
    await waitFor(() => expect(screen.getByText('ピン留めニュース')).toBeInTheDocument());

    const items = screen.getAllByRole('link').map(el => el.textContent || '');
    const pinIdx = items.findIndex(t => t.includes('ピン留めニュース'));
    const normIdx = items.findIndex(t => t.includes('通常ニュース'));
    expect(pinIdx).toBeLessThan(normIdx);
  });

  // ── 統計 ──────────────────────────────────────────────
  it('isHiddenのツイートは投稿数から除外する', async () => {
    setupModels({
      Tweet: { list: jest.fn().mockResolvedValue({ data: [
        { id: 't1', isHidden: false, replyToId: null, content: '表示' },
        { id: 't2', isHidden: true, replyToId: null, content: '非表示' },
      ]}) },
    });

    render(<AppDashboard />);
    await waitFor(() => expect(screen.getByText('山田 太郎さん')).toBeInTheDocument());

    // 投稿数 = 1（hiddenでないもの）
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('リプライは投稿数から除外する', async () => {
    setupModels({
      Tweet: { list: jest.fn().mockResolvedValue({ data: [
        { id: 't1', isHidden: false, replyToId: null, content: '元投稿' },
        { id: 't2', isHidden: false, replyToId: 't1', content: 'リプライ' },
      ]}) },
    });

    render(<AppDashboard />);
    await waitFor(() => expect(screen.getByText('山田 太郎さん')).toBeInTheDocument());

    // 投稿数 = 1（リプライを除くメイン投稿のみ）
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  // ── 独立取得（バグ修正の検証） ────────────────────────
  it('統計取得が失敗してもニュースは表示される', async () => {
    const mockNews = [{
      id: 'n1', title: '統計失敗でも表示されるお知らせ', excerpt: '',
      category: 'お知らせ', isPublished: true, isPinned: false,
      publishedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    }];

    mockGenerateClient.mockReturnValue({
      models: {
        Tweet:       { list: jest.fn().mockRejectedValue(new Error('Stats failed')) },
        Favorite:    { list: jest.fn().mockRejectedValue(new Error('Stats failed')) },
        BoardThread: { list: jest.fn().mockRejectedValue(new Error('Stats failed')) },
        News:        { list: jest.fn().mockResolvedValue({ data: mockNews }) },
        SiteConfig:  { list: jest.fn().mockResolvedValue({ data: [] }) },
        HeroSlide:   { list: jest.fn().mockResolvedValue({ data: [] }) },
      },
    } as any);

    render(<AppDashboard />);
    await waitFor(() => expect(screen.getByText('統計失敗でも表示されるお知らせ')).toBeInTheDocument());
  });
});
