"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

export default function AdminDashboard() {
  const adminLinks = [
    {
      href: "/admin/site-config",
      title: "サイト設定",
      description: "トップページのコンテンツ編集",
    },
    {
      href: "/admin/hero-slides",
      title: "ヒーロースライド",
      description: "スライドショー管理",
    },
    {
      href: "/admin/news",
      title: "ニュース",
      description: "お知らせ投稿・編集",
    },
    {
      href: "/admin/pages",
      title: "ページ",
      description: "コンテンツ編集",
    },
    {
      href: "/admin/history",
      title: "歴史",
      description: "歴史アーカイブ管理",
    },
    {
      href: "/app/board",
      title: "掲示板モデレーション",
      description: "投稿監視・管理",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      {/* Welcome Section */}
      <FadeIn>
        <div className="border-b border-gray-200 bg-white px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            管理ダッシュボード
          </h1>
        </div>
      </FadeIn>

      {/* Quick Access Cards */}
      <div className="px-4">
        <FadeIn delay={0.2}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            管理メニュー
          </h2>
        </FadeIn>

        <Stagger staggerDelay={0.15} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {adminLinks.map((link, index) => (
            <StaggerItem key={link.href}>
              <AdminCard {...link} delay={index * 0.1} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* Important Notice */}
      <FadeIn delay={0.6}>
        <div className="border border-orange-200 bg-orange-50 p-6 mx-4">
          <div className="flex items-start gap-4">
            <div>
              <h3 className="mb-2 text-base font-semibold text-gray-900">
                注意事項
              </h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• コンテンツ公開前に内容を確認</li>
                <li>• 個人情報の取り扱いに注意</li>
                <li>• 削除データは復元不可</li>
                <li>• 投稿削除は慎重に判断</li>
              </ul>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

function AdminCard({
  href,
  title,
  description,
  delay = 0,
}: {
  href: string;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <Link href={href}>
      <div className="border border-gray-200 bg-white p-6 transition-colors hover:bg-gray-50">
        <h3 className="mb-2 text-base font-semibold text-gray-900">
          {title}
        </h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
