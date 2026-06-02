import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminDashboard from '../page';

describe('Admin Dashboard (管理ダッシュボード)', () => {
  it('管理メニューのタイトルを表示する', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('管理メニュー')).toBeInTheDocument();
  });

  it('ニュースへのリンクを表示する', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('ニュース')).toBeInTheDocument();
    expect(screen.getByText('お知らせの投稿・編集')).toBeInTheDocument();
  });

  it('サイト設定へのリンクを表示する', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('サイト設定')).toBeInTheDocument();
    expect(screen.getByText('トップページのコンテンツ編集')).toBeInTheDocument();
  });

  it('スライドへのリンクを表示する', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('スライド')).toBeInTheDocument();
    expect(screen.getByText('ヒーロースライドショー管理')).toBeInTheDocument();
  });

  it('歴史アーカイブへのリンクを表示する', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('歴史アーカイブ')).toBeInTheDocument();
    expect(screen.getByText('年表・歴史エントリ管理')).toBeInTheDocument();
  });

  it('招待コードへのリンクを表示する', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('招待コード')).toBeInTheDocument();
    expect(screen.getByText('会員招待コードの発行・管理')).toBeInTheDocument();
  });

  it('ページ管理へのリンクを表示する', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('ページ管理')).toBeInTheDocument();
    expect(screen.getByText('コンテンツページ編集')).toBeInTheDocument();
  });

  it('全メニューが正しいhrefを持つリンクである', () => {
    render(<AdminDashboard />);

    const expectedLinks: Record<string, string> = {
      ニュース: '/admin/news',
      サイト設定: '/admin/site-config',
      スライド: '/admin/hero-slides',
      歴史アーカイブ: '/admin/history',
      招待コード: '/admin/invite-codes',
      ページ管理: '/admin/pages',
    };

    for (const [title, href] of Object.entries(expectedLinks)) {
      const link = screen.getByText(title).closest('a');
      expect(link).toHaveAttribute('href', href);
    }
  });
});
