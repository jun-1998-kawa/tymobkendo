"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import { motion, AnimatePresence } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";

const client = generateClient();
const models = client.models as any;

type Page = any;

export default function PagesManagementPage() {
  const [pagesList, setPagesList] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);

  useEffect(() => {
    const sub = models.Page.observeQuery({}).subscribe({
      next: ({ items }: any) => {
        const sorted = [...items].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPagesList(sorted);
        setLoading(false);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  const handleTogglePublic = async (page: Page) => {
    try {
      await models.Page.update({
        id: page.id,
        isPublic: !page.isPublic,
      });
    } catch (error) {
      console.error("Error toggling public status:", error);
      alert("公開状態の変更に失敗しました");
    }
  };

  const handleDelete = async (page: Page) => {
    if (!confirm(`「${page.title}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      await models.Page.delete({ id: page.id });
    } catch (error) {
      console.error("Error deleting page:", error);
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
              📄 ページ管理
            </h1>
            <p className="text-lg text-primary-600">
              サイトの動的ページを管理
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
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

      {/* Pages List */}
      <FadeIn delay={0.2}>
        <div className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-lg">
          {loading ? (
            <div className="p-12 text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
              <p className="text-lg text-primary-600">読み込み中...</p>
            </div>
          ) : pagesList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-6xl">📄</div>
              <p className="mb-2 text-lg font-medium text-primary-800">
                ページがありません
              </p>
              <p className="text-primary-600">
                「新規作成」ボタンから最初のページを作成しましょう
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-800">
                      タイトル / Slug
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
                  {pagesList.map((page) => (
                    <PageRow
                      key={page.id}
                      page={page}
                      onTogglePublic={() => handleTogglePublic(page)}
                      onEdit={() => setEditingPage(page)}
                      onDelete={() => handleDelete(page)}
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
        {(showCreateModal || editingPage) && (
          <PageModal
            page={editingPage}
            onClose={() => {
              setShowCreateModal(false);
              setEditingPage(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PageRow({ page, onTogglePublic, onEdit, onDelete }: any) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="transition-colors hover:bg-primary-50"
    >
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-primary-800">{page.title}</p>
          <p className="text-sm text-primary-500">/{page.slug}</p>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        {page.isPublic ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            <span className="h-2 w-2 rounded-full bg-green-600"></span>
            公開
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
            <span className="h-2 w-2 rounded-full bg-gray-600"></span>
            非公開
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-primary-600">
        {new Date(page.createdAt).toLocaleDateString("ja-JP", {
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
              page.isPublic
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            {page.isPublic ? "非公開" : "公開"}
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

function PageModal({ page, onClose }: { page: Page | null; onClose: () => void }) {
  const [slug, setSlug] = useState(page?.slug || "");
  const [title, setTitle] = useState(page?.title || "");
  const [bodyMd, setBodyMd] = useState(page?.bodyMd || "");
  const [sections, setSections] = useState<string[]>(page?.sections || []);
  const [sectionInput, setSectionInput] = useState("");
  const [imagePaths, setImagePaths] = useState<string[]>(page?.imagePaths || []);
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
        const fileName = `pages/${timestamp}-${file.name}`;

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

  const handleAddSection = () => {
    if (sectionInput.trim()) {
      setSections([...sections, sectionInput.trim()]);
      setSectionInput("");
    }
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (page) {
        // Update
        await models.Page.update({
          id: page.id,
          slug,
          title,
          bodyMd,
          sections: sections.length > 0 ? sections : null,
          imagePaths: imagePaths.length > 0 ? imagePaths : null,
        });
      } else {
        // Create
        await models.Page.create({
          slug,
          title,
          bodyMd,
          sections: sections.length > 0 ? sections : null,
          imagePaths: imagePaths.length > 0 ? imagePaths : null,
          isPublic: false,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving page:", error);
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
          {page ? "ページを編集" : "新規ページ作成"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              Slug（URLパス） <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-primary-600">/pages/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                required
                className="flex-1 rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                placeholder="about-us"
              />
            </div>
            <p className="mt-1 text-xs text-primary-500">半角英数字とハイフンのみ使用可能</p>
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
              className="w-full rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              placeholder="ページのタイトルを入力..."
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
              className="w-full resize-none rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 font-mono text-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              placeholder="ページの本文をMarkdown形式で入力..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              セクション（タグ）
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sectionInput}
                onChange={(e) => setSectionInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSection())}
                className="flex-1 rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-2 transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                placeholder="セクション名を入力してEnter"
              />
              <button
                type="button"
                onClick={handleAddSection}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
              >
                追加
              </button>
            </div>
            {sections.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sections.map((section, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800"
                  >
                    {section}
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(index)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              画像アップロード
            </label>
            <div className="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-6 transition-all hover:border-green-400 hover:bg-green-50">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="w-full cursor-pointer file:mr-4 file:rounded-lg file:border-0 file:bg-green-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition-all hover:file:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {uploading && (
                <p className="mt-2 text-sm text-green-600">
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
              className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "保存中..." : page ? "更新" : "作成"}
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
