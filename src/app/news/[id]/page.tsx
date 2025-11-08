"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";
import { Amplify } from "aws-amplify";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";
import SlideIn from "@/components/ui/SlideIn";
import outputs from "../../../amplify_outputs.json";

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const newsId = params.id as string;

  const [news, setNews] = useState<any>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Configure Amplify
        Amplify.configure(outputs, { ssr: true });
        const client = generateClient();
        const models = client.models as any;

        if (!models.News) {
          setError("News model not available");
          setLoading(false);
          return;
        }

        const result = await models.News.get({ id: newsId });

        if (!result.data) {
          setError("ニュースが見つかりません");
          setLoading(false);
          return;
        }

        // 公開されていないニュースはアクセス不可
        if (!result.data.isPublished) {
          setError("このニュースは公開されていません");
          setLoading(false);
          return;
        }

        setNews(result.data);

        // 画像URLを取得
        if (result.data.imagePaths && result.data.imagePaths.length > 0) {
          const urls = await Promise.all(
            result.data.imagePaths.map(async (path: string) => {
              try {
                const urlResult = await getUrl({ path: `public/${path}` });
                return urlResult.url.toString();
              } catch (err) {
                console.error("Error getting image URL:", err);
                return null;
              }
            })
          );
          setImageUrls(urls.filter((url): url is string => url !== null));
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("ニュースの取得に失敗しました");
        setLoading(false);
      }
    };

    fetchNews();
  }, [newsId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-gold-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-lg text-primary-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-gold-50 px-4">
        <div className="max-w-md rounded-2xl border-2 border-red-200 bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-6xl">❌</div>
          <h1 className="mb-4 font-serif text-3xl font-bold text-primary-800">
            エラー
          </h1>
          <p className="mb-6 text-lg text-primary-600">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white transition-all hover:scale-105"
          >
            トップページへ
          </Link>
        </div>
      </div>
    );
  }

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
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-gold-50">
      {/* Header Navigation */}
      <nav className="border-b border-primary-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 transition-all hover:gap-3"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-semibold">トップページに戻る</span>
          </Link>
        </div>
      </nav>

      {/* Article Content */}
      <article className="mx-auto max-w-4xl px-4 py-12">
        <FadeIn>
          {/* Header */}
          <header className="mb-12">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {/* Category Badge */}
              <span
                className={`inline-flex items-center gap-1 rounded-full border ${categoryStyle.border} ${categoryStyle.bg} px-4 py-2 text-sm font-semibold ${categoryStyle.text}`}
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
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
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

            <h1 className="mb-6 font-serif text-4xl font-bold leading-tight text-primary-800 md:text-5xl">
              {news.title}
            </h1>

            <p className="text-xl leading-relaxed text-primary-600">
              {news.excerpt}
            </p>
          </header>
        </FadeIn>

        {/* Divider */}
        <div className="mb-12 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-transparent"></div>

        {/* Images Gallery */}
        {imageUrls.length > 0 && (
          <SlideIn direction="up" delay={0.2}>
            <div className="mb-12">
              <div className={`grid gap-4 ${imageUrls.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
                {imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-primary-200 shadow-lg transition-all hover:shadow-2xl"
                  >
                    <img
                      src={url}
                      alt={`${news.title} - 画像 ${index + 1}`}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </SlideIn>
        )}

        {/* Main Content */}
        <SlideIn direction="up" delay={imageUrls.length > 0 ? 0.4 : 0.2}>
          <div className="prose prose-lg max-w-none">
            <div className="rounded-2xl border border-primary-200 bg-white p-8 shadow-lg md:p-12">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="markdown-content"
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-4 mt-8 font-serif text-3xl font-bold text-primary-800 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-3 mt-6 font-serif text-2xl font-bold text-primary-800 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-4 font-serif text-xl font-bold text-primary-800 first:mt-0">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-relaxed text-primary-700">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-4 ml-6 list-disc space-y-2 text-primary-700">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 ml-6 list-decimal space-y-2 text-primary-700">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-blue-600 underline transition-colors hover:text-blue-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-4 border-l-4 border-blue-500 bg-blue-50 p-4 italic text-primary-700">
                      {children}
                    </blockquote>
                  ),
                  code: ({ className, children }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="rounded bg-primary-100 px-2 py-1 font-mono text-sm text-primary-800">
                        {children}
                      </code>
                    ) : (
                      <code className="block overflow-x-auto rounded-lg bg-primary-900 p-4 font-mono text-sm text-white">
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {news.content}
              </ReactMarkdown>
            </div>
          </div>
        </SlideIn>

        {/* Footer CTA */}
        <SlideIn direction="up" delay={imageUrls.length > 0 ? 0.6 : 0.4}>
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-3 rounded-full border-2 border-primary-800 bg-white px-8 py-4 text-lg font-semibold text-primary-800 transition-all duration-300 hover:bg-primary-800 hover:text-white"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>他のニュースを見る</span>
            </Link>
          </div>
        </SlideIn>
      </article>

      {/* Footer */}
      <footer className="mt-20 border-t border-primary-200 bg-white px-4 py-12 text-center">
        <p className="text-sm text-primary-500">
          © 2024 戸山高校剣道部OB会. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
