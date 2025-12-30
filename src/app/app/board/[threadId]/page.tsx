"use client";
import { useEffect, useState } from "react";
import { uploadData, getUrl } from "aws-amplify/storage";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { models } from "@/lib/amplifyClient";
import { formatDateTime } from "@/utils/dateFormatter";
import type { BoardThread, BoardMessage } from "@/lib/amplifyClient";

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;

  const [thread, setThread] = useState<BoardThread | null>(null);
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    // 現在のユーザーIDを取得
    const fetchCurrentUserId = async () => {
      try {
        const { getCurrentUser } = await import("aws-amplify/auth");
        const user = await getCurrentUser();
        setCurrentUserId(user.userId);
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };

    fetchCurrentUserId();

    // スレッド情報取得
    models.BoardThread.get({ id: threadId }).then((result: { data: BoardThread | null }) => {
      if (result.data) {
        setThread(result.data);
      }
    });

    // メッセージ購読
    const sub = models.BoardMessage.observeQuery({
      filter: { threadId: { eq: threadId } }
    }).subscribe({
      next: ({ items }: { items: BoardMessage[] }) => {
        const visible = items.filter((m) => !m.isHidden);
        const sorted = [...visible].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sorted);
      },
    });

    return () => sub.unsubscribe();
  }, [threadId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imagePaths.length + files.length > 4) {
      setError("画像は最大4枚までアップロードできます");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setUploading(true);
    const uploadedPaths: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileName = `board-${timestamp}-${randomStr}-${file.name}`;

        // members/{entity_id}/ パスを使用（2階層まで）
        await uploadData({
          path: `members/${currentUserId}/${fileName}`,
          data: file,
          options: {
            contentType: file.type,
          },
        }).result;

        uploadedPaths.push(fileName);
      }

      setImagePaths([...imagePaths, ...uploadedPaths]);
    } catch (error) {
      console.error("Error uploading images:", error);
      setError("画像のアップロードに失敗しました");
      setTimeout(() => setError(""), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagePaths(imagePaths.filter((_, i) => i !== index));
  };

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
        authorId: currentUserId,
      });
      setBody("");
      setImagePaths([]);
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

  const handleDelete = async (id: string) => {
    if (!confirm("このメッセージを削除しますか？")) return;

    try {
      await models.BoardMessage.delete({ id });
    } catch (e) {
      const message = e instanceof Error ? e.message : "削除に失敗しました";
      alert(message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      {/* Back Button */}
      <div className="bg-[#EFEFEF] border-b border-gray-400 px-4 py-2">
        <Link href="/app/board" className="text-sm text-blue-700 hover:underline">
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

          {error && (
            <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-300 p-2">
              {error}
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
  onDelete,
}: {
  message: BoardMessage;
  index: number;
  onDelete: (id: string) => void;
}) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchImageUrls = async () => {
      if (message.imagePaths && message.imagePaths.length > 0 && message.authorId) {
        const urls = await Promise.all(
          message.imagePaths.map(async (path: string) => {
            try {
              // members/{authorId}/ パスから画像を取得
              const urlResult = await getUrl({ path: `members/${message.authorId}/${path}` });
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
  }, [message.imagePaths, message.authorId]);

  // 簡易ID生成（最後8文字）
  const generateId = (createdAt: string) => {
    return createdAt.slice(-8).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  };

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
        <span className="text-gray-600 text-xs">
          ID:{generateId(message.createdAt)}
        </span>
        <button
          onClick={() => onDelete(message.id)}
          className="ml-auto text-xs text-red-600 hover:underline"
        >
          [削除]
        </button>
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
