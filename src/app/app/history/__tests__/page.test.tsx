import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from 'aws-amplify/storage';
import HistoryPage from '../page';

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

const setupHistory = (entries: unknown[]) => {
  mockGenerateClient.mockReturnValue({
    models: {
      HistoryEntry: { observeQuery: makeObserve(entries) },
    },
  } as any);
};

const baseEntry = {
  id: 'e1',
  year: 2020,
  title: 'テストタイトル',
  bodyMd: '本文テキスト',
  isPublic: true,
  imagePaths: null,
  videoPaths: null,
  createdAt: new Date().toISOString(),
};

describe('History Page (歴史アーカイブ)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUrl.mockResolvedValue({ url: new URL('https://example.com/vid.mp4') } as any);
  });

  // ── ローディング ──────────────────────────────────────
  it('初期ローディング中はスピナーを表示する', () => {
    mockGenerateClient.mockReturnValue({
      models: {
        HistoryEntry: {
          observeQuery: jest.fn().mockReturnValue({
            subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
          }),
        },
      },
    } as any);

    render(<HistoryPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // ── 空状態 ────────────────────────────────────────────
  it('エントリーが0件のとき空状態メッセージを表示する', async () => {
    setupHistory([]);
    render(<HistoryPage />);
    await waitFor(() =>
      expect(screen.getByText('まだ歴史エントリーがありません')).toBeInTheDocument()
    );
  });

  // ── ページタイトル ────────────────────────────────────
  it('ページタイトルを表示する', () => {
    setupHistory([]);
    render(<HistoryPage />);
    expect(screen.getByText(/高校剣道部の歴史/)).toBeInTheDocument();
  });

  // ── 公開エントリー ────────────────────────────────────
  it('isPublicのエントリーを「公開情報」セクションに表示する', async () => {
    setupHistory([{ ...baseEntry, isPublic: true }]);
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText('テストタイトル')).toBeInTheDocument());
    expect(screen.getByText('公開情報')).toBeInTheDocument();
  });

  it('公開エントリーに年号を表示する', async () => {
    setupHistory([{ ...baseEntry, year: 2020, isPublic: true }]);
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText('2020')).toBeInTheDocument());
  });

  // ── 非公開エントリー ──────────────────────────────────
  it('isPublicでないエントリーを「会員限定情報」セクションに表示する', async () => {
    setupHistory([{ ...baseEntry, id: 'e2', isPublic: false, title: '会員限定エントリー' }]);
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText('会員限定情報')).toBeInTheDocument());
    expect(screen.getByText('会員限定エントリー')).toBeInTheDocument();
  });

  it('会員限定エントリーには「会員限定」バッジを表示する', async () => {
    setupHistory([{ ...baseEntry, id: 'e3', isPublic: false, title: '秘密エントリー' }]);
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText('秘密エントリー')).toBeInTheDocument());
    expect(screen.getByText('🔒 会員限定')).toBeInTheDocument();
  });

  // ── 公開・非公開の両セクション ────────────────────────
  it('公開と非公開エントリーが混在するとき両セクションを表示する', async () => {
    setupHistory([
      { ...baseEntry, id: 'e4', isPublic: true, title: '公開エントリー' },
      { ...baseEntry, id: 'e5', isPublic: false, title: '非公開エントリー' },
    ]);
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText('公開情報')).toBeInTheDocument());
    expect(screen.getByText('会員限定情報')).toBeInTheDocument();
    expect(screen.getByText('公開エントリー')).toBeInTheDocument();
    expect(screen.getByText('非公開エントリー')).toBeInTheDocument();
  });

  // ── 年号降順ソート ────────────────────────────────────
  it('年号の降順でエントリーを表示する', async () => {
    setupHistory([
      { ...baseEntry, id: 'e6', year: 1990, title: '1990年の記録', isPublic: true },
      { ...baseEntry, id: 'e7', year: 2010, title: '2010年の記録', isPublic: true },
    ]);
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText('2010年の記録')).toBeInTheDocument());

    const cards = screen.getAllByRole('heading', { level: 3 });
    const idx2010 = cards.findIndex((el) => el.textContent?.includes('2010年の記録'));
    const idx1990 = cards.findIndex((el) => el.textContent?.includes('1990年の記録'));
    expect(idx2010).toBeLessThan(idx1990);
  });

  // ── 展開/折りたたみ ────────────────────────────────────
  it('本文が200文字を超えるとき「続きを読む」ボタンを表示する', async () => {
    const longBody = 'あ'.repeat(201);
    setupHistory([{ ...baseEntry, id: 'e8', bodyMd: longBody }]);
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText('続きを読む')).toBeInTheDocument());
  });

  it('「続きを読む」クリックで「閉じる」に切り替わる', async () => {
    const longBody = 'い'.repeat(201);
    setupHistory([{ ...baseEntry, id: 'e9', bodyMd: longBody }]);
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText('続きを読む')).toBeInTheDocument());
    fireEvent.click(screen.getByText('続きを読む'));
    expect(screen.getByText('閉じる')).toBeInTheDocument();
  });

  it('本文が200文字以下のとき展開ボタンを表示しない', async () => {
    setupHistory([{ ...baseEntry, id: 'e10', bodyMd: '短い本文' }]);
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText('テストタイトル')).toBeInTheDocument());
    expect(screen.queryByText('続きを読む')).not.toBeInTheDocument();
  });
});
