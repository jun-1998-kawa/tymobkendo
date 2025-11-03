"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";
import SlideIn from "@/components/ui/SlideIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

const client = generateClient();
const models = client.models as any;

type BoardMessage = any;
type BoardThread = any;

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;

  const [thread, setThread] = useState<BoardThread | null>(null);
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // スレッド情報取得
    models.BoardThread.get({ id: threadId }).then((result: any) => {
      if (result.data) {
        setThread(result.data);
      }
    });

    // メッセージ購読
    const sub = models.BoardMessage.observeQuery({
      filter: { threadId: { eq: threadId } }
    }).subscribe({
      next: ({ items }: any) => {
        const visible = items.filter((m: any) => !m.isHidden);
        const sorted = [...visible].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sorted);
      },
    });

    return () => sub.unsubscribe();
  }, [threadId]);

  const handlePost = async () => {
    if (!body.trim()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await models.BoardMessage.create({
        threadId,
        body: body.trim()
      });
      setBody("");
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
    if (!confirm("このメッセージを削除しますか？")) return;

    try {
      await models.BoardMessage.delete({ id });
    } catch (e: any) {
      alert(e.message || "削除に失敗しました");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !loading && body.trim()) {
      handlePost();
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Back Button */}
      <FadeIn>
        <Link
          href="/app/board"
          className="inline-flex items-center gap-2 text-accent-600 transition-all duration-300 hover:gap-3 hover:text-accent-700"
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
          <span className="font-semibold">掲示板一覧に戻る</span>
        </Link>
      </FadeIn>

      {/* Thread Header */}
      {thread && (
        <SlideIn direction="up" delay={0.1}>
          <div className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-accent-50 to-gold-50 p-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {thread.pinned && (
                    <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      📌 ピン留め
                    </span>
                  )}
                  <h1 className="mb-3 text-3xl font-bold text-primary-800">
                    {thread.title}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-primary-600">
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
                    <span>
                      作成日: {new Date(thread.createdAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SlideIn>
      )}

      {/* Reply Form */}
      <SlideIn direction="up" delay={0.2}>
        <div className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-accent-50 to-gold-50 p-6">
            <h2 className="text-xl font-bold text-primary-800">返信する</h2>
          </div>

          <div className="p-6">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力...&#10;Ctrl+Enterで投稿"
              className="w-full resize-none rounded-xl border-2 border-primary-200 bg-primary-50 p-4 text-lg transition-all duration-200 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
              rows={4}
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-primary-500">
                {body.length > 0 && (
                  <span className="font-medium">
                    {body.length}文字
                  </span>
                )}
              </div>

              <button
                disabled={!body.trim() || loading}
                onClick={handlePost}
                className={`group relative overflow-hidden rounded-full px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 ${
                  !body.trim() || loading
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
                {!body.trim() || loading ? null : (
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
                  className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
                >
                  ✅ メッセージを投稿しました！
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

      {/* Messages List */}
      <div>
        <FadeIn delay={0.3}>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-primary-800">
            <span>💬</span>
            <span>メッセージ</span>
            {messages.length > 0 && (
              <span className="ml-2 rounded-full bg-accent-100 px-3 py-1 text-sm text-accent-700">
                {messages.length}件
              </span>
            )}
          </h2>
        </FadeIn>

        {messages.length === 0 ? (
          <FadeIn delay={0.4}>
            <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 p-12 text-center">
              <div className="mb-4 text-6xl">💭</div>
              <p className="text-lg text-primary-600">
                まだメッセージがありません
              </p>
              <p className="mt-2 text-sm text-primary-500">
                最初のメッセージを投稿してみましょう！
              </p>
            </div>
          </FadeIn>
        ) : (
          <Stagger staggerDelay={0.1} className="space-y-4">
            {messages.map((msg, index) => (
              <StaggerItem key={msg.id}>
                <MessageCard
                  message={msg}
                  index={index}
                  onDelete={handleDelete}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
}

// Message Card Component
function MessageCard({
  message,
  index,
  onDelete,
}: {
  message: any;
  index: number;
  onDelete: (id: string) => void;
}) {
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
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Message Number Badge */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-gold-500 text-sm font-bold text-white shadow-md">
            #{index + 1}
          </div>

          <div>
            <p className="font-semibold text-primary-800">
              {message.author || "匿名"}
            </p>
            <p className="text-sm text-primary-500">
              {new Date(message.createdAt).toLocaleString("ja-JP", {
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
              onClick={() => onDelete(message.id)}
              className="rounded-lg bg-red-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              削除
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <p className="whitespace-pre-wrap text-lg leading-relaxed text-primary-700">
        {message.body}
      </p>
    </motion.div>
  );
}
