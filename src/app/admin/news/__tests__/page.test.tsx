import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { generateClient } from 'aws-amplify/data';
import { uploadData } from 'aws-amplify/storage';
import NewsManagementPage from '../page';

jest.mock('aws-amplify/data');
jest.mock('aws-amplify/storage');

const mockGenerateClient = generateClient as unknown as jest.Mock;
const mockUploadData = uploadData as jest.MockedFunction<typeof uploadData>;

const makeObserve = (items: unknown[]) =>
  jest.fn().mockReturnValue({
    subscribe: jest.fn((cb: any) => {
      setTimeout(() => cb.next({ items }), 0);
      return { unsubscribe: jest.fn() };
    }),
  });

const baseNews = {
  id: 'n1',
  title: 'テストニュース',
  excerpt: '概要',
  content: '本文',
  category: 'お知らせ',
  isPublished: true,
  isPinned: false,
  publishedAt: '2024-01-15T00:00:00.000Z',
  createdAt: '2024-01-15T00:00:00.000Z',
  imagePaths: null,
};

const setupNews = (
  items: unknown[],
  overrides: {
    update?: jest.Mock;
    create?: jest.Mock;
    delete?: jest.Mock;
  } = {}
) => {
  mockGenerateClient.mockReturnValue({
    models: {
      News: {
        observeQuery: makeObserve(items),
        update: overrides.update ?? jest.fn().mockResolvedValue({ data: {} }),
        create: overrides.create ?? jest.fn().mockResolvedValue({ data: {} }),
        delete: overrides.delete ?? jest.fn().mockResolvedValue({ data: null }),
      },
    },
  } as any);
};

