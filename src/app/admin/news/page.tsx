"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import { motion, AnimatePresence } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";

const client = generateClient();
const models = client.models as any;

type News = any;

export default function NewsManagementPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);

  useEffect(() => {
    const sub = models.News.observeQuery({}).subscribe({
      next: ({ items }: any) => {
        const sorted = [...items].sort((a, b) => {
          // ピン留めを優先
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          // 次に公開日時で降順
          const dateA = new Date(a.publishedAt || a.createdAt).getTime();
          const dateB = new Date(b.publishedAt || b.createdAt).getTime();
          return dateB - dateA;
        });
        setNewsList(sorted);
        setLoading(false);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  const handleTogglePublish = async (news: News) => {
    try {
      await models.News.update({
        id: news.id,
        isPublished: !news.isPublished,
        publishedAt: !news.isPublished ? new Date().toISOString() : news.publishedAt,
      });
    } catch (error) {
      console.error("Error toggling publish status:", error);
      alert("公開状態の変更に失敗しました");
    }
  };

  const handleTogglePin = async (news: News) => {
    try {
      await models.News.update({
        id: news.id,
        isPinned: !news.isPinned,
      });
    } catch (error) {
      console.error("Error toggling pin status:", error);
      alert("ピン留め状態の変更に失敗しました");
    }
  };

  const handleDelete = async (news: News) => {
    if (!confirm(`「${news.title}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      await models.News.delete({ id: news.id });
    } catch (error) {
      console.error("Error deleting news:", error);
      alert("削除に失敗しました");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-serif text-3xl font-bold text-primary-800 md:text-4xl">
              📰 ニュース管理
            </h1>
            <p className="text-lg text-primary-600">
              お知らせ・イベント・活動報告を投稿・管理
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>新規作成</span>
          </button>
        </div>
      </FadeIn>

      {/* News List */}
      <FadeIn delay={0.2}>
        <div className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-lg">
          {loading ? (
            <div className="p-12 text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-lg text-primary-600">読み込み中...</p>
            </div>
          ) : newsList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-6xl">📰</div>
              <p className="mb-2 text-lg font-medium text-primary-800">
                ニュースがありません
              </p>
              <p className="text-primary-600">
                「新規作成」ボタンから最初のニュースを投稿しましょう
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-800">
                      タイトル
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-800">
                      カテゴリ
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary-800">
                      ステータス
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-800">
                      公開日時
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-primary-800">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {newsList.map((news) => (
                    <NewsRow
                      key={news.id}
                      news={news}
                      onTogglePublish={() => handleTogglePublish(news)}
                      onTogglePin={() => handleTogglePin(news)}
                      onEdit={() => setEditingNews(news)}
                      onDelete={() => handleDelete(news)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FadeIn>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingNews) && (
          <NewsModal
            news={editingNews}
            onClose={() => {
              setShowCreateModal(false);
              setEditingNews(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NewsRow({ news, onTogglePublish, onTogglePin, onEdit, onDelete }: any) {
  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      お知らせ: "bg-blue-100 text-blue-800",
      イベント: "bg-green-100 text-green-800",
      活動報告: "bg-amber-100 text-amber-800",
    };
    return styles[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="transition-colors hover:bg-primary-50"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {news.isPinned && (
            <span className="text-amber-500" title="ピン留め">
              📌
            </span>
          )}
          <div>
            <p className="font-medium text-primary-800">{news.title}</p>
            <p className="text-sm text-primary-500 line-clamp-1">{news.excerpt}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getCategoryBadge(
            news.category
          )}`}
        >
          {news.category}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        {news.isPublished ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            <span className="h-2 w-2 rounded-full bg-green-600"></span>
            公開中
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
            <span className="h-2 w-2 rounded-full bg-gray-600"></span>
            下書き
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-primary-600">
        {news.publishedAt
          ? new Date(news.publishedAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "-"}
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <button
            onClick={onTogglePin}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              news.isPinned
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title={news.isPinned ? "ピン留め解除" : "ピン留め"}
          >
            📌
          </button>
          <button
            onClick={onTogglePublish}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              news.isPublished
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            {news.isPublished ? "非公開" : "公開"}
          </button>
          <button
            onClick={onEdit}
            className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200"
          >
            編集
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
          >
            削除
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

function NewsModal({ news, onClose }: { news: News | null; onClose: () => void }) {
  const [title, setTitle] = useState(news?.title || "");
  const [excerpt, setExcerpt] = useState(news?.excerpt || "");
  const [content, setContent] = useState(news?.content || "");
  const [category, setCategory] = useState(news?.category || "お知らせ");
  const [imagePaths, setImagePaths] = useState<string[]>(news?.imagePaths || []);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedPaths: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const timestamp = Date.now();
        const fileName = `news/${timestamp}-${file.name}`;

        const result = await uploadData({
          path: `public/${fileName}`,
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
      alert("画像のアップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagePaths(imagePaths.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (news) {
        // Update
        await models.News.update({
          id: news.id,
          title,
          excerpt,
          content,
          category,
          imagePaths: imagePaths.length > 0 ? imagePaths : null,
        });
      } else {
        // Create
        await models.News.create({
          title,
          excerpt,
          content,
          category,
          imagePaths: imagePaths.length > 0 ? imagePaths : null,
          isPublished: false,
          isPinned: false,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving news:", error);
      alert("保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 font-serif text-2xl font-bold text-primary-800">
          {news ? "ニュースを編集" : "新規ニュース作成"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              タイトル <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="ニュースのタイトルを入力..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              カテゴリ <span className="text-red-600">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="お知らせ">お知らせ</option>
              <option value="イベント">イベント</option>
              <option value="活動報告">活動報告</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              要約（一覧表示用） <span className="text-red-600">*</span>
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              required
              rows={2}
              className="w-full resize-none rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="1〜2行の要約を入力..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              本文（Markdown対応） <span className="text-red-600">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={10}
              className="w-full resize-none rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 font-mono text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="ニュースの本文をMarkdown形式で入力...&#10;&#10;例:&#10;## 見出し&#10;本文のテキスト&#10;&#10;- リスト項目1&#10;- リスト項目2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              画像アップロード
            </label>
            <div className="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-6 transition-all hover:border-blue-400 hover:bg-blue-50">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="w-full cursor-pointer file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition-all hover:file:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {uploading && (
                <p className="mt-2 text-sm text-blue-600">
                  アップロード中...
                </p>
              )}
            </div>

            {imagePaths.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-primary-700">
                  アップロード済み画像:
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {imagePaths.map((path, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-primary-200 bg-white p-3"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-2xl">🖼️</span>
                        <span className="truncate text-sm text-primary-700">
                          {path.split("/").pop()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="ml-2 flex-shrink-0 rounded-lg bg-red-100 px-2 py-1 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "保存中..." : news ? "更新" : "作成"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-primary-300 bg-white px-6 py-3 font-semibold text-primary-800 transition-all hover:bg-primary-100"
            >
              キャンセル
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
