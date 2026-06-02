import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { generateClient } from 'aws-amplify/data';
import InviteCodesPage from '../page';

jest.mock('aws-amplify/data');

const mockGenerateClient = generateClient as unknown as jest.Mock;

const makeObserve = (items: unknown[]) =>
  jest.fn().mockReturnValue({
    subscribe: jest.fn((cb: any) => {
      setTimeout(() => cb.next({ items }), 0);
      return { unsubscribe: jest.fn() };
    }),
  });

const baseCode = {
  id: 'c1',
  code: 'KENDO001',
  isActive: true,
  usageCount: 0,
  usageLimit: null,
  expiresAt: null,
  note: null,
  createdAt: new Date().toISOString(),
};

const setupCodes = (
  items: unknown[],
  overrides: {
    update?: jest.Mock;
    create?: jest.Mock;
    delete?: jest.Mock;
  } = {}
) => {
  mockGenerateClient.mockReturnValue({
    models: {
      InviteCode: {
        observeQuery: makeObserve(items),
        update: overrides.update ?? jest.fn().mockResolvedValue({ data: {} }),
        create: overrides.create ?? jest.fn().mockResolvedValue({ data: {} }),
        delete: overrides.delete ?? jest.fn().mockResolvedValue({ data: null }),
      },
    },
  } as any);
};

