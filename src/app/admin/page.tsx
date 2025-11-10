"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

export default function AdminDashboard() {
  const adminLinks = [
    {
      href: "/admin/site-config",
      icon: "⚙️",
      title: "サイト設定",
      description: "トップページのコンテンツを一括編集",
      count: null,
      color: "from-indigo-500 to-indigo-600",
    },
    {
      href: "/admin/hero-slides",
      icon: "🎬",
      title: "ヒーロースライド管理",
      description: "トップページのスライドショーを管理",
      count: null,
      color: "from-purple-500 to-purple-600",
    },
    {
      href: "/admin/news",
      icon: "📰",
      title: "ニュース管理",
      description: "お知らせやイベント情報を投稿・編集",
      count: null,
      color: "from-blue-500 to-blue-600",
    },
    {
      href: "/admin/pages",
      icon: "📄",
      title: "ページ管理",
      description: "サイトページのコンテンツを編集",
      count: null,
      color: "from-green-500 to-green-600",
    },
    {
      href: "/admin/history",
      icon: "📜",
      title: "歴史管理",
      description: "剣道部の歴史アーカイブを管理",
      count: null,
      color: "from-amber-500 to-amber-600",
    },
    {
      href: "/app/board",
      icon: "🔍",
      title: "掲示板モデレーション",
      description: "会員掲示板の投稿を監視・管理",
      count: null,
      color: "from-red-500 to-red-600",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      {/* Welcome Section */}
      <FadeIn>
        <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-amber-50 p-8 shadow-lg md:p-12">
          <h1 className="mb-4 font-serif text-4xl font-bold text-primary-800 md:text-5xl">
            管理ダッシュボード
          </h1>
          <p className="text-lg leading-relaxed text-primary-700">
            戸山高校剣道部OB会サイトの管理画面へようこそ。
            <br />
            ここから各種コンテンツの投稿・編集・削除が可能です。
          </p>
        </div>
      </FadeIn>

      {/* Quick Access Cards */}
      <div>
        <FadeIn delay={0.2}>
          <h2 className="mb-6 font-serif text-2xl font-bold text-primary-800">
            管理メニュー
          </h2>
        </FadeIn>

        <Stagger staggerDelay={0.15} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminLinks.map((link, index) => (
            <StaggerItem key={link.href}>
              <AdminCard {...link} delay={index * 0.1} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* Important Notice */}
      <FadeIn delay={0.6}>
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-600 text-2xl text-white shadow-md">
              ⚠️
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold text-primary-800">
                重要事項
              </h3>
              <ul className="space-y-2 leading-relaxed text-primary-700">
                <li>• 公開するコンテンツは必ず内容を確認してください</li>
                <li>• 個人情報の取り扱いには十分注意してください</li>
                <li>• 削除したデータは復元できません</li>
                <li>• 会員の投稿を削除する際は慎重に判断してください</li>
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
  icon,
  title,
  description,
  count,
  color,
  delay = 0,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  count: number | null;
  color: string;
  delay?: number;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="group relative h-full overflow-hidden rounded-2xl border-2 border-primary-200 bg-white p-6 shadow-lg transition-all duration-300 hover:border-red-300 hover:shadow-2xl"
      >
        {/* Icon */}
        <div
          className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-3xl text-white shadow-md`}
        >
          {icon}
        </div>

        {/* Content */}
        <h3 className="mb-2 font-serif text-xl font-bold text-primary-800">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-primary-600">{description}</p>

        {count !== null && (
          <div className="mt-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700">
              <span>{count}</span>
              <span>件</span>
            </span>
          </div>
        )}

        {/* Arrow */}
        <div className="mt-4 flex items-center gap-2 text-red-600 transition-all duration-300 group-hover:gap-3">
          <span className="font-semibold">管理画面へ</span>
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>

        {/* Hover Effect Background */}
        <div className="absolute bottom-0 right-0 h-32 w-32 translate-x-12 translate-y-12 rounded-full bg-gradient-to-tl from-red-100 to-amber-100 opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-40"></div>
      </motion.div>
    </Link>
  );
}
