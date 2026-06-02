"use client";
import Link from "next/link";

const adminLinks = [
  { href: "/admin/news", title: "ニュース", description: "お知らせの投稿・編集" },
  { href: "/admin/site-config", title: "サイト設定", description: "トップページのコンテンツ編集" },
  { href: "/admin/hero-slides", title: "スライド", description: "ヒーロースライドショー管理" },
  { href: "/admin/history", title: "歴史アーカイブ", description: "年表・歴史エントリ管理" },
  { href: "/admin/invite-codes", title: "招待コード", description: "会員招待コードの発行・管理" },
  { href: "/admin/pages", title: "ページ管理", description: "コンテンツページ編集" },
];

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-xl font-bold text-gray-900">管理メニュー</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className="group border border-gray-200 bg-white p-5 transition-colors hover:border-accent-200 hover:bg-accent-50/30">
              <h3 className="mb-1 text-sm font-semibold text-gray-900 group-hover:text-accent-700">
                {link.title}
              </h3>
              <p className="text-xs text-gray-500">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
