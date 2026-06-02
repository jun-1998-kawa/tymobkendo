import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from 'aws-amplify/storage';
import FavoritesPage from '../page';

jest.mock('aws-amplify/data');
jest.mock('aws-amplify/storage');

const mockGenerateClient = generateClient as unknown as jest.Mock;
const mockGetUrl = getUrl as jest.MockedFunction<typeof getUrl>;

const makeObserve = (items: unknown[]) =>
  jest.fn().mockReturnValue({
    subscribe: jest.fn((cb: any) => {
      setTimeout(() => cb.next({ items }), 0);
      return { unsubscribe: jest.fn() };
    }),
  });

const setupModels = (favItems: unknown[], tweetItems: unknown[]) => {
  mockGenerateClient.mockReturnValue({
    models: {
      Favorite: {
        observeQuery: makeObserve(favItems),
        delete: jest.fn().mockResolvedValue({ data: null }),
      },
      Tweet: {
        observeQuery: makeObserve(tweetItems),
      },
    },
  } as any);
};

describe('Favorites Page (お気に入りページ)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUrl.mockResolvedValue({ url: new URL('https://example.com/img.jpg') } as any);
  });

  // ── ローディング ──────────────────────────────────────
  it('初期ローディング中はスピナーを表示する', () => {
    mockGenerateClient.mockReturnValue({
      models: {
        Favorite: {
          observeQuery: jest.fn().mockReturnValue({
            subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
          }),
        },
        Tweet: {
          observeQuery: jest.fn().mockReturnValue({
            subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
          }),
        },
      },
    } as any);

    render(<FavoritesPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // ── 空状態 ────────────────────────────────────────────
  it('お気に入りが0件のとき空状態メッセージを表示する', async () => {
    setupModels([], []);
    render(<FavoritesPage />);
    await waitFor(() =>
      expect(screen.getByText('お気に入りがありません')).toBeInTheDocument()
    );
    expect(screen.getByText('ツイートを見る')).toBeInTheDocument();
  });

  // ── お気に入りツイート表示 ────────────────────────────
  it('自分のお気に入りに対応するツイートを表示する', async () => {
    const favItems = [{ id: 'f1', tweetId: 't1', owner: 'current-user' }];
    const tweetItems = [
      {
        id: 't1',
        content: '表示されるツイート',
        author: '山田',
        authorId: 'author-1',
        isHidden: false,
        replyToId: null,
        createdAt: new Date().toISOString(),
        imagePaths: null,
      },
    ];

    setupModels(favItems, tweetItems);
    render(<FavoritesPage />);

    await waitFor(() =>
      expect(screen.getByText('表示されるツイート')).toBeInTheDocument()
    );
    expect(screen.getByText('山田')).toBeInTheDocument();
    expect(screen.getByText('お気に入り解除')).toBeInTheDocument();
  });

  // ── 他人のお気に入りは表示しない ─────────────────────
  it('他ユーザーのお気に入りは表示しない', async () => {
    const favItems = [{ id: 'f2', tweetId: 't2', owner: 'other-user' }];
    const tweetItems = [
      {
        id: 't2',
        content: '他人のお気に入り',
        author: '田中',
        authorId: 'author-2',
        isHidden: false,
        replyToId: null,
        createdAt: new Date().toISOString(),
        imagePaths: null,
      },
    ];

    setupModels(favItems, tweetItems);
    render(<FavoritesPage />);

    await waitFor(() =>
      expect(screen.getByText('お気に入りがありません')).toBeInTheDocument()
    );
    expect(screen.queryByText('他人のお気に入り')).not.toBeInTheDocument();
  });

  // ── 削除済みツイートの表示 ────────────────────────────
  it('isHiddenのツイートは削除済みプレースホルダーを表示する', async () => {
    const favItems = [{ id: 'f3', tweetId: 't3', owner: 'current-user' }];
    const tweetItems = [
      {
        id: 't3',
        content: '削除済みの内容',
        author: '佐藤',
        authorId: 'author-3',
        isHidden: true,
        replyToId: null,
        createdAt: new Date().toISOString(),
        imagePaths: null,
      },
    ];

    setupModels(favItems, tweetItems);
    render(<FavoritesPage />);

    await waitFor(() =>
      expect(screen.getByText('このツイートは削除されました')).toBeInTheDocument()
    );
    expect(screen.queryByText('削除済みの内容')).not.toBeInTheDocument();
  });

  // ── お気に入り解除 ────────────────────────────────────
  it('お気に入り解除ボタンをクリックするとFavorite.deleteを呼ぶ', async () => {
    const mockDelete = jest.fn().mockResolvedValue({ data: null });
    const favItems = [{ id: 'f4', tweetId: 't4', owner: 'current-user' }];
    const tweetItems = [
      {
        id: 't4',
        content: '解除対象ツイート',
        author: '鈴木',
        authorId: 'author-4',
        isHidden: false,
        replyToId: null,
        createdAt: new Date().toISOString(),
        imagePaths: null,
      },
    ];

    mockGenerateClient.mockReturnValue({
      models: {
        Favorite: {
          observeQuery: makeObserve(favItems),
          delete: mockDelete,
        },
        Tweet: {
          observeQuery: makeObserve(tweetItems),
        },
      },
    } as any);

    render(<FavoritesPage />);
    await waitFor(() =>
      expect(screen.getByText('解除対象ツイート')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('お気に入り解除'));

    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith({ id: 'f4' })
    );
  });

  // ── 元のツイートへのリンク ────────────────────────────
  it('元のツイートを見るリンクを表示する', async () => {
    const favItems = [{ id: 'f5', tweetId: 't5', owner: 'current-user' }];
    const tweetItems = [
      {
        id: 't5',
        content: 'リンク確認ツイート',
        author: '伊藤',
        authorId: 'author-5',
        isHidden: false,
        replyToId: null,
        createdAt: new Date().toISOString(),
        imagePaths: null,
      },
    ];

    setupModels(favItems, tweetItems);
    render(<FavoritesPage />);

    await waitFor(() =>
      expect(screen.getByText('元のツイートを見る')).toBeInTheDocument()
    );
  });

  // ── 複数お気に入り ────────────────────────────────────
  it('複数のお気に入りツイートを表示する', async () => {
    const now = new Date().toISOString();
    const favItems = [
      { id: 'f6', tweetId: 't6', owner: 'current-user' },
      { id: 'f7', tweetId: 't7', owner: 'current-user' },
    ];
    const tweetItems = [
      {
        id: 't6', content: '1件目', author: 'A', authorId: 'a1',
        isHidden: false, replyToId: null, createdAt: now, imagePaths: null,
      },
      {
        id: 't7', content: '2件目', author: 'B', authorId: 'a2',
        isHidden: false, replyToId: null, createdAt: now, imagePaths: null,
      },
    ];

    setupModels(favItems, tweetItems);
    render(<FavoritesPage />);

    await waitFor(() => expect(screen.getByText('1件目')).toBeInTheDocument());
    expect(screen.getByText('2件目')).toBeInTheDocument();
  });
});
