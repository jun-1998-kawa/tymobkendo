"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { getUrl } from "aws-amplify/storage";
import { models } from "@/lib/amplifyClient";
import type { SiteConfig, HeroSlide } from "@/lib/amplifyClient";
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
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ユーザー情報を取得
        const user = await getCurrentUser();
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

        // 有効なツイート（非表示でないもの）をフィルタリング
        const visibleTweets = tweetsResult.data?.filter((t) => !t.isHidden) || [];
        const visibleTweetIds = new Set(visibleTweets.map((t) => t.id));

        // 自分のお気に入りのみカウント（かつ有効なツイートへのもののみ）
        const myValidFavorites = favoritesResult.data?.filter((fav) => {
          // 自分のお気に入りかチェック（ownerまたはカスタムID形式で判定）
          const isMyFavorite = fav.owner === user.userId ||
            (fav.id && fav.id.includes('#') && fav.id.split('#')[1] === user.userId);
          // 有効なツイートへのお気に入りかチェック
          const isValidTweet = visibleTweetIds.has(fav.tweetId);
          return isMyFavorite && isValidTweet;
        }) || [];

        setStats({
          tweetCount: visibleTweets.length,
          favoriteCount: myValidFavorites.length,
          threadCount: threadsResult.data?.length || 0,
        });

        // 背景画像を取得（トップページと同じ画像を使用）
        try {
          const siteConfigResult = await models.SiteConfig.list({
            filter: { isActive: { eq: true } },
            limit: 1,
          });

          const config = siteConfigResult.data?.[0] as SiteConfig | undefined;

          if (config?.useHeroSlides) {
            // HeroSlidesを使用している場合
            const heroSlidesResult = await models.HeroSlide.list({
              filter: { isActive: { eq: true } },
            });
            const slides = heroSlidesResult.data as HeroSlide[] | null;
            if (slides && slides.length > 0) {
              const sortedSlides = [...slides].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
              const firstSlide = sortedSlides[0];
              if (firstSlide.mediaPath && firstSlide.mediaType !== 'video') {
                const url = await getUrl({
                  path: `public/${firstSlide.mediaPath}`,
                  options: { validateObjectExistence: false, expiresIn: 3600 }
                });
                setBackgroundImage(url.url.toString());
              }
            }
          } else if (config?.heroImagePaths && config.heroImagePaths.length > 0) {
            // heroImagePathsを使用している場合
            const url = await getUrl({
              path: `public/${config.heroImagePaths[0]}`,
              options: { validateObjectExistence: false, expiresIn: 3600 }
            });
            setBackgroundImage(url.url.toString());
          } else if (config?.heroImagePath) {
            // 単一のheroImagePathを使用している場合
            const url = await getUrl({
              path: `public/${config.heroImagePath}`,
              options: { validateObjectExistence: false, expiresIn: 3600 }
            });
            setBackgroundImage(url.url.toString());
          }
        } catch (bgError) {
          console.error("Error loading background image:", bgError);
        }
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
      icon: "edit",
      stat: `${stats.tweetCount}件の投稿`,
      color: "from-accent-500 to-accent-600",
    },
    {
      href: "/app/board",
      title: "掲示板",
      description: "スレッド形式で議論",
      icon: "message",
      stat: `${stats.threadCount}件のスレッド`,
      color: "from-gold-500 to-gold-600",
    },
    {
      href: "/app/history",
      title: "歴史アーカイブ",
      description: "剣道部の歴史を閲覧",
      icon: "book",
      stat: "1923年〜",
      color: "from-primary-700 to-primary-800",
    },
    {
      href: "/app/favorites",
      title: "お気に入り",
      description: "保存した投稿を確認",
      icon: "heart",
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
    <div className="relative mx-auto max-w-6xl space-y-8">
      {/* Background Image */}
      {backgroundImage && (
        <div className="fixed inset-0 -z-10">
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-cover opacity-10"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 via-gray-50/90 to-gray-50" />
        </div>
      )}

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
            <div className="text-right">
              <p className="text-xs text-gray-400">戸山高校剣道部</p>
              <p className="font-serif text-lg font-bold text-gold-400">OB会</p>
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

// Icon component for cards
function CardIcon({ name, className }: { name: string; className?: string }) {
  const baseClass = className || "h-5 w-5";

  switch (name) {
    case "edit":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      );
    case "message":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      );
    case "book":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      );
    case "heart":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      );
    default:
      return null;
  }
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
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
        className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md"
      >
        {/* Background Gradient on Hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`} />

        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white shadow-sm`}>
                <CardIcon name={icon} className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
            </div>
            <p className="mt-3 text-sm text-gray-500">{description}</p>
            <p className="mt-2 text-xs font-medium text-gray-400">{stat}</p>
          </div>
          <svg className="h-5 w-5 text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </motion.div>
    </Link>
  );
}