describe('Invite Codes Page (招待コード管理)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn().mockReturnValue(true);
    // navigator.clipboard.writeText は jsdom で未実装のためモック
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
    window.alert = jest.fn();
  });

  // ── ローディング ──────────────────────────────────────
  it('初期ローディング中はスピナーを表示する', () => {
    mockGenerateClient.mockReturnValue({
      models: {
        InviteCode: {
          observeQuery: jest.fn().mockReturnValue({
            subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
          }),
          update: jest.fn(),
          create: jest.fn(),
          delete: jest.fn(),
        },
      },
    } as any);

    render(<InviteCodesPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // ── 空状態 ────────────────────────────────────────────
  it('コードが0件のとき空状態メッセージを表示する', async () => {
    setupCodes([]);
    render(<InviteCodesPage />);

    await waitFor(() =>
      expect(screen.getByText('招待コードがありません')).toBeInTheDocument()
    );
  });

  // ── コード一覧 ────────────────────────────────────────
  it('招待コードを表示する', async () => {
    setupCodes([baseCode]);
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('KENDO001')).toBeInTheDocument());
  });

  it('有効なコードに「有効」ステータスを表示する', async () => {
    setupCodes([{ ...baseCode, isActive: true }]);
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('有効')).toBeInTheDocument());
  });

  it('無効なコードに「無効」ステータスを表示する', async () => {
    setupCodes([{ ...baseCode, id: 'c2', code: 'INACTIVE01', isActive: false }]);
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('無効')).toBeInTheDocument());
  });

  it('期限切れコードに「期限切れ」ステータスを表示する', async () => {
    const expired = {
      ...baseCode,
      id: 'c3',
      code: 'EXPIRED01',
      isActive: true,
      expiresAt: '2020-01-01T00:00:00.000Z',
    };
    setupCodes([expired]);
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('期限切れ')).toBeInTheDocument());
  });

  it('使用上限到達コードに「上限到達」ステータスを表示する', async () => {
    const maxed = {
      ...baseCode,
      id: 'c4',
      code: 'MAXED001',
      isActive: true,
      usageCount: 5,
      usageLimit: 5,
      expiresAt: null,
    };
    setupCodes([maxed]);
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('上限到達')).toBeInTheDocument());
  });

  it('使用回数を表示する', async () => {
    setupCodes([{ ...baseCode, usageCount: 3, usageLimit: 10 }]);
    render(<InviteCodesPage />);

    // 統計欄とテーブル行の両方に 3 が表示される
    await waitFor(() => expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1));
    expect(screen.getByText(/\/\s*10/)).toBeInTheDocument();
  });

  it('有効期限なしのコードは「無期限」と表示する', async () => {
    setupCodes([{ ...baseCode, expiresAt: null }]);
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('無期限')).toBeInTheDocument());
  });

  it('メモを表示する', async () => {
    setupCodes([{ ...baseCode, note: '○○さん用' }]);
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('○○さん用')).toBeInTheDocument());
  });

  // ── 統計表示 ──────────────────────────────────────────
  it('有効なコード数を統計に表示する', async () => {
    setupCodes([
      { ...baseCode, id: 'c5', isActive: true },
      { ...baseCode, id: 'c6', code: 'KENDO002', isActive: false },
    ]);
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('有効なコード')).toBeInTheDocument());
    expect(screen.getByText('無効なコード')).toBeInTheDocument();
  });

  // ── 有効化/無効化 ─────────────────────────────────────
  it('「無効化」ボタンで isActive:false のupdateを呼ぶ', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ data: {} });
    setupCodes([{ ...baseCode, isActive: true }], { update: mockUpdate });
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('無効化')).toBeInTheDocument());
    fireEvent.click(screen.getByText('無効化'));

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({ id: 'c1', isActive: false })
    );
  });

  it('「有効化」ボタンで isActive:true のupdateを呼ぶ', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ data: {} });
    setupCodes([{ ...baseCode, id: 'c7', code: 'DISABLED1', isActive: false }], {
      update: mockUpdate,
    });
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('有効化')).toBeInTheDocument());
    fireEvent.click(screen.getByText('有効化'));

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({ id: 'c7', isActive: true })
    );
  });

  // ── 削除（確認付き） ──────────────────────────────────
  it('確認OKで InviteCode.delete を呼ぶ', async () => {
    const mockDelete = jest.fn().mockResolvedValue({ data: null });
    setupCodes([baseCode], { delete: mockDelete });
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('KENDO001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('削除'));

    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith({ id: 'c1' })
    );
  });

  it('確認キャンセルで InviteCode.delete を呼ばない', async () => {
    const mockDelete = jest.fn().mockResolvedValue({ data: null });
    (window.confirm as jest.Mock).mockReturnValue(false);
    setupCodes([baseCode], { delete: mockDelete });
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('KENDO001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('削除'));

    expect(mockDelete).not.toHaveBeenCalled();
  });

  // ── 新規発行モーダル ──────────────────────────────────
  it('「新規発行」ボタンをクリックするとモーダルが開く', async () => {
    setupCodes([]);
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('招待コードがありません')).toBeInTheDocument());
    fireEvent.click(screen.getByText('新規発行'));

    expect(screen.getByText('新規招待コード発行')).toBeInTheDocument();
  });

  it('モーダルのキャンセルボタンでモーダルを閉じる', async () => {
    setupCodes([]);
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('招待コードがありません')).toBeInTheDocument());
    fireEvent.click(screen.getByText('新規発行'));
    expect(screen.getByText('新規招待コード発行')).toBeInTheDocument();

    fireEvent.click(screen.getByText('キャンセル'));
    expect(screen.queryByText('新規招待コード発行')).not.toBeInTheDocument();
  });

  // ── ソート（有効コードが先） ──────────────────────────
  it('有効なコードが無効なコードより先に表示される', async () => {
    setupCodes([
      { ...baseCode, id: 'c8', code: 'DISABLED2', isActive: false, createdAt: new Date().toISOString() },
      { ...baseCode, id: 'c9', code: 'ACTIVE002', isActive: true, createdAt: new Date().toISOString() },
    ]);
    render(<InviteCodesPage />);

    await waitFor(() => expect(screen.getByText('ACTIVE002')).toBeInTheDocument());

    const rows = screen.getAllByRole('row');
    const activeIdx = rows.findIndex((r) => r.textContent?.includes('ACTIVE002'));
    const disabledIdx = rows.findIndex((r) => r.textContent?.includes('DISABLED2'));
    expect(activeIdx).toBeLessThan(disabledIdx);
  });
});
