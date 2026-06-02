import { renderHook, waitFor } from '@testing-library/react';
import { generateClient } from 'aws-amplify/data';
import { useTabVisibility } from '../useTabVisibility';

jest.mock('aws-amplify/data');

const mockGenerateClient = generateClient as unknown as jest.Mock;

const setupSiteConfig = (config: Record<string, unknown> | null) => {
  mockGenerateClient.mockReturnValue({
    models: {
      SiteConfig: {
        list: jest.fn().mockResolvedValue({ data: config ? [config] : [] }),
      },
    },
  });
};

describe('useTabVisibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ロード中はデフォルトで全タブを表示する', () => {
    mockGenerateClient.mockReturnValue({
      models: {
        SiteConfig: { list: jest.fn().mockReturnValue(new Promise(() => {})) },
      },
    });

    const { result } = renderHook(() => useTabVisibility());

    expect(result.current.showTweet).toBe(true);
    expect(result.current.showFavorites).toBe(true);
    expect(result.current.showBoard).toBe(true);
    expect(result.current.loading).toBe(true);
  });

  it('SiteConfigの設定値を反映する', async () => {
    setupSiteConfig({ id: 'c1', showTweet: false, showFavorites: true, showBoard: false });

    const { result } = renderHook(() => useTabVisibility());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.showTweet).toBe(false);
    expect(result.current.showFavorites).toBe(true);
    expect(result.current.showBoard).toBe(false);
  });

  it('null/undefinedは表示扱いにする', async () => {
    setupSiteConfig({ id: 'c1', showTweet: null, showFavorites: undefined, showBoard: null });

    const { result } = renderHook(() => useTabVisibility());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.showTweet).toBe(true);
    expect(result.current.showFavorites).toBe(true);
    expect(result.current.showBoard).toBe(true);
  });

  it('SiteConfigが存在しない場合は全タブ表示', async () => {
    setupSiteConfig(null);

    const { result } = renderHook(() => useTabVisibility());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.showTweet).toBe(true);
    expect(result.current.showFavorites).toBe(true);
    expect(result.current.showBoard).toBe(true);
  });

  it('取得エラー時は全タブ表示にフォールバックする', async () => {
    mockGenerateClient.mockReturnValue({
      models: {
        SiteConfig: { list: jest.fn().mockRejectedValue(new Error('Network error')) },
      },
    });

    const { result } = renderHook(() => useTabVisibility());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.showTweet).toBe(true);
    expect(result.current.showFavorites).toBe(true);
    expect(result.current.showBoard).toBe(true);
  });

  it('全タブ非表示の設定を正しく反映する', async () => {
    setupSiteConfig({ id: 'c1', showTweet: false, showFavorites: false, showBoard: false });

    const { result } = renderHook(() => useTabVisibility());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.showTweet).toBe(false);
    expect(result.current.showFavorites).toBe(false);
    expect(result.current.showBoard).toBe(false);
  });
});
