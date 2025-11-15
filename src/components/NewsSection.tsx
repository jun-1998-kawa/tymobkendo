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
            <h2 className="mb-2 text-4xl font-bold text-gray-900">
              お知らせ
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
        whileHover={{ x: 4 }}
        transition={{ duration: 0.15 }}
        className="group border-l-4 border-blue-600 bg-white p-6 transition-all hover:bg-gray-50 cursor-pointer"
      >
        <div className="mb-3 flex flex-wrap items-center gap-3">
          {/* Category Badge */}
          <span
            className={`inline-flex items-center gap-1 border ${categoryStyle.border} ${categoryStyle.bg} px-2 py-1 text-xs font-semibold uppercase tracking-wide ${categoryStyle.text}`}
          >
            {news.category}
          </span>

          {/* Pin Badge */}
          {news.isPinned && (
            <span className="inline-flex items-center gap-1 border border-amber-600 bg-amber-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
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
        <h3 className="mb-2 text-2xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
          {news.title}
        </h3>

        {/* Excerpt */}
        <p className="mb-3 text-gray-600">{news.excerpt}</p>

        {/* Read More Link */}
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <span>続きを読む</span>
          <svg
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
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
      </motion.div>
    </Link>
  );
}
