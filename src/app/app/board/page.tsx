"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { models } from "@/lib/amplifyClient";
import { formatLocalDate } from "@/utils/dateFormatter";
import type { BoardThread } from "@/lib/amplifyClient";
import FadeIn from "@/components/ui/FadeIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

export default function BoardPage() {
  const [threads, setThreads] = useState<BoardThread[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const sub = models.BoardThread.observeQuery({}).subscribe({
      next: ({ items }: { items: BoardThread[] }) => {
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
      setShowForm(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      const message = e instanceof Error ? e.message : "スレッド作成に失敗しました";
      setError(message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleCreate();
    }
    if (e.key === "Escape") {
      setShowForm(false);
      setTitle("");
    }
  };

  const pinnedThreads = threads.filter((t) => t.pinned);
  const regularThreads = threads.filter((t) => !t.pinned);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <FadeIn>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              <span className="underline-gold">掲示板</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {threads.length}件のスレッド
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-600 to-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規スレッド
          </motion.button>
        </div>
      </FadeIn>

      {/* Create Thread Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <label className="text-sm font-medium text-gray-700">
                  スレッドタイトル
                </label>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="新しいスレッドのタイトルを入力..."
                  autoFocus
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100"
                />
                <button
                  onClick={handleCreate}
                  disabled={!title.trim() || loading}
                  className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
                    !title.trim() || loading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  {loading ? "作成中..." : "作成"}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setTitle("");
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            スレッドを作成しました
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thread List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Pinned Threads */}
        {pinnedThreads.length > 0 && (
          <div className="border-b border-gray-200">
            <div className="flex items-center gap-2 bg-gradient-to-r from-gold-50 to-amber-50 px-4 py-2.5">
              <span className="text-lg">📌</span>
              <span className="text-sm font-semibold text-gold-700">固定スレッド</span>
            </div>
            <Stagger staggerDelay={0.05}>
              {pinnedThreads.map((thread, index) => (
                <StaggerItem key={thread.id}>
                  <ThreadRow thread={thread} index={index + 1} isPinned />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        )}

        {/* Regular Threads */}
        <div>
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 text-5xl">💬</div>
              <p className="text-lg font-medium text-gray-700">スレッドがありません</p>
              <p className="mt-1 text-sm text-gray-500">最初のスレッドを作成しましょう</p>
            </div>
          ) : regularThreads.length === 0 && pinnedThreads.length > 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              通常スレッドはありません
            </div>
          ) : (
            <Stagger staggerDelay={0.03}>
              {regularThreads.map((thread, index) => (
                <StaggerItem key={thread.id}>
                  <ThreadRow thread={thread} index={pinnedThreads.length + index + 1} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </div>
    </div>
  );
}

// Thread Row Component - Modern Design
function ThreadRow({ thread, index, isPinned = false }: { thread: BoardThread; index: number; isPinned?: boolean }) {
  return (
    <Link href={`/app/board/${thread.id}`}>
      <motion.div
        whileHover={{ x: 4 }}
        className={`group flex items-center gap-4 border-b border-gray-100 px-4 py-3.5 transition-colors last:border-b-0 ${
          isPinned ? "bg-gold-50/50 hover:bg-gold-50" : "hover:bg-gray-50"
        }`}
      >
        {/* Thread Number */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500 group-hover:bg-accent-100 group-hover:text-accent-600 transition-colors">
          {index}
        </div>

        {/* Thread Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-gray-900 group-hover:text-accent-600 transition-colors">
              {thread.title}
            </span>
            {isPinned && (
              <span className="flex-shrink-0 rounded-full bg-gold-100 px-2 py-0.5 text-xs font-semibold text-gold-700">
                固定
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatLocalDate(thread.createdAt)}
          </p>
        </div>

        {/* Arrow */}
        <svg
          className="h-5 w-5 flex-shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-accent-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.div>
    </Link>
  );
}
