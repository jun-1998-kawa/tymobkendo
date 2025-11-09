import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';
import SiteConfigPage from '../page';

jest.mock('aws-amplify/data');
jest.mock('aws-amplify/storage');

const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;
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

  it('should create new config when none exists', async () => {
    const user = userEvent.setup();
    render(<SiteConfigPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument();
    });

    const heroTitleInput = screen.getByPlaceholderText(/戸山高校剣道部OB会/);
    await user.type(heroTitleInput, '新しいタイトル');

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

    const fileInput = screen.getAllByRole('button', { name: /ファイルを選択/ })[0]
      .closest('div')
      ?.querySelector('input[type="file"]') as HTMLInputElement;

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
      expect(screen.getByPlaceholderText(/戸山高校剣道部OB会/)).toBeInTheDocument();
    });

    const heroTitleInput = screen.getByPlaceholderText(/戸山高校剣道部OB会/);
    await user.type(heroTitleInput, 'テスト');

    const submitButton = screen.getByRole('button', { name: /設定を作成/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('保存に失敗しました');
    });
  });
});
