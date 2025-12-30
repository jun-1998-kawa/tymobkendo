"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { models } from "@/lib/amplifyClient";
import { formatLocalDate } from "@/utils/dateFormatter";
import type { BoardThread } from "@/lib/amplifyClient";

export default function BoardPage() {
  const [threads, setThreads] = useState<BoardThread[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
  };

  const pinnedThreads = threads.filter((t) => t.pinned);
  const regularThreads = threads.filter((t) => !t.pinned);

  return (
    <div className="mx-auto max-w-5xl" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      {/* Header */}
      <div className="bg-[#EFEFEF] border-b border-gray-400 px-4 py-3">
        <h1 className="text-2xl font-bold text-gray-800">掲示板</h1>
      </div>

      {/* Create Thread Form */}
      <div className="bg-[#EFEFEF] border-b border-gray-300 p-4">
        <div className="bg-white border border-gray-400 p-3">
          <div className="mb-2">
            <label className="text-sm font-semibold text-gray-700">
              新規スレッド作成
            </label>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="スレッドタイトル"
              className="flex-1 border border-gray-400 px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
            />
            <button
              onClick={handleCreate}
              disabled={!title.trim() || loading}
              className={`px-4 py-2 text-sm border border-gray-400 ${
                !title.trim() || loading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100 text-gray-700"
              }`}
            >
              {loading ? "作成中..." : "作成する"}
            </button>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mt-2 text-sm text-green-700 bg-green-50 border border-green-300 p-2">
              スレッドを作成しました
            </div>
          )}

          {error && (
            <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-300 p-2">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Thread List */}
      <div className="bg-white">
        {/* Pinned Threads */}
        {pinnedThreads.length > 0 && (
          <div className="border-b-2 border-gray-400">
            <div className="bg-[#FFFFCC] px-4 py-2 border-b border-gray-300">
              <span className="text-sm font-bold text-gray-700">■ 固定スレッド</span>
            </div>
            {pinnedThreads.map((thread, index) => (
              <ThreadRow key={thread.id} thread={thread} index={index + 1} isPinned />
            ))}
          </div>
        )}

        {/* Regular Threads */}
        <div>
          {threads.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              スレッドがありません
            </div>
          ) : regularThreads.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              通常スレッドはありません
            </div>
          ) : (
            regularThreads.map((thread, index) => (
              <ThreadRow key={thread.id} thread={thread} index={index + 1} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Thread Row Component
function ThreadRow({ thread, index, isPinned = false }: { thread: BoardThread; index: number; isPinned?: boolean }) {
  return (
    <Link href={`/app/board/${thread.id}`}>
      <div className={`px-4 py-2.5 border-b border-gray-200 hover:bg-gray-50 ${
        isPinned ? 'bg-[#FFFFEE]' : 'bg-white'
      }`}>
        <div className="flex items-baseline gap-2 text-sm">
          <span className="text-gray-500 font-mono">{index}:</span>
          <span className="flex-1 text-blue-700 hover:underline">
            {thread.title}
          </span>
          {isPinned && (
            <span className="text-xs text-red-600 font-bold">【固定】</span>
          )}
          <span className="text-xs text-gray-500">
            ({formatLocalDate(thread.createdAt)})
          </span>
        </div>
      </div>
    </Link>
  );
}
