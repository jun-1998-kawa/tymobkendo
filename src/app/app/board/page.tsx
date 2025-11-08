"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";
import SlideIn from "@/components/ui/SlideIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

const client = generateClient();
const models = client.models as any;

type BoardThread = any;

export default function BoardPage() {
  const [threads, setThreads] = useState<BoardThread[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const sub = models.BoardThread.observeQuery({}).subscribe({
      next: ({ items }: any) => {
        const sorted = [...items].sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setThreads(sorted);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await models.BoardThread.create({ title: title.trim() });
      setTitle("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || "スレッド作成に失敗しました");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleCreate();
    }
  };

  const pinnedThreads = threads.filter((t) => t.pinned);
  const regularThreads = threads.filter((t) => !t.pinned);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold text-primary-800">
            📋 掲示板
          </h1>
          <p className="text-primary-600">
            スレッドを立てて、みんなで議論しよう
          </p>
        </div>
      </FadeIn>

      {/* Create Thread Form */}
      <SlideIn direction="up" delay={0.1}>
        <div className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-accent-50 to-gold-50 p-6">
            <h2 className="text-xl font-bold text-primary-800">新規スレッド作成</h2>
          </div>

          <div className="p-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="スレッドのタイトルを入力..."
                className="flex-1 rounded-xl border-2 border-primary-200 bg-primary-50 px-4 py-3 text-lg transition-all focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
              />
              <button
                onClick={handleCreate}
                disabled={!title.trim() || loading}
                className={`rounded-xl px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 ${
                  !title.trim() || loading
                    ? "cursor-not-allowed bg-primary-300"
                    : "bg-gradient-to-r from-accent-600 to-accent-700 hover:scale-105 hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
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
                    作成中...
                  </span>
                ) : (
                  "作成"
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
                  className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
                >
                  ✅ スレッドを作成しました！
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
                >
                  ❌ {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SlideIn>

      {/* Thread List */}
      <div className="space-y-6">
        {/* Pinned Threads */}
        {pinnedThreads.length > 0 && (
          <div>
            <FadeIn delay={0.2}>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-primary-800">
                <span>📌</span>
                <span>ピン留めスレッド</span>
              </h2>
            </FadeIn>

            <Stagger staggerDelay={0.1} className="space-y-3">
              {pinnedThreads.map((thread) => (
                <StaggerItem key={thread.id}>
                  <ThreadCard thread={thread} isPinned />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        )}

        {/* Regular Threads */}
        <div>
          <FadeIn delay={0.3}>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-primary-800">
              <span>💬</span>
              <span>スレッド一覧</span>
              {regularThreads.length > 0 && (
                <span className="ml-2 rounded-full bg-accent-100 px-3 py-1 text-sm text-accent-700">
                  {regularThreads.length}件
                </span>
              )}
            </h2>
          </FadeIn>

          {threads.length === 0 ? (
            <FadeIn delay={0.4}>
              <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 p-12 text-center">
                <div className="mb-4 text-6xl">📝</div>
                <p className="text-lg text-primary-600">
                  まだスレッドがありません
                </p>
                <p className="mt-2 text-sm text-primary-500">
                  最初のスレッドを作成してみましょう！
                </p>
              </div>
            </FadeIn>
          ) : regularThreads.length === 0 ? (
            <p className="text-center text-primary-500">通常スレッドはありません</p>
          ) : (
            <Stagger staggerDelay={0.1} className="space-y-3">
              {regularThreads.map((thread) => (
                <StaggerItem key={thread.id}>
                  <ThreadCard thread={thread} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </div>
    </div>
  );
}

// Thread Card Component
function ThreadCard({ thread, isPinned = false }: { thread: any; isPinned?: boolean }) {
  return (
    <Link href={`/app/board/${thread.id}`}>
      <motion.div
        whileHover={{ scale: 1.01, x: 4 }}
        className={`group relative overflow-hidden rounded-xl border p-6 shadow-md transition-all duration-300 hover:shadow-xl ${
          isPinned
            ? "border-gold-300 bg-gradient-to-r from-gold-50 to-yellow-50"
            : "border-primary-200 bg-white"
        }`}
      >
        {/* Gradient Accent */}
        <div
          className={`absolute left-0 top-0 h-full w-1 ${
            isPinned
              ? "bg-gradient-to-b from-gold-500 to-yellow-500"
              : "bg-gradient-to-b from-accent-500 to-gold-500"
          }`}
        ></div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              {isPinned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  📌 ピン留め
                </span>
              )}
            </div>

            <h3 className="mb-2 text-xl font-bold text-primary-800 group-hover:text-accent-600 transition-colors">
              {thread.title}
            </h3>

            <div className="flex items-center gap-4 text-sm text-primary-500">
              <span className="flex items-center gap-1">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {new Date(thread.createdAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Arrow Icon */}
          <div className="flex items-center text-primary-400 transition-all group-hover:translate-x-2 group-hover:text-accent-600">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
