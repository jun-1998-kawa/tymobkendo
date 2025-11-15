"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import Link from "next/link";
import { motion } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import outputs from "../../amplify_outputs.json";

export default function NewsSection() {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Configure Amplify
      Amplify.configure(outputs, { ssr: true });

      // ゲストアクセス用のクライアント（APIキーモード）
      const client = generateClient({
        authMode: 'apiKey'
      });
      const models = client.models as any;

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
        next: ({ items }: any) => {
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
        error: (err: any) => {
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
  }, []);

  if (loading) {
    return null; // ローディング中は何も表示しない
  }

  if (newsList.length === 0) {
    return null; // ニュースがない場合は非表示
  }

  return (
    <section className="bg-gradient-to-b from-white to-primary-50 px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <div className="mb-12 text-center">
            <div className="mb-4 inline-block border-b-4 border-blue-600 pb-2">
              <h2 className="font-serif text-4xl font-bold text-primary-800">
                お知らせ
              </h2>
            </div>
            <p className="mt-4 text-lg text-primary-600">
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

// News Card Component with Atlassian-inspired Design
function NewsCard({ news }: { news: any }) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      お知らせ: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
      イベント: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
      活動報告: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    };
    return colors[category] || colors["お知らせ"];
  };

  const categoryStyle = getCategoryColor(news.category);
  const publishDate = new Date(news.publishedAt || news.createdAt);

  return (
    <Link href={`/news/${news.id}`}>
      <motion.div
        whileHover={{ scale: 1.01, y: -4 }}
        transition={{ duration: 0.2 }}
        className="group relative overflow-hidden rounded-xl border-2 border-primary-200 bg-white shadow-lg transition-all duration-300 hover:border-blue-300 hover:shadow-2xl cursor-pointer"
      >
        {/* Top Border Accent */}
        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

        <div className="p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {/* Category Badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-full border ${categoryStyle.border} ${categoryStyle.bg} px-3 py-1 text-sm font-semibold ${categoryStyle.text}`}
            >
              <span>
                {news.category === "お知らせ" && "📢"}
                {news.category === "イベント" && "📅"}
                {news.category === "活動報告" && "📝"}
              </span>
              {news.category}
            </span>

            {/* Pin Badge */}
            {news.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                📌 重要
              </span>
            )}

            {/* Date */}
            <span className="text-sm text-primary-500">
              {publishDate.toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Title */}
          <h3 className="mb-3 font-serif text-2xl font-bold leading-tight text-primary-800 transition-colors group-hover:text-blue-700 md:text-3xl">
            {news.title}
          </h3>

          {/* Excerpt */}
          <p className="mb-4 leading-relaxed text-primary-600">{news.excerpt}</p>

          {/* Read More Link */}
          <div className="flex items-center gap-2 text-blue-600 transition-all group-hover:gap-3">
            <span className="font-semibold">続きを読む</span>
            <svg
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
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

        {/* Subtle Gradient Background on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-indigo-50/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
      </motion.div>
    </Link>
  );
}
