import '@testing-library/jest-dom';
import React from 'react';

// Make React available globally for all tests
global.React = React;

// Mock Amplify
jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn(() => ({
    models: {},
  })),
}));

jest.mock('aws-amplify/storage', () => ({
  uploadData: jest.fn(),
  getUrl: jest.fn(),
  remove: jest.fn(),
}));

// 認証系はテストでは固定のユーザーを返すモックにする
jest.mock('aws-amplify/auth', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    userId: 'current-user',
    username: 'current-user',
  }),
  fetchUserAttributes: jest.fn().mockResolvedValue({
    family_name: '山田',
    given_name: '太郎',
  }),
  fetchAuthSession: jest.fn().mockResolvedValue({
    tokens: { accessToken: { payload: { 'cognito:groups': [] } } },
  }),
  signUp: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

// Mock framer-motion
// motion.<tag> は対応するDOMタグ名を返す（motion.main / motion.span などにも対応）
jest.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => (typeof prop === 'string' ? prop : 'div'),
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock custom components
jest.mock('@/components/ui/HeroSlideshow', () => ({
  __esModule: true,
  default: ({ slides }: any) => (
    <div data-testid="hero-slideshow">
      {slides.map((slide: any, i: number) => (
        <div key={i}>
          <h1>{slide.title}</h1>
          <p>{slide.subtitle}</p>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/NewsSection', () => ({
  __esModule: true,
  default: () => <div data-testid="news-section">News Section</div>,
}));

// スプラッシュ（ShinaiSlash）はテストでは即座に完了させ、ローディング表示として
// .animate-spin を持つ要素を描画する。
jest.mock('@/components/ShinaiSlash', () => ({
  __esModule: true,
  default: ({ onComplete }: { onComplete?: () => void }) => {
    React.useEffect(() => {
      onComplete?.();
    }, [onComplete]);
    return <div className="animate-spin" data-testid="splash" />;
  },
}));

jest.mock('@/components/ui/FadeIn', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/SlideIn', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/Stagger', () => ({
  Stagger: ({ children }: any) => <div>{children}</div>,
  StaggerItem: ({ children }: any) => <div>{children}</div>,
}));

// Suppress console errors/warnings in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
