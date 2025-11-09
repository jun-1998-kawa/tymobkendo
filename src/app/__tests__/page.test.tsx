import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from 'aws-amplify/storage';
import Home from '../page';

// Mock Amplify Data
jest.mock('aws-amplify/data');
jest.mock('aws-amplify/storage');

const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;
const mockGetUrl = getUrl as jest.MockedFunction<typeof getUrl>;

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    const mockList = jest.fn().mockReturnValue(new Promise(() => {})); // Never resolves
    mockGenerateClient.mockReturnValue({
      models: {
        SiteConfig: {
          list: mockList,
        },
      },
    } as any);

    render(<Home />);

    // Check for loading spinner by class name
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should render default content when no SiteConfig exists', async () => {
    const mockList = jest.fn().mockResolvedValue({ data: [] });
    mockGenerateClient.mockReturnValue({
      models: {
        SiteConfig: {
          list: mockList,
        },
      },
    } as any);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('戸山高校剣道部OB会')).toBeInTheDocument();
    });

    expect(screen.getByText('伝統を継承し、絆を深める')).toBeInTheDocument();
    expect(screen.getByText('ようこそ')).toBeInTheDocument();
    expect(screen.getByText(/戸山高校剣道部OB会の公式サイトへようこそ/)).toBeInTheDocument();
  });

  it('should render default features when no SiteConfig exists', async () => {
    const mockList = jest.fn().mockResolvedValue({ data: [] });
    mockGenerateClient.mockReturnValue({
      models: {
        SiteConfig: {
          list: mockList,
        },
      },
    } as any);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('近況投稿')).toBeInTheDocument();
    });

    expect(screen.getByText('掲示板')).toBeInTheDocument();
    expect(screen.getByText('歴史アーカイブ')).toBeInTheDocument();
  });

  it(
    'should render content from SiteConfig when it exists',
    async () => {
      const mockConfig = {
        id: '1',
        heroTitle: 'カスタムタイトル',
        heroSubtitle: 'カスタムサブタイトル',
        heroImagePath: 'custom-hero.jpg',
        welcomeTitle: 'カスタムウェルカム',
        welcomeBody: 'カスタム本文\n2行目',
        featuresJson: JSON.stringify([
          { icon: '🎯', title: '機能1', description: '説明1' },
          { icon: '🚀', title: '機能2', description: '説明2' },
        ]),
        ctaTitle: 'カスタムCTA',
        ctaBody: 'CTAの本文',
        footerCopyright: '© 2025 カスタムコピーライト',
        isActive: true,
      };

      const mockList = jest.fn().mockResolvedValue({ data: [mockConfig] });
      mockGetUrl.mockResolvedValue({
        url: new URL('https://example.com/custom-hero.jpg'),
        expiresAt: new Date(),
      });

      mockGenerateClient.mockReturnValue({
        models: {
          SiteConfig: {
            list: mockList,
          },
        },
      } as any);

      render(<Home />);

      await waitFor(
        () => {
          expect(screen.getByText('カスタムタイトル')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      expect(screen.getByText('カスタムサブタイトル')).toBeInTheDocument();
      expect(screen.getByText('カスタムウェルカム')).toBeInTheDocument();
      expect(screen.getByText(/カスタム本文/)).toBeInTheDocument();
      expect(screen.getByText('機能1')).toBeInTheDocument();
      expect(screen.getByText('機能2')).toBeInTheDocument();
      expect(screen.getByText('カスタムCTA')).toBeInTheDocument();
      expect(screen.getByText('© 2025 カスタムコピーライト')).toBeInTheDocument();
    },
    10000
  );

  it(
    'should handle multiline text in welcome and CTA sections',
    async () => {
      const mockConfig = {
        id: '1',
        heroTitle: 'テスト',
        heroSubtitle: 'テスト',
        welcomeTitle: 'ウェルカム',
        welcomeBody: '1行目\n2行目\n3行目',
        featuresJson: JSON.stringify([]),
        ctaTitle: 'CTA',
        ctaBody: 'CTA1行目\nCTA2行目',
        footerCopyright: '©️',
        isActive: true,
      };

      const mockList = jest.fn().mockResolvedValue({ data: [mockConfig] });
      mockGenerateClient.mockReturnValue({
        models: {
          SiteConfig: {
            list: mockList,
          },
        },
      } as any);

      render(<Home />);

      await waitFor(
        () => {
          expect(screen.getByText(/1行目/)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      expect(screen.getByText(/2行目/)).toBeInTheDocument();
      expect(screen.getByText(/3行目/)).toBeInTheDocument();
      expect(screen.getByText(/CTA1行目/)).toBeInTheDocument();
      expect(screen.getByText(/CTA2行目/)).toBeInTheDocument();
    },
    10000
  );

  it(
    'should load hero image URL when heroImagePath exists',
    async () => {
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

      const mockList = jest.fn().mockResolvedValue({ data: [mockConfig] });
      mockGetUrl.mockResolvedValue({
        url: new URL('https://s3.example.com/test-image.jpg'),
        expiresAt: new Date(),
      });

      mockGenerateClient.mockReturnValue({
        models: {
          SiteConfig: {
            list: mockList,
        },
      },
    } as any);

    render(<Home />);

    await waitFor(
      () => {
        expect(mockGetUrl).toHaveBeenCalledWith({
          path: 'public/test-image.jpg',
        });
      },
      { timeout: 5000 }
    );
  },
  10000
);

  it('should handle error when loading SiteConfig fails', async () => {
    const mockList = jest.fn().mockRejectedValue(new Error('Network error'));
    mockGenerateClient.mockReturnValue({
      models: {
        SiteConfig: {
          list: mockList,
        },
      },
    } as any);

    render(<Home />);

    // Should still render default content
    await waitFor(() => {
      expect(screen.getByText('戸山高校剣道部OB会')).toBeInTheDocument();
    });
  });

  it('should handle invalid JSON in featuresJson gracefully', async () => {
    const mockConfig = {
      id: '1',
      heroTitle: 'テスト',
      heroSubtitle: 'テスト',
      welcomeTitle: 'ウェルカム',
      welcomeBody: '本文',
      featuresJson: 'invalid-json{',
      ctaTitle: 'CTA',
      ctaBody: 'CTA本文',
      footerCopyright: '©️',
      isActive: true,
    };

    const mockList = jest.fn().mockResolvedValue({ data: [mockConfig] });
    mockGenerateClient.mockReturnValue({
      models: {
        SiteConfig: {
          list: mockList,
        },
      },
    } as any);

    render(<Home />);

    // Should render default features when JSON parsing fails
    await waitFor(() => {
      expect(screen.getByText('近況投稿')).toBeInTheDocument();
    });
  });
});
