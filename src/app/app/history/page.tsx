"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import FadeIn from "@/components/ui/FadeIn";
import SlideIn from "@/components/ui/SlideIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

const client = generateClient();
const models = client.models as any;

type HistoryEntry = any;

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = models.HistoryEntry.observeQuery({}).subscribe({
      next: ({ items }: any) => {
        const sorted = [...items].sort((a, b) => b.year - a.year);
        setEntries(sorted);
        setLoading(false);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  const publicEntries = entries.filter((e) => e.isPublic);
  const privateEntries = entries.filter((e) => !e.isPublic);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold text-primary-800">
            📜 高校剣道部の歴史
          </h1>
          <p className="text-primary-600">
            OB会員限定の情報も含まれます
          </p>
        </div>
      </FadeIn>

      {/* Loading State */}
      {loading && (
        <FadeIn delay={0.2}>
          <div className="rounded-2xl border-2 border-primary-200 bg-white p-12 text-center shadow-lg">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-accent-600 border-t-transparent"></div>
            <p className="text-lg text-primary-600">読み込み中...</p>
          </div>
        </FadeIn>
      )}

      {/* Empty State */}
      {!loading && entries.length === 0 && (
        <FadeIn delay={0.2}>
          <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 p-12 text-center">
            <div className="mb-4 text-6xl">📚</div>
            <p className="text-lg text-primary-600">
              まだ歴史エントリーがありません
            </p>
            <p className="mt-2 text-sm text-primary-500">
              管理者が情報を追加するまでお待ちください
            </p>
          </div>
        </FadeIn>
      )}

      {/* Public Entries Section */}
      {publicEntries.length > 0 && (
        <div className="space-y-6">
          <SlideIn direction="up" delay={0.2}>
            <div className="flex items-center gap-3">
              <div className="h-1 flex-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
              <h2 className="font-serif text-2xl font-bold text-blue-700">
                公開情報
              </h2>
              <div className="h-1 flex-1 bg-gradient-to-l from-blue-500 to-transparent"></div>
            </div>
          </SlideIn>

          <Stagger staggerDelay={0.1} className="space-y-6">
            {publicEntries.map((entry) => (
              <StaggerItem key={entry.id}>
                <HistoryCard entry={entry} isPrivate={false} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}

      {/* Private Entries Section */}
      {privateEntries.length > 0 && (
        <div className="space-y-6">
          <SlideIn direction="up" delay={publicEntries.length > 0 ? 0.4 : 0.2}>
            <div className="flex items-center gap-3">
              <div className="h-1 flex-1 bg-gradient-to-r from-green-500 to-transparent"></div>
              <h2 className="font-serif text-2xl font-bold text-green-700">
                会員限定情報
              </h2>
              <div className="h-1 flex-1 bg-gradient-to-l from-green-500 to-transparent"></div>
            </div>
          </SlideIn>

          <Stagger staggerDelay={0.1} className="space-y-6">
            {privateEntries.map((entry) => (
              <StaggerItem key={entry.id}>
                <HistoryCard entry={entry} isPrivate={true} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}
    </div>
  );
}

// History Card Component
function HistoryCard({ entry, isPrivate }: { entry: any; isPrivate: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const cardStyle = isPrivate
    ? {
        borderColor: "border-green-300",
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        accentColor: "from-green-500 to-emerald-500",
        badgeBg: "bg-green-600",
        yearColor: "text-green-700",
      }
    : {
        borderColor: "border-blue-300",
        bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
        accentColor: "from-blue-500 to-indigo-500",
        badgeBg: "bg-blue-600",
        yearColor: "text-blue-700",
      };

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      className={`group relative overflow-hidden rounded-2xl border-2 ${cardStyle.borderColor} ${cardStyle.bgColor} shadow-lg transition-all duration-300 hover:shadow-2xl`}
    >
      {/* Top Accent Bar */}
      <div className={`h-2 bg-gradient-to-r ${cardStyle.accentColor}`}></div>

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-baseline gap-4">
          {/* Year Badge */}
          <div className={`inline-flex items-center gap-2 rounded-full ${cardStyle.badgeBg} px-4 py-2 shadow-md`}>
            <span className="text-2xl font-bold text-white">
              {entry.year}
            </span>
            <span className="text-sm font-medium text-white/90">年</span>
          </div>

          {/* Title */}
          <h3 className={`flex-1 font-serif text-2xl font-bold ${cardStyle.yearColor} md:text-3xl`}>
            {entry.title}
          </h3>

          {/* Private Badge */}
          {isPrivate && (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              🔒 会員限定
            </span>
          )}
        </div>

        {/* Content - Markdown Support */}
        <div className="relative">
          <div
            className={`prose prose-lg max-w-none overflow-hidden transition-all duration-300 ${
              isExpanded ? "max-h-none" : "max-h-48"
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-3 mt-4 font-serif text-2xl font-bold text-primary-800 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-2 mt-3 font-serif text-xl font-bold text-primary-800 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 mt-2 font-serif text-lg font-bold text-primary-800 first:mt-0">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 leading-relaxed text-primary-700">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 ml-6 list-disc space-y-1 text-primary-700">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 ml-6 list-decimal space-y-1 text-primary-700">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
              }}
            >
              {entry.bodyMd}
            </ReactMarkdown>
          </div>

          {/* Gradient Fade for Collapsed State */}
          {!isExpanded && entry.bodyMd.length > 200 && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
          )}
        </div>

        {/* Expand/Collapse Button */}
        {entry.bodyMd.length > 200 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`inline-flex items-center gap-2 rounded-full border-2 ${
                isPrivate
                  ? "border-green-600 text-green-700 hover:bg-green-600"
                  : "border-blue-600 text-blue-700 hover:bg-blue-600"
              } bg-white px-6 py-2 font-semibold transition-all duration-300 hover:text-white`}
            >
              <span>{isExpanded ? "閉じる" : "続きを読む"}</span>
              <svg
                className={`h-5 w-5 transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Hover Effect Background */}
      <div
        className={`absolute bottom-0 right-0 h-32 w-32 translate-x-12 translate-y-12 rounded-full bg-gradient-to-tl ${
          isPrivate ? "from-green-100 to-emerald-100" : "from-blue-100 to-indigo-100"
        } opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-40`}
      ></div>
    </motion.div>
  );
}