describe('News Management Page (ニュース管理)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn().mockReturnValue(true);
    mockUploadData.mockReturnValue({ result: Promise.resolve({ path: 'public/test.jpg' }) } as any);
  });

  // ── ローディング ──────────────────────────────────────
  it('初期ローディング中はスピナーを表示する', () => {
    mockGenerateClient.mockReturnValue({
      models: {
        News: {
          observeQuery: jest.fn().mockReturnValue({
            subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
          }),
          update: jest.fn(),
          create: jest.fn(),
          delete: jest.fn(),
        },
      },
    } as any);

    render(<NewsManagementPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // ── 空状態 ────────────────────────────────────────────
  it('ニュースが0件のとき空状態メッセージを表示する', async () => {
    setupNews([]);
    render(<NewsManagementPage />);

    await waitFor(() =>
      expect(screen.getByText('ニュースがありません')).toBeInTheDocument()
    );
  });

  // ── ニュース一覧 ──────────────────────────────────────
  it('ニュースタイトルを表示する', async () => {
    setupNews([baseNews]);
    render(<NewsManagementPage />);

    await waitFor(() =>
      expect(screen.getByText('テストニュース')).toBeInTheDocument()
    );
  });

  it('カテゴリを表示する', async () => {
    setupNews([baseNews]);
    render(<NewsManagementPage />);

    await waitFor(() => expect(screen.getByText('お知らせ')).toBeInTheDocument());
  });

  it('公開中ステータスを表示する', async () => {
    setupNews([{ ...baseNews, isPublished: true }]);
    render(<NewsManagementPage />);

    await waitFor(() => expect(screen.getByText('公開中')).toBeInTheDocument());
  });

  it('下書きステータスを表示する', async () => {
    setupNews([{ ...baseNews, id: 'n2', isPublished: false }]);
    render(<NewsManagementPage />);

    await waitFor(() => expect(screen.getByText('下書き')).toBeInTheDocument());
  });

  it('ピン留めニュースのとき「ピン留め解除」ボタンを表示する', async () => {
    setupNews([{ ...baseNews, isPinned: true }]);
    render(<NewsManagementPage />);

    await waitFor(() => expect(screen.getByText('テストニュース')).toBeInTheDocument());
    // isPinned=true のとき、アクションボタンのtitle は「ピン留め解除」
    expect(screen.getByTitle('ピン留め解除')).toBeInTheDocument();
  });

  it('ピン留めでないニュースには「ピン留め解除」ボタンを表示しない', async () => {
    setupNews([{ ...baseNews, isPinned: false }]);
    render(<NewsManagementPage />);

    await waitFor(() => expect(screen.getByText('テストニュース')).toBeInTheDocument());
    // isPinned=false のとき、アクションボタンのtitle は「ピン留め」（解除ではない）
    expect(screen.queryByTitle('ピン留め解除')).not.toBeInTheDocument();
  });

  // ── 公開切り替え ──────────────────────────────────────
  it('「非公開」ボタンで公開→下書きへのupdate callを行う', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ data: {} });
    setupNews([{ ...baseNews, isPublished: true }], { update: mockUpdate });
    render(<NewsManagementPage />);

    await waitFor(() => expect(screen.getByText('非公開')).toBeInTheDocument());
    fireEvent.click(screen.getByText('非公開'));

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'n1', isPublished: false })
      )
    );
  });

  it('「公開」ボタンで下書き→公開へのupdate callを行う', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ data: {} });
    setupNews([{ ...baseNews, isPublished: false }], { update: mockUpdate });
    render(<NewsManagementPage />);

    await waitFor(() => expect(screen.getByText('公開')).toBeInTheDocument());
    fireEvent.click(screen.getByText('公開'));

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'n1', isPublished: true })
      )
    );
  });

  // ── ソフト削除（非公開化） ────────────────────────────
  it('「削除」ボタンで非公開化のupdate callを行う', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ data: {} });
    setupNews([baseNews], { update: mockUpdate });
    render(<NewsManagementPage />);

    await waitFor(() => expect(screen.getByText('テストニュース')).toBeInTheDocument());
    fireEvent.click(screen.getByText('削除'));

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'n1', isPublished: false })
      )
    );
  });

  // ── 完全削除（下書き時のみ表示） ─────────────────────
  it('下書きニュースには「完全削除」ボタンを表示する', async () => {
    setupNews([{ ...baseNews, isPublished: false }]);
    render(<NewsManagementPage />);

    await waitFor(() =>
      expect(screen.getByText('完全削除')).toBeInTheDocument()
    );
  });

  it('公開中ニュースには「完全削除」ボタンを表示しない', async () => {
    setupNews([{ ...baseNews, isPublished: true }]);
    render(<NewsManagementPage />);

    await waitFor(() => expect(screen.getByText('テストニュース')).toBeInTheDocument());
    expect(screen.queryByText('完全削除')).not.toBeInTheDocument();
  });

  // ── 新規作成モーダル ──────────────────────────────────
  it('「新規作成」ボタンをクリックするとモーダルが開く', async () => {
    setupNews([]);
    render(<NewsManagementPage />);

    await waitFor(() => expect(screen.getByText('ニュースがありません')).toBeInTheDocument());
    fireEvent.click(screen.getByText('新規作成'));

    expect(screen.getByText('新規ニュース作成')).toBeInTheDocument();
  });

  it('モーダルのキャンセルボタンでモーダルを閉じる', async () => {
    setupNews([]);
    render(<NewsManagementPage />);

    await waitFor(() => expect(screen.getByText('ニュースがありません')).toBeInTheDocument());
    fireEvent.click(screen.getByText('新規作成'));
    expect(screen.getByText('新規ニュース作成')).toBeInTheDocument();

    fireEvent.click(screen.getByText('キャンセル'));
    expect(screen.queryByText('新規ニュース作成')).not.toBeInTheDocument();
  });

  // ── 複数ニュースのソート（ピン留め優先） ─────────────
  it('ピン留めニュースが通常ニュースより先に表示される', async () => {
    setupNews([
      { ...baseNews, id: 'n3', title: '通常ニュース', isPinned: false, publishedAt: '2024-02-01T00:00:00.000Z' },
      { ...baseNews, id: 'n4', title: 'ピン留めニュース', isPinned: true, publishedAt: '2024-01-01T00:00:00.000Z' },
    ]);
    render(<NewsManagementPage />);

    await waitFor(() => expect(screen.getByText('ピン留めニュース')).toBeInTheDocument());

    const rows = screen.getAllByRole('row');
    const pinIdx = rows.findIndex((r) => r.textContent?.includes('ピン留めニュース'));
    const normIdx = rows.findIndex((r) => r.textContent?.includes('通常ニュース'));
    expect(pinIdx).toBeLessThan(normIdx);
  });
});
