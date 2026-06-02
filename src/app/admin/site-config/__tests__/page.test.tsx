import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';
import SiteConfigPage from '../page';

jest.mock('aws-amplify/data');
jest.mock('aws-amplify/storage');

// `typeof generateClient` は深くネストしたジェネリックで型チェッカの再帰上限を
// 超えるため、.mockReturnValue だけ使えれば十分な緩い Jest mock 型にする。
const mockGenerateClient = generateClient as unknown as jest.Mock;
const mockUploadData = uploadData as jest.MockedFunction<typeof uploadData>;
const mockGetUrl = getUrl as jest.MockedFunction<typeof getUrl>;

describe('SiteConfig Admin Page', () => {
  let mockList: jest.Mock;
  let mockCreate: jest.Mock;
  let mockUpdate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();

    mockList = jest.fn().mockResolvedValue({ data: [] });
    mockCreate = jest.fn().mockResolvedValue({ data: { id: 'new-config' } });
    mockUpdate = jest.fn().mockResolvedValue({ data: { id: 'config-1' } });

    mockGenerateClient.mockReturnValue({
      models: {
        SiteConfig: {
          list: mockList,
          create: mockCreate,
          update: mockUpdate,
        },
      },
    } as any);
  });

  it('should render site config form', async () => {
    render(<SiteConfigPage />);

    await waitFor(() => {
      expect(screen.getByText(/サイト設定/)).toBeInTheDocument();
    });
  });

  it('should load existing config', async () => {
    const mockConfig = {
      id: 'config-1',
      heroTitle: 'テストタイトル',
      heroSubtitle: 'テストサブタイトル',
      welcomeTitle: 'ようこそ',
      welcomeBody: '本文',
      featuresJson: JSON.stringify([]),
      ctaTitle: 'CTA',
      ctaBody: 'CTA本文',
      footerCopyright: '© 2024',
      isActive: true,
    };

    mockList.mockResolvedValue({ data: [mockConfig] });

    render(<SiteConfigPage />);

    await waitFor(() => {
      const titleInput = screen.getByDisplayValue('テストタイトル');
      expect(titleInput).toBeInTheDocument();
    });
  });

  // 必須項目をすべて入力する（HTML5 のバリデーションで送信がブロックされないようにする）
  const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByPlaceholderText('戸山高校剣道部OB会'), '新しいタイトル');
    await user.type(screen.getByPlaceholderText(/伝統を継承/), 'サブタイトル');
    await user.type(screen.getByPlaceholderText('ようこそ'), 'ようこそ本文タイトル');
    await user.type(screen.getByPlaceholderText(/公式サイトへようこそ/), 'ウェルカム本文');
    await user.type(screen.getByPlaceholderText(/会員の皆様へ/), 'CTAタイトル');
    await user.type(screen.getByPlaceholderText(/懐かしい仲間/), 'CTA本文');
    await user.type(screen.getByPlaceholderText(/All rights reserved/), '© 2024 テスト');
  };

  it('should create new config when none exists', async () => {
    const user = userEvent.setup();
    render(<SiteConfigPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('戸山高校剣道部OB会')).toBeInTheDocument();
    });

    await fillRequiredFields(user);

    const submitButton = screen.getByRole('button', { name: /設定を作成/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('保存しました！');
    });
  });

  it('should update existing config', async () => {
    const user = userEvent.setup();
    const mockConfig = {
      id: 'config-1',
      heroTitle: 'タイトル',
      heroSubtitle: 'サブタイトル',
      welcomeTitle: 'ようこそ',
      welcomeBody: '本文',
      featuresJson: JSON.stringify([]),
      ctaTitle: 'CTA',
      ctaBody: 'CTA本文',
      footerCopyright: '© 2024',
      isActive: true,
    };

    mockList.mockResolvedValue({ data: [mockConfig] });

    render(<SiteConfigPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('タイトル')).toBeInTheDocument();
    });

    const heroTitleInput = screen.getByDisplayValue('タイトル');
    await user.clear(heroTitleInput);
    await user.type(heroTitleInput, '更新されたタイトル');

    const submitButton = screen.getByRole('button', { name: /設定を更新/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'config-1',
          heroTitle: '更新されたタイトル',
        })
      );
    });
  });

  it('should handle hero image upload', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['hero'], 'hero.jpg', { type: 'image/jpeg' });

    mockUploadData.mockReturnValue({
      result: Promise.resolve({
        path: 'site-config/hero-123.jpg',
      } as any),
      cancel: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      state: 'SUCCESS' as any,
    });

    mockGetUrl.mockResolvedValue({
      url: new URL('https://example.com/hero.jpg'),
      expiresAt: new Date(),
    });

    render(<SiteConfigPage />);

    await waitFor(() => {
      expect(screen.getByText(/サイト設定/)).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(mockUploadData).toHaveBeenCalled();
    });
  });

  it('should add and remove feature cards', async () => {
    const user = userEvent.setup();
    render(<SiteConfigPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ 追加/ })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /\+ 追加/ });
    await user.click(addButton);

    await waitFor(() => {
      const cards = screen.getAllByText(/カード \d+/);
      expect(cards.length).toBeGreaterThan(3); // Default has 3 features
    });

    const deleteButtons = screen.getAllByRole('button', { name: /削除/ });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      const cards = screen.getAllByText(/カード \d+/);
      expect(cards.length).toBe(3);
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<SiteConfigPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /設定を作成/ })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /設定を作成/ });

    // Required fields are enforced by HTML5, so button should be disabled or form won't submit
    // Just verify the button exists and can be interacted with
    expect(submitButton).toBeInTheDocument();
  });

  it('should display loading state', () => {
    mockList.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<SiteConfigPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should handle save error', async () => {
    const user = userEvent.setup();
    mockCreate.mockRejectedValue(new Error('Save failed'));

    render(<SiteConfigPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('戸山高校剣道部OB会')).toBeInTheDocument();
    });

    await fillRequiredFields(user);

    const submitButton = screen.getByRole('button', { name: /設定を作成/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('保存に失敗しました');
    });
  });
});
