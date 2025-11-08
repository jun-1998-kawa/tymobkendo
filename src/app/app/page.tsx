"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

export default function AppDashboard() {
  const quickLinks = [
    {
      href: "/app/tweet",
      icon: "💬",
      title: "近況投稿",
      description: "140文字で気軽に近況を共有",
      color: "from-blue-500 to-blue-600",
    },
    {
      href: "/app/board",
      icon: "📋",
      title: "掲示板",
      description: "スレッド形式で議論・情報交換",
      color: "from-green-500 to-green-600",
    },
    {
      href: "/app/history",
      icon: "📜",
      title: "歴史アーカイブ",
      description: "戸山剣道部の歴史を振り返る",
      color: "from-amber-500 to-amber-600",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      {/* Welcome Section */}
      <FadeIn>
        <div className="rounded-2xl border border-primary-200 bg-white p-8 shadow-lg md:p-12">
          <h1 className="mb-4 font-serif text-4xl font-bold text-primary-800 md:text-5xl">
            会員ダッシュボード
          </h1>
          <p className="text-lg leading-relaxed text-primary-600">
            戸山高校剣道部OB会の会員専用エリアへようこそ。
            <br />
            懐かしい仲間との交流や情報共有をお楽しみください。
          </p>
        </div>
      </FadeIn>

      {/* Quick Links */}
      <div>
        <FadeIn delay={0.2}>
          <h2 className="mb-6 font-serif text-2xl font-bold text-primary-800">
            クイックアクセス
          </h2>
        </FadeIn>

        <Stagger staggerDelay={0.15} className="grid gap-6 md:grid-cols-3">
          {quickLinks.map((link, index) => (
            <StaggerItem key={link.href}>
              <QuickLinkCard {...link} delay={index * 0.1} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      {/* Information Section */}
      <FadeIn delay={0.6}>
        <div className="rounded-2xl border-2 border-accent-200 bg-gradient-to-br from-accent-50 to-gold-50 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent-600 text-2xl text-white">
              ℹ️
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold text-primary-800">
                お知らせ
              </h3>
              <p className="leading-relaxed text-primary-700">
                このサイトは戸山高校剣道部OB会員の皆様のための専用プラットフォームです。
                各種機能を活用して、OB会員同士の交流を深めてください。
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

function QuickLinkCard({
  href,
  icon,
  title,
  description,
  color,
  delay = 0,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  delay?: number;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="group relative h-full overflow-hidden rounded-2xl border-2 border-primary-200 bg-white p-6 shadow-lg transition-all duration-300 hover:border-accent-300 hover:shadow-2xl"
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

        {/* Arrow */}
        <div className="mt-4 flex items-center gap-2 text-accent-600 transition-all duration-300 group-hover:gap-3">
          <span className="font-semibold">アクセス</span>
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
        <div className="absolute bottom-0 right-0 h-32 w-32 translate-x-12 translate-y-12 rounded-full bg-gradient-to-tl from-accent-100 to-gold-100 opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-40"></div>
      </motion.div>
    </Link>
  );
}
