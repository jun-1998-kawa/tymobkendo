"use client";
import { useEffect, useState } from "react";
import { getUrl } from "aws-amplify/storage";
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { models } from "@/lib/amplifyClient";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useImageUpload } from "@/hooks/useImageUpload";
import { formatDateTime } from "@/utils/dateFormatter";
import type { BoardThread, BoardMessage } from "@/lib/amplifyClient";

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;
  const { isAdmin } = useIsAdmin();

  const [thread, setThread] = useState<BoardThread | null>(null);
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("");

  const {
    imagePaths,
    uploading,
    error: uploadError,
    handleImageUpload,
    handleRemoveImage,
    reset: resetImages,
  } = useImageUpload({
    basePath: "members",
    userId: currentUserId,
    category: "board",
    maxFiles: 4,
    onError: (err) => {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    },
  });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        setCurrentUserId(user.userId);

        const familyName = attributes.family_name || "";
        const givenName = attributes.given_name || "";
        const displayName = `${familyName} ${givenName}`.trim() || "名無しさん";
        setCurrentUserName(displayName);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchCurrentUser();

    // スレッド情報取得
    models.BoardThread.get({ id: threadId }).then(
      (result: { data: BoardThread | null }) => {
        if (result.data) {
          setThread(result.data);
        }
      }
    );

    // メッセージ購読（ソフト削除はリストに残し「削除されました」表示にする）
    const sub = models.BoardMessage.observeQuery({
      filter: { threadId: { eq: threadId } },
    }).subscribe({
      next: ({ items }: { items: BoardMessage[] }) => {
        const sorted = [...items].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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
        body: body.trim(),
        imagePaths: imagePaths.length > 0 ? imagePaths : null,
        author: currentUserName,
        authorId: currentUserId,
      });
      setBody("");
      resetImages();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      const message = e instanceof Error ? e.message : "投稿に失敗しました";
      setError(message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // 5ch 風: 自分または管理者のみ削除可、レス番号がズレないようソフト削除に統一
  const handleDelete = async (message: BoardMessage) => {
    if (!confirm("このメッセージを削除しますか？")) return;
    try {
      await models.BoardMessage.update({
        id: message.id,
        isHidden: true,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "削除に失敗しました";
      alert(message);
    }
  };

  const displayError = error || uploadError;

  return (
    <div
      className="mx-auto max-w-5xl"
      style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
    >
      {/* Back Button */}
      <div className="bg-[#EFEFEF] border-b border-gray-400 px-4 py-2">
        <Link
          href="/app/board"
          className="text-sm text-blue-700 hover:underline"
        >
          ← 掲示板一覧に戻る
        </Link>
      </div>

      {/* Thread Header */}
      {thread && (
        <div className="bg-[#EFEFEF] border-b border-gray-400 px-4 py-3">
          <div className="flex items-baseline gap-2">
            {thread.pinned && (
              <span className="text-xs text-red-600 font-bold">【固定】</span>
            )}
            <h1 className="text-xl font-bold text-gray-800">{thread.title}</h1>
          </div>
        </div>
      )}

      {/* Reply Form */}
      <div className="bg-[#EFEFEF] border-b border-gray-300 p-4">
        <div className="bg-white border border-gray-400 p-3">
          <div className="mb-2">
            <label className="text-sm font-semibold text-gray-700">
              返信する
            </label>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="本文"
            className="w-full border border-gray-400 px-3 py-2 text-sm focus:outline-none focus:border-gray-600 resize-none"
            rows={5}
          />

          {/* Image Upload */}
          <div className="mt-2">
            <label className="text-xs text-gray-600">
              画像アップロード（最大4枚）:
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading || imagePaths.length >= 4}
              className="mt-1 text-sm w-full"
            />
            {uploading && (
              <p className="mt-1 text-xs text-gray-600">アップロード中...</p>
            )}
          </div>

          {/* Image Preview */}
          {imagePaths.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {imagePaths.map((path, index) => (
                <div key={index} className="relative inline-block">
                  <div className="border border-gray-400 p-1 bg-gray-100">
                    <span className="text-xs text-gray-600">
                      {path.split("/").pop()?.substring(0, 20)}...
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={handlePost}
              disabled={!body.trim() || loading || uploading}
              className={`px-4 py-2 text-sm border border-gray-400 ${
                !body.trim() || loading || uploading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100 text-gray-700"
              }`}
            >
              {loading ? "投稿中..." : "書き込む"}
            </button>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mt-2 text-sm text-green-700 bg-green-50 border border-green-300 p-2">
              書き込みました
            </div>
          )}

          {displayError && (
            <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-300 p-2">
              {displayError}
            </div>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white">
        {messages.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            まだレスがありません
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageRow
              key={msg.id}
              message={msg}
              index={index + 1}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Message Row Component
function MessageRow({
  message,
  index,
  currentUserId,
  isAdmin,
  onDelete,
}: {
  message: BoardMessage;
  index: number;
  currentUserId: string;
  isAdmin: boolean;
  onDelete: (message: BoardMessage) => void;
}) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchImageUrls = async () => {
      if (
        message.imagePaths &&
        message.imagePaths.length > 0 &&
        message.authorId &&
        !message.isHidden
      ) {
        const urls = await Promise.all(
          message.imagePaths.map(async (path: string) => {
            try {
              const urlResult = await getUrl({
                path: `members/${message.authorId}/${path}`,
              });
              return urlResult.url.toString();
            } catch (err) {
              console.error("Error getting image URL:", err);
              return null;
            }
          })
        );
        setImageUrls(urls.filter((url): url is string => url !== null));
      }
    };

    fetchImageUrls();
  }, [message.imagePaths, message.authorId, message.isHidden]);

  // 5ch 風の ID は投稿者 ID の先頭 8 桁から導出（短すぎる createdAt 由来 ID で衝突するのを避ける）
  const displayId = (message.authorId || message.id).slice(0, 8).toUpperCase();
  const canDelete =
    !message.isHidden &&
    (isAdmin || (!!currentUserId && message.authorId === currentUserId));

  // ソフト削除されたレスはレス番号を保ったまま「削除されました」表示
  if (message.isHidden) {
    return (
      <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
        <div className="flex flex-wrap items-baseline gap-2 text-sm">
          <span className="font-mono text-gray-500">{index}</span>
          <span className="text-gray-500">:</span>
          <span className="italic text-gray-500">
            このメッセージは削除されました
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 px-4 py-3 hover:bg-gray-50">
      {/* Header */}
      <div className="flex flex-wrap items-baseline gap-2 text-sm mb-2">
        <span className="font-mono text-gray-700">{index}</span>
        <span className="text-gray-700">:</span>
        <span className="font-semibold text-green-700">
          {message.author || "名無しさん"}
        </span>
        <span className="text-gray-700">:</span>
        <span className="text-gray-600 text-xs">
          {formatDateTime(message.createdAt)}
        </span>
        <span className="text-gray-600 text-xs">ID:{displayId}</span>
        {canDelete && (
          <button
            onClick={() => onDelete(message)}
            className="ml-auto text-xs text-red-600 hover:underline"
          >
            [削除]
          </button>
        )}
      </div>

      {/* Content */}
      <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap pl-4">
        {message.body}
      </div>

      {/* Images */}
      {imageUrls.length > 0 && (
        <div className="mt-2 pl-4 flex flex-wrap gap-2">
          {imageUrls.map((url, idx) => (
            <div key={idx} className="border border-gray-400">
              <div className="relative w-32 h-32">
                <Image
                  src={url}
                  alt={`画像 ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
