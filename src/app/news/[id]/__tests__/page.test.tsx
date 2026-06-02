import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import NewsDetailPage from '../page';

jest.mock('aws-amplify/data');
jest.mock('next/navigation', () => ({
  useParams: jest.fn().mockReturnValue({ id: 'news-123' }),
  useRouter: jest.fn().mockReturnValue({ push: jest.fn(), back: jest.fn() }),
}));

const mockGenerateClient = generateClient as unknown as jest.Mock;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

const baseNews = {
  id: 'news-123',
  title: 'テストニュース',
  excerpt: '概要テキスト',
  content: '## 本文\n詳細テキスト',
  category: 'お知らせ',
  isPublished: true,
  isPinned: false,
  publishedAt: '2024-01-15T00:00:00.000Z',
  createdAt: '2024-01-15T00:00:00.000Z',
  imagePaths: null,
};

const setupNewsGet = (data: unknown, errors: unknown = null) => {
  mockGenerateClient.mockReturnValue({
    models: { News: { get: jest.fn().mockResolvedValue({ data, errors }) } },
  });
};

describe('News Detail Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期ローディング状態を表示する', () => {
    mockGenerateClient.mockReturnValue({
      models: { News: { get: jest.fn().mockReturnValue(new Promise(() => {})) } },
    });
    render(<NewsDetailPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('ログイン済みユーザーは userPool authMode でニュースを取得する', async () => {
    // jest.setup.tsx: getCurrentUser は成功（ログイン済み）
    setupNewsGet(baseNews);
    render(<NewsDetailPage />);

    await waitFor(() => expect(screen.getByText('テストニュース')).toBeInTheDocument());

    // ログイン済みのとき generateClient は userPool を渡される
    expect(mockGenerateClient).toHaveBeenCalledWith({ authMode: 'userPool' });
  });

  it('未ログインユーザーは identityPool authMode でニュースを取得する', async () => {
    mockGetCurrentUser.mockRejectedValueOnce(new Error('No current user'));
    setupNewsGet(baseNews);
    render(<NewsDetailPage />);

    await waitFor(() => expect(screen.getByText('テストニュース')).toBeInTheDocument());

    expect(mockGenerateClient).toHaveBeenCalledWith({ authMode: 'identityPool' });
  });

  it('ニュースが存在しない場合にエラーメッセージを表示する', async () => {
    setupNewsGet(null);
    render(<NewsDetailPage />);

    await waitFor(() => expect(screen.getByText('ニュースを表示できません')).toBeInTheDocument());
    expect(screen.getByText('ニュースが見つかりません')).toBeInTheDocument();
  });

  it('未公開ニュースにアクセスした場合にエラーを表示する', async () => {
    setupNewsGet({ ...baseNews, isPublished: false });
    render(<NewsDetailPage />);

    await waitFor(() => expect(screen.getByText('このニュースは公開されていません')).toBeInTheDocument());
  });

  it('API取得失敗時にエラーメッセージを表示する', async () => {
    mockGenerateClient.mockReturnValue({
      models: { News: { get: jest.fn().mockRejectedValue(new Error('Network error')) } },
    });
    render(<NewsDetailPage />);

    await waitFor(() => expect(screen.getByText('ニュースの取得に失敗しました')).toBeInTheDocument());
  });

  it('タイトル・概要・カテゴリを表示する', async () => {
    setupNewsGet(baseNews);
    render(<NewsDetailPage />);

    await waitFor(() => expect(screen.getByText('テストニュース')).toBeInTheDocument());
    expect(screen.getByText('概要テキスト')).toBeInTheDocument();
    expect(screen.getByText('お知らせ')).toBeInTheDocument();
  });

  it('isPinnedのニュースに「重要」バッジを表示する', async () => {
    setupNewsGet({ ...baseNews, isPinned: true });
    render(<NewsDetailPage />);

    await waitFor(() => expect(screen.getByText('重要')).toBeInTheDocument());
  });

  it('isPinnedでないニュースに「重要」バッジを表示しない', async () => {
    setupNewsGet({ ...baseNews, isPinned: false });
    render(<NewsDetailPage />);

    await waitFor(() => expect(screen.getByText('テストニュース')).toBeInTheDocument());
    expect(screen.queryByText('重要')).not.toBeInTheDocument();
  });

  it('カテゴリ「イベント」を表示する', async () => {
    setupNewsGet({ ...baseNews, category: 'イベント' });
    render(<NewsDetailPage />);

    await waitFor(() => expect(screen.getByText('イベント')).toBeInTheDocument());
  });

  it('カテゴリ「活動報告」を表示する', async () => {
    setupNewsGet({ ...baseNews, category: '活動報告' });
    render(<NewsDetailPage />);

    await waitFor(() => expect(screen.getByText('活動報告')).toBeInTheDocument());
  });

  it('トップページへ戻るリンクを表示する', async () => {
    setupNewsGet(baseNews);
    render(<NewsDetailPage />);

    await waitFor(() => expect(screen.getByText('テストニュース')).toBeInTheDocument());
    expect(screen.getByText('トップページに戻る')).toBeInTheDocument();
  });
});
