"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import Link from "next/link";
import { motion } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import type { News } from "@/lib/amplifyClient";
import outputs from "../../amplify_outputs.json";

export default function NewsSection() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Configure Amplify
        Amplify.configure(outputs, { ssr: true });

        // 少し待機してからクライアントを生成（Amplifyの設定が完全に完了するまで）
        await new Promise(resolve => setTimeout(resolve, 100));

        // ゲストアクセス用のクライアント（APIキーモード）
        const client = generateClient({
          authMode: 'apiKey'
        });
        const models = client.models as {
          News: {
            observeQuery: (options?: unknown) => {
              subscribe: (callbacks: {
                next: (result: { items: News[] }) => void;
                error?: (err: Error) => void;
              }) => { unsubscribe: () => void };
            };
          };
        };

        // Check if News model exists
        if (!models.News) {
          console.warn("News model not found. Please run 'npx ampx sandbox' to update the schema.");
          setLoading(false);
          setError("News model not available");
          return;
        }

        const sub = models.News.observeQuery({
          filter: { isPublished: { eq: true } },
        }).subscribe({
          next: ({ items }) => {
            const sorted = [...items]
              .sort((a, b) => {
                // ピン留めを優先
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                // 公開日時で降順
                const dateA = new Date(a.publishedAt || a.createdAt).getTime();
                const dateB = new Date(b.publishedAt || b.createdAt).getTime();
                return dateB - dateA;
              })
              .slice(0, 5); // 最新5件
            setNewsList(sorted);
            setLoading(false);
          },
          error: (err) => {
            console.error("Error fetching news:", err);
            const errorMessage = err?.message || err?.toString() || "ニュースの取得に失敗しました";
            setError(errorMessage);
            setLoading(false);
          },
        });

        return () => sub.unsubscribe();
      } catch (err) {
        console.error("Error initializing NewsSection:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return null; // ローディング中は何も表示しない
  }

  if (newsList.length === 0) {
    return null; // ニュースがない場合は非表示
  }

  return (
    <section className="bg-white px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-serif text-4xl font-bold">
              <span className="text-gradient">お知らせ</span>
            </h2>
            <p className="text-base text-gray-600">
              最新のニュース・イベント・活動報告
            </p>
          </div>
        </FadeIn>

        <Stagger staggerDelay={0.1} className="space-y-6">
          {newsList.map((news) => (
            <StaggerItem key={news.id}>
              <NewsCard news={news} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

// News Card Component with Kendo-inspired Design
function NewsCard({ news }: { news: News }) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      お知らせ: { bg: "bg-accent-50", text: "text-accent-700", border: "border-accent-200" },
      イベント: { bg: "bg-gold-50", text: "text-gold-700", border: "border-gold-300" },
      活動報告: { bg: "bg-primary-50", text: "text-primary-700", border: "border-primary-200" },
    };
    return colors[category] || colors["お知らせ"];
  };

  const categoryStyle = getCategoryColor(news.category);
  const publishDate = new Date(news.publishedAt || news.createdAt);

  return (
    <Link href={`/news/${news.id}`}>
      <motion.div
        whileHover={{ x: 4, y: -2 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="group relative overflow-hidden rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md cursor-pointer"
      >
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-accent-500 to-gold-500" />

        <div className="pl-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            {/* Category Badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-full border ${categoryStyle.border} ${categoryStyle.bg} px-3 py-1 text-xs font-semibold ${categoryStyle.text}`}
            >
              {news.category}
            </span>

            {/* Pin Badge */}
            {news.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold-400 bg-gradient-to-r from-gold-50 to-amber-50 px-3 py-1 text-xs font-bold text-gold-700">
                重要
              </span>
            )}

            {/* Date */}
            <span className="text-xs text-gray-500">
              {publishDate.toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Title */}
          <h3 className="mb-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-accent-600 md:text-2xl">
            {news.title}
          </h3>

          {/* Excerpt */}
          <p className="mb-4 text-gray-600 line-clamp-2">{news.excerpt}</p>

          {/* Read More Link */}
          <div className="flex items-center gap-2 text-sm font-semibold text-accent-600">
            <span>続きを読む</span>
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
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
        </div>
      </motion.div>
    </Link>
  );
}
