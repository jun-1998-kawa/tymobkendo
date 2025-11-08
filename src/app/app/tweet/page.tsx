"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { motion, AnimatePresence } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";
import SlideIn from "@/components/ui/SlideIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

const client = generateClient();
const models = client.models as any;

type Tweet = any;

export default function TweetPage() {
  const [content, setContent] = useState("");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const sub = models.Tweet.observeQuery({}).subscribe({
      next: ({ items }: any) => {
        const sorted = items
          .filter((t: any) => !t.isHidden)
          .sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        setTweets(sorted);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  const max = 140;
  const disabled = content.length === 0 || content.length > max;
  const charPercentage = (content.length / max) * 100;

  const handlePost = async () => {
    if (disabled) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await models.Tweet.create({ content });
      setContent("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || "投稿に失敗しました");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この投稿を削除しますか？")) return;

    try {
      await models.Tweet.delete({ id });
    } catch (e: any) {
      alert(e.message || "削除に失敗しました");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !disabled) {
      handlePost();
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold text-primary-800">
            💬 Tweet
          </h1>
          <p className="text-primary-600">
            140文字で今の気持ちを共有しよう
          </p>
        </div>
      </FadeIn>

      {/* Post Form */}
      <SlideIn direction="up" delay={0.1}>
        <div className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-accent-50 to-gold-50 p-6">
            <h2 className="text-xl font-bold text-primary-800">新規投稿</h2>
          </div>

          <div className="p-6">
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={max + 10}
                placeholder="今何してる？&#10;Ctrl+Enterで投稿"
                className={`w-full resize-none rounded-xl border-2 p-4 text-lg transition-all duration-200 focus:outline-none focus:ring-2 ${
                  content.length > max
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                    : "border-primary-200 bg-primary-50 focus:border-accent-500 focus:ring-accent-200"
                }`}
                rows={4}
              />

              {/* Character Counter Circle */}
              <div className="absolute bottom-4 right-4">
                <svg className="h-12 w-12 -rotate-90 transform">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#e5e7eb"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke={content.length > max ? "#ef4444" : "#D32F2F"}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 20 * (1 - Math.min(charPercentage, 100) / 100)
                    }`}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`text-xs font-bold ${
                      content.length > max ? "text-red-600" : "text-primary-600"
                    }`}
                  >
                    {max - content.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-primary-500">
                {content.length > max && (
                  <span className="font-semibold text-red-600">
                    文字数オーバー！ ({content.length - max}文字削除)
                  </span>
                )}
              </div>

              <button
                disabled={disabled || loading}
                onClick={handlePost}
                className={`group relative overflow-hidden rounded-full px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 ${
                  disabled || loading
                    ? "cursor-not-allowed bg-primary-300"
                    : "bg-gradient-to-r from-accent-600 to-accent-700 hover:scale-105 hover:shadow-xl"
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      投稿中...
                    </>
                  ) : (
                    <>
                      <span>投稿する</span>
                      <span className="text-xl">→</span>
                    </>
                  )}
                </span>
                {!disabled && !loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-700 to-accent-800 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                )}
              </button>
            </div>

            {/* Success/Error Messages */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 rounded-lg bg-green-50 p-4 text-green-800 border border-green-200"
                >
                  ✅ 投稿しました！
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 rounded-lg bg-red-50 p-4 text-red-800 border border-red-200"
                >
                  ❌ {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SlideIn>

      {/* Tweet List */}
      <div>
        <FadeIn delay={0.2}>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-primary-800">
            <span>📋</span>
            <span>最新の投稿</span>
            {tweets.length > 0 && (
              <span className="ml-2 rounded-full bg-accent-100 px-3 py-1 text-sm text-accent-700">
                {tweets.length}件
              </span>
            )}
          </h2>
        </FadeIn>

        {tweets.length === 0 ? (
          <FadeIn delay={0.3}>
            <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 p-12 text-center">
              <div className="mb-4 text-6xl">📝</div>
              <p className="text-lg text-primary-600">
                まだ投稿がありません
              </p>
              <p className="mt-2 text-sm text-primary-500">
                最初の投稿をしてみましょう！
              </p>
            </div>
          </FadeIn>
        ) : (
          <Stagger staggerDelay={0.1} className="space-y-4">
            {tweets.map((tweet) => (
              <StaggerItem key={tweet.id}>
                <TweetCard tweet={tweet} onDelete={handleDelete} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
}

// Tweet Card Component
function TweetCard({ tweet, onDelete }: { tweet: any; onDelete: (id: string) => void }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      onHoverStart={() => setShowActions(true)}
      onHoverEnd={() => setShowActions(false)}
      className="group relative overflow-hidden rounded-xl border border-primary-200 bg-white p-6 shadow-md transition-shadow duration-300 hover:shadow-xl"
    >
      {/* Gradient Accent */}
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-accent-500 to-gold-500"></div>

      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-gold-500 text-white font-bold">
            {(tweet.author || "匿名")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-primary-800">
              {tweet.author || "匿名"}
            </p>
            <p className="text-sm text-primary-500">
              {new Date(tweet.createdAt).toLocaleString("ja-JP", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Delete Button */}
        <AnimatePresence>
          {showActions && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onDelete(tweet.id)}
              className="rounded-lg bg-red-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              削除
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <p className="whitespace-pre-wrap text-lg leading-relaxed text-primary-700">
        {tweet.content}
      </p>

      {/* Character Count Badge */}
      <div className="mt-4 flex justify-end">
        <span className="rounded-full bg-primary-100 px-3 py-1 text-xs text-primary-600">
          {tweet.content.length}文字
        </span>
      </div>
    </motion.div>
  );
}
