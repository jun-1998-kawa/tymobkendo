"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { models } from "@/lib/amplifyClient";
import FadeIn from "@/components/ui/FadeIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

interface DashboardStats {
  tweetCount: number;
  favoriteCount: number;
  threadCount: number;
}

export default function AppDashboard() {
  const [userName, setUserName] = useState<string>("");
  const [graduationYear, setGraduationYear] = useState<string>("");
  const [stats, setStats] = useState<DashboardStats>({
    tweetCount: 0,
    favoriteCount: 0,
    threadCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ユーザー情報を取得
        const attributes = await fetchUserAttributes();
        const familyName = attributes.family_name || "";
        const givenName = attributes.given_name || "";
        setUserName(`${familyName} ${givenName}`.trim() || "会員");
        setGraduationYear(attributes["custom:graduationYear"] || "");

        // 統計情報を取得
        const [tweetsResult, favoritesResult, threadsResult] = await Promise.all([
          models.Tweet.list({ limit: 1000 }),
          models.Favorite.list({ limit: 1000 }),
          models.BoardThread.list({ limit: 1000 }),
        ]);

        setStats({
          tweetCount: tweetsResult.data?.filter((t) => !t.isHidden).length || 0,
          favoriteCount: favoritesResult.data?.length || 0,
          threadCount: threadsResult.data?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const quickLinks = [
    {
      href: "/app/tweet",
      title: "近況投稿",
      description: "140文字で近況をシェア",
      icon: "📝",
      stat: `${stats.tweetCount}件の投稿`,
      color: "from-accent-500 to-accent-600",
    },
    {
      href: "/app/board",
      title: "掲示板",
      description: "スレッド形式で議論",
      icon: "💬",
      stat: `${stats.threadCount}件のスレッド`,
      color: "from-gold-500 to-gold-600",
    },
    {
      href: "/app/history",
      title: "歴史アーカイブ",
      description: "剣道部の歴史を閲覧",
      icon: "📚",
      stat: "1923年〜",
      color: "from-primary-700 to-primary-800",
    },
    {
      href: "/app/favorites",
      title: "お気に入り",
      description: "保存した投稿を確認",
      icon: "⭐",
      stat: `${stats.favoriteCount}件保存`,
      color: "from-amber-500 to-orange-500",
    },
  ];

  // 時間帯に応じた挨拶
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "おはようございます";
    if (hour < 18) return "こんにちは";
    return "こんばんは";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Welcome Section */}
      <FadeIn>
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-800 via-primary-900 to-black p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-gold-400">{getGreeting()}</p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                {loading ? (
                  <span className="inline-block h-8 w-32 animate-pulse rounded bg-white/20" />
                ) : (
                  <>{userName}さん</>
                )}
              </h1>
              {graduationYear && (
                <p className="mt-1 text-sm text-gray-300">
                  {graduationYear}年度卒業
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-4xl">🥋</span>
              <div className="text-right">
                <p className="text-xs text-gray-400">戸山高校剣道部</p>
                <p className="font-serif text-lg font-bold text-gold-400">OB会</p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Quick Stats */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-accent-600">{stats.tweetCount}</p>
            <p className="text-xs text-gray-500">投稿数</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gold-600">{stats.threadCount}</p>
            <p className="text-xs text-gray-500">スレッド</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-500">{stats.favoriteCount}</p>
            <p className="text-xs text-gray-500">お気に入り</p>
          </div>
        </div>
      </FadeIn>

      {/* Quick Links */}
      <div>
        <FadeIn delay={0.2}>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            <span className="underline-gold">機能メニュー</span>
          </h2>
        </FadeIn>

        <Stagger staggerDelay={0.1} className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <StaggerItem key={link.href}>
              <QuickLinkCard {...link} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>

    </div>
  );
}

function QuickLinkCard({
  href,
  title,
  description,
  icon,
  stat,
  color,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
  stat: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md"
      >
        {/* Background Gradient on Hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`} />

        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
            </div>
            <p className="mt-2 text-sm text-gray-500">{description}</p>
            <p className="mt-3 text-xs font-medium text-gray-400">{stat}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${color} text-white opacity-80 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110`}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
