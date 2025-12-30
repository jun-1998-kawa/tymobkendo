"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import { motion, AnimatePresence } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";

const client = generateClient();
const models = client.models as any;

type HistoryEntry = any;

export default function HistoryManagementPage() {
  const [entriesList, setEntriesList] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    const sub = models.HistoryEntry.observeQuery({}).subscribe({
      next: ({ items }: any) => {
        const sorted = [...items].sort((a, b) => b.year - a.year);
        setEntriesList(sorted);
        setLoading(false);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  const handleTogglePublic = async (entry: HistoryEntry) => {
    try {
      await models.HistoryEntry.update({
        id: entry.id,
        isPublic: !entry.isPublic,
      });
    } catch (error) {
      console.error("Error toggling public status:", error);
      alert("公開状態の変更に失敗しました");
    }
  };

  const handleDelete = async (entry: HistoryEntry) => {
    if (!confirm(`「${entry.year}年 - ${entry.title}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      await models.HistoryEntry.delete({ id: entry.id });
    } catch (error) {
      console.error("Error deleting entry:", error);
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
              📜 歴史管理
            </h1>
            <p className="text-lg text-primary-600">
              剣道部の歴史アーカイブを管理
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
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

      {/* History Entries List */}
      <FadeIn delay={0.2}>
        <div className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-lg">
          {loading ? (
            <div className="p-12 text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
              <p className="text-lg text-primary-600">読み込み中...</p>
            </div>
          ) : entriesList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-6xl">📜</div>
              <p className="mb-2 text-lg font-medium text-primary-800">
                歴史エントリーがありません
              </p>
              <p className="text-primary-600">
                「新規作成」ボタンから最初のエントリーを作成しましょう
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-amber-50 to-yellow-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-800">
                      年度 / タイトル
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-primary-800">
                      ステータス
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-800">
                      作成日時
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-primary-800">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {entriesList.map((entry) => (
                    <HistoryRow
                      key={entry.id}
                      entry={entry}
                      onTogglePublic={() => handleTogglePublic(entry)}
                      onEdit={() => setEditingEntry(entry)}
                      onDelete={() => handleDelete(entry)}
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
        {(showCreateModal || editingEntry) && (
          <HistoryModal
            entry={editingEntry}
            onClose={() => {
              setShowCreateModal(false);
              setEditingEntry(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function HistoryRow({ entry, onTogglePublic, onEdit, onDelete }: any) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="transition-colors hover:bg-primary-50"
    >
      <td className="px-6 py-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-amber-700">{entry.year}年</span>
            <span className="text-primary-800">•</span>
            <span className="font-medium text-primary-800">{entry.title}</span>
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-primary-500">{entry.bodyMd}</p>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        {entry.isPublic ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            公開
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            <span className="h-2 w-2 rounded-full bg-green-600"></span>
            会員限定
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-primary-600">
        {new Date(entry.createdAt).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <button
            onClick={onTogglePublic}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              entry.isPublic
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
          >
            {entry.isPublic ? "会員限定に" : "公開に"}
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

function HistoryModal({ entry, onClose }: { entry: HistoryEntry | null; onClose: () => void }) {
  const [year, setYear] = useState(entry?.year || new Date().getFullYear());
  const [title, setTitle] = useState(entry?.title || "");
  const [bodyMd, setBodyMd] = useState(entry?.bodyMd || "");
  const [imagePaths, setImagePaths] = useState<string[]>(entry?.imagePaths || []);
  const [videoPaths, setVideoPaths] = useState<string[]>(entry?.videoPaths || []);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedPaths: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const timestamp = Date.now();
        const fileName = `history/${timestamp}-${file.name}`;

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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingVideo(true);
    const uploadedPaths: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // 動画ファイルサイズチェック（100MB制限）
        if (file.size > 100 * 1024 * 1024) {
          alert(`ファイル「${file.name}」は100MBを超えています。100MB以下のファイルを選択してください。`);
          continue;
        }

        const timestamp = Date.now();
        const fileName = `history/videos/${timestamp}-${file.name}`;

        await uploadData({
          path: `public/${fileName}`,
          data: file,
          options: {
            contentType: file.type,
          },
        }).result;

        uploadedPaths.push(fileName);
      }

      setVideoPaths([...videoPaths, ...uploadedPaths]);
    } catch (error) {
      console.error("Error uploading videos:", error);
      alert("動画のアップロードに失敗しました");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleRemoveVideo = (index: number) => {
    setVideoPaths(videoPaths.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (entry) {
        // Update
        await models.HistoryEntry.update({
          id: entry.id,
          year,
          title,
          bodyMd,
          imagePaths: imagePaths.length > 0 ? imagePaths : null,
          videoPaths: videoPaths.length > 0 ? videoPaths : null,
        });
      } else {
        // Create
        await models.HistoryEntry.create({
          year,
          title,
          bodyMd,
          imagePaths: imagePaths.length > 0 ? imagePaths : null,
          videoPaths: videoPaths.length > 0 ? videoPaths : null,
          isPublic: true,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving entry:", error);
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
          {entry ? "歴史エントリーを編集" : "新規歴史エントリー作成"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              年度 <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              required
              min={1900}
              max={2100}
              className="w-full rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="2023"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              タイトル <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="例：全国大会出場"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              本文（Markdown対応） <span className="text-red-600">*</span>
            </label>
            <textarea
              value={bodyMd}
              onChange={(e) => setBodyMd(e.target.value)}
              required
              rows={10}
              className="w-full resize-none rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 font-mono text-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="歴史エントリーの内容をMarkdown形式で入力..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              画像アップロード
            </label>
            <div className="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-6 transition-all hover:border-amber-400 hover:bg-amber-50">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="w-full cursor-pointer file:mr-4 file:rounded-lg file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition-all hover:file:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {uploading && (
                <p className="mt-2 text-sm text-amber-600">
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

          {/* Video Upload Section */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              動画アップロード
            </label>
            <div className="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-6 transition-all hover:border-blue-400 hover:bg-blue-50">
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoUpload}
                disabled={uploadingVideo}
                className="w-full cursor-pointer file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition-all hover:file:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-primary-500">
                対応形式: MP4, WebM, MOV など（最大100MB/ファイル）
              </p>
              {uploadingVideo && (
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  アップロード中...
                </div>
              )}
            </div>

            {videoPaths.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-primary-700">
                  アップロード済み動画:
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {videoPaths.map((path, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-primary-200 bg-white p-3"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-2xl">🎬</span>
                        <span className="truncate text-sm text-primary-700">
                          {path.split("/").pop()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(index)}
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
              className="flex-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-3 font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "保存中..." : entry ? "更新" : "作成"}
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
