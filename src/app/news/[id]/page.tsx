"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";
import { Amplify } from "aws-amplify";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";
import SlideIn from "@/components/ui/SlideIn";
import { ReactionsProvider } from "@/components/reactions/ReactionsProvider";
import ReactionBar from "@/components/reactions/ReactionBar";
import outputs from "../../../../amplify_outputs.json";

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

        // 少し待機してからクライアントを生成（Amplifyの設定が完全に完了するまで）
        await new Promise(resolve => setTimeout(resolve, 100));

        // ゲストアクセス用のクライアント (Cognito Identity Pool guest 経由の IAM 認証)
        const client = generateClient({
          authMode: 'identityPool'
        });
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="kendo-pill mb-4 inline-block h-12 w-12 animate-spin border-4 border-accent-700 border-t-transparent"></div>
          <p className="text-lg text-primary-700">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="card-accent-bar relative max-w-md border border-gray-200 bg-white p-8 pl-9 shadow-md">
          <h1 className="mb-3 font-serif text-2xl font-bold text-primary-900">
            ニュースを表示できません
          </h1>
          <p className="mb-6 text-base text-primary-700">{error}</p>
          <Link
            href="/"
            className="group relative inline-flex items-center gap-2 overflow-hidden bg-primary-900 px-6 py-3 font-serif text-sm font-semibold text-white transition-all hover:bg-primary-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>トップページへ</span>
            <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-accent-500 to-gold-500 transition-all duration-300 group-hover:w-full" />
          </Link>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    // kendo triad — accent (朱) / gold (金) / primary (黒) で統一
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
    <main className="min-h-screen bg-white">
      {/* Header Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 font-serif text-sm font-semibold text-primary-700 transition-colors hover:text-accent-700"
          >
            <svg
              className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1"
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
            <span>トップページに戻る</span>
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
                className={`inline-flex items-center border ${categoryStyle.border} ${categoryStyle.bg} px-3 py-1 text-xs font-semibold tracking-wide ${categoryStyle.text}`}
              >
                {news.category}
              </span>

              {/* Pin Badge */}
              {news.isPinned && (
                <span className="inline-flex items-center border border-gold-400 bg-gold-50 px-3 py-1 text-xs font-bold tracking-wide text-gold-700">
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

            <h1 className="mb-6 font-serif text-4xl font-bold leading-tight text-primary-900 md:text-5xl">
              {news.title}
            </h1>

            <p className="text-xl leading-relaxed text-primary-700">
              {news.excerpt}
            </p>
          </header>
        </FadeIn>

        {/* Divider — 朱→金 のシグネチャ細線 */}
        <div className="mb-12 h-[2px] w-24 bg-gradient-to-r from-accent-500 to-gold-500 opacity-80"></div>

        {/* Images Gallery */}
        {imageUrls.length > 0 && (
          <SlideIn direction="up" delay={0.2}>
            <div className="mb-12">
              <div className={`grid gap-4 ${imageUrls.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
                {imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden border border-gray-200 shadow-lg transition-all hover:shadow-2xl"
                    style={{ minHeight: '300px' }}
                  >
                    <Image
                      src={url}
                      alt={`${news.title} - 画像 ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
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
            <div className="border border-gray-200 bg-white p-8 shadow-lg md:p-12">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                allowedElements={['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'code', 'pre', 'blockquote', 'strong', 'em', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td']}
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-4 mt-8 font-serif text-3xl font-bold text-gray-900 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-3 mt-6 font-serif text-2xl font-bold text-gray-900 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-4 font-serif text-xl font-bold text-gray-900 first:mt-0">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-relaxed text-gray-700">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-4 ml-6 list-disc space-y-2 text-gray-700">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 ml-6 list-decimal space-y-2 text-gray-700">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      className="text-accent-700 underline underline-offset-4 transition-colors hover:text-accent-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-4 border-l-4 border-accent-500 bg-accent-50 p-4 text-primary-800">
                      {children}
                    </blockquote>
                  ),
                  code: ({ className, children }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-primary-50 px-2 py-1 font-mono text-sm text-primary-800">
                        {children}
                      </code>
                    ) : (
                      <code className="block overflow-x-auto bg-primary-900 p-4 font-mono text-sm text-white">
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

        {/* Reactions（会員のみ表示・操作可。ゲストには表示されない） */}
        <ReactionsProvider>
          <div className="mt-10 flex justify-center">
            <ReactionBar targetType="News" targetId={news.id} />
          </div>
        </ReactionsProvider>

        {/* Footer CTA */}
        <SlideIn direction="up" delay={imageUrls.length > 0 ? 0.6 : 0.4}>
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden border-2 border-primary-900 bg-white px-8 py-4 font-serif text-base font-semibold text-primary-900 transition-all duration-300 hover:bg-primary-900 hover:text-white"
            >
              <svg
                className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1"
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
      <footer className="mt-20 border-t border-gray-200 bg-white px-4 py-12 text-center">
        <div className="mx-auto mb-4 h-[2px] w-16 bg-gradient-to-r from-accent-500 to-gold-500 opacity-70" />
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} 戸山高校剣道部OB会. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
