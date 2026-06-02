import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from 'aws-amplify/storage';
import Home from '../page';

// Mock Amplify Data
jest.mock('aws-amplify/data');
jest.mock('aws-amplify/storage');

// `typeof generateClient` is a deeply-nested generic that pushes the type
// checker past its recursion limit. We only need the .mockReturnValue surface
// here, so a loose Jest mock type is enough.
const mockGenerateClient = generateClient as unknown as jest.Mock;
const mockGetUrl = getUrl as jest.MockedFunction<typeof getUrl>;

type ListResult = { data: unknown[] | null };

// SiteConfig / News / HeroSlide の list をまとめてモックするヘルパー
const setupModels = (options: {
  configs?: unknown[];
  news?: unknown[];
  slides?: unknown[];
  configList?: jest.Mock;
}) => {
  const siteConfigList =
    options.configList ??
    jest.fn().mockResolvedValue({ data: options.configs ?? [] } as ListResult);
  const newsList = jest
    .fn()
    .mockResolvedValue({ data: options.news ?? [] } as ListResult);
  const heroSlideList = jest
    .fn()
    .mockResolvedValue({ data: options.slides ?? [] } as ListResult);

  mockGenerateClient.mockReturnValue({
    models: {
      SiteConfig: { list: siteConfigList },
      News: { list: newsList },
      HeroSlide: { list: heroSlideList },
    },
  } as any);

  return { siteConfigList, newsList, heroSlideList };
};

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it('should render loading state initially', () => {
    // SiteConfig の取得が解決しない間はスプラッシュ（.animate-spin）が表示される
    setupModels({ configList: jest.fn().mockReturnValue(new Promise(() => {})) });

    render(<Home />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should render default hero title when no SiteConfig exists', async () => {
    setupModels({ configs: [] });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('戸山高校剣道部OB会')).toBeInTheDocument();
    });
  });

  it('should render default footer copyright when no SiteConfig exists', async () => {
    setupModels({ configs: [] });

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getByText(/戸山高校剣道部OB会\. All rights reserved\./)
      ).toBeInTheDocument();
    });
  });

  it('should render content from SiteConfig when it exists', async () => {
    const mockConfig = {
      id: '1',
      heroTitle: 'カスタムタイトル',
      heroSubtitle: 'カスタムサブタイトル',
      welcomeTitle: 'カスタムウェルカム',
      welcomeBody: 'カスタム本文',
      featuresJson: JSON.stringify([]),
      ctaTitle: 'カスタムCTA',
      ctaBody: 'CTAの本文',
      footerCopyright: '© 2025 カスタムコピーライト',
      isActive: true,
    };

    setupModels({ configs: [mockConfig] });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('カスタムタイトル')).toBeInTheDocument();
    });

    expect(screen.getByText('カスタムサブタイトル')).toBeInTheDocument();
    expect(screen.getByText('© 2025 カスタムコピーライト')).toBeInTheDocument();
  });

  it('should load hero image URL when heroImagePath exists', async () => {
    const mockConfig = {
      id: '1',
      heroTitle: 'テスト',
      heroSubtitle: 'テスト',
      heroImagePath: 'test-image.jpg',
      welcomeTitle: 'ウェルカム',
      welcomeBody: '本文',
      featuresJson: JSON.stringify([]),
      ctaTitle: 'CTA',
      ctaBody: 'CTA本文',
      footerCopyright: '©️',
      isActive: true,
    };

    mockGetUrl.mockResolvedValue({
      url: new URL('https://s3.example.com/test-image.jpg'),
      expiresAt: new Date(),
    });

    setupModels({ configs: [mockConfig] });

    render(<Home />);

    await waitFor(() => {
      expect(mockGetUrl).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'public/test-image.jpg' })
      );
    });
  });

  it('should handle error when loading SiteConfig fails', async () => {
    setupModels({
      configList: jest.fn().mockRejectedValue(new Error('Network error')),
    });

    render(<Home />);

    // エラー時でもデフォルトのヒーロータイトルは表示される
    await waitFor(() => {
      expect(screen.getByText('戸山高校剣道部OB会')).toBeInTheDocument();
    });
  });

  it('should show news button when published news exist', async () => {
    const mockNews = [
      {
        id: 'n1',
        title: 'お知らせ1',
        category: 'イベント',
        excerpt: '抜粋',
        isPublished: true,
        isPinned: false,
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      },
    ];

    setupModels({ configs: [], news: mockNews });

    render(<Home />);

    // ヒーローのお知らせボタンは件数バッジ付き（ナビの「お知らせ」と区別する）
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /お知らせ\s*1/ })
      ).toBeInTheDocument();
    });
  });
});
