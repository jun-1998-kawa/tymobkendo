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

jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    section: 'section',
    article: 'article',
    tr: 'tr',
    button: 'button',
  },
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
