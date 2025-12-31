"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { motion, AnimatePresence } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";

const client = generateClient();
const models = client.models as any;

type InviteCode = any;

export default function InviteCodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCode, setEditingCode] = useState<InviteCode | null>(null);

  useEffect(() => {
    const sub = models.InviteCode.observeQuery({}).subscribe({
      next: ({ items }: any) => {
        const sorted = [...items].sort((a, b) => {
          // 有効なコードを先に
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          // 作成日時で降順
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setCodes(sorted);
        setLoading(false);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  const handleToggleActive = async (code: InviteCode) => {
    try {
      await models.InviteCode.update({
        id: code.id,
        isActive: !code.isActive,
      });
    } catch (error) {
      console.error("Error toggling active status:", error);
      alert("状態の変更に失敗しました");
    }
  };

  const handleDelete = async (code: InviteCode) => {
    if (!confirm(`招待コード「${code.code}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      await models.InviteCode.delete({ id: code.id });
    } catch (error) {
      console.error("Error deleting invite code:", error);
      alert("削除に失敗しました");
    }
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除外
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
              招待コード管理
            </h1>
            <p className="text-lg text-gray-600">
              新規会員登録用の招待コードを発行・管理
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
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
            <span>新規発行</span>
          </button>
        </div>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-accent-600">
              {codes.filter((c) => c.isActive).length}
            </p>
            <p className="text-xs text-gray-500">有効なコード</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gold-600">
              {codes.reduce((sum, c) => sum + (c.usageCount || 0), 0)}
            </p>
            <p className="text-xs text-gray-500">総使用回数</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-500">
              {codes.filter((c) => !c.isActive).length}
            </p>
            <p className="text-xs text-gray-500">無効なコード</p>
          </div>
        </div>
      </FadeIn>

      {/* Codes List */}
      <FadeIn delay={0.2}>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          {loading ? (
            <div className="p-12 text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-accent-500 border-t-transparent"></div>
              <p className="text-lg text-gray-600">読み込み中...</p>
            </div>
          ) : codes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 flex justify-center">
                <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <p className="mb-2 text-lg font-medium text-gray-800">
                招待コードがありません
              </p>
              <p className="text-gray-600">
                「新規発行」ボタンから招待コードを作成しましょう
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                      コード
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">
                      ステータス
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">
                      使用回数
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                      有効期限
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                      メモ
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-800">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {codes.map((code) => (
                    <CodeRow
                      key={code.id}
                      code={code}
                      onToggleActive={() => handleToggleActive(code)}
                      onEdit={() => setEditingCode(code)}
                      onDelete={() => handleDelete(code)}
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
        {(showCreateModal || editingCode) && (
          <CodeModal
            code={editingCode}
            generateRandomCode={generateRandomCode}
            onClose={() => {
              setShowCreateModal(false);
              setEditingCode(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CodeRow({ code, onToggleActive, onEdit, onDelete }: any) {
  const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
  const isLimitReached = code.usageLimit && code.usageCount >= code.usageLimit;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="transition-colors hover:bg-gray-50"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <code className="rounded bg-gray-100 px-3 py-1 font-mono text-lg font-bold text-gray-800">
            {code.code}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(code.code);
              alert("コピーしました");
            }}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="コピー"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        {!code.isActive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            <span className="h-2 w-2 rounded-full bg-gray-400"></span>
            無効
          </span>
        ) : isExpired ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            期限切れ
          </span>
        ) : isLimitReached ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-600">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            上限到達
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            有効
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        <span className="font-medium text-gray-800">
          {code.usageCount || 0}
        </span>
        {code.usageLimit && (
          <span className="text-gray-500">/ {code.usageLimit}</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {code.expiresAt
          ? new Date(code.expiresAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "無期限"}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
        {code.note || "-"}
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <button
            onClick={onToggleActive}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              code.isActive
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            {code.isActive ? "無効化" : "有効化"}
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

function CodeModal({
  code,
  generateRandomCode,
  onClose,
}: {
  code: InviteCode | null;
  generateRandomCode: () => string;
  onClose: () => void;
}) {
  const [codeValue, setCodeValue] = useState(code?.code || generateRandomCode());
  const [usageLimit, setUsageLimit] = useState<string>(
    code?.usageLimit?.toString() || ""
  );
  const [expiresAt, setExpiresAt] = useState(
    code?.expiresAt ? code.expiresAt.split("T")[0] : ""
  );
  const [note, setNote] = useState(code?.note || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        code: codeValue.toUpperCase(),
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        note: note || null,
      };

      if (code) {
        await models.InviteCode.update({
          id: code.id,
          ...data,
        });
      } else {
        await models.InviteCode.create({
          ...data,
          isActive: true,
          usageCount: 0,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving invite code:", error);
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
        className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          {code ? "招待コードを編集" : "新規招待コード発行"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              招待コード <span className="text-red-600">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={codeValue}
                onChange={(e) => setCodeValue(e.target.value.toUpperCase())}
                required
                maxLength={20}
                className="flex-1 rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3 font-mono text-lg uppercase tracking-wider transition-all focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
                placeholder="KENDO2024"
              />
              {!code && (
                <button
                  type="button"
                  onClick={() => setCodeValue(generateRandomCode())}
                  className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-gray-600 transition-colors hover:bg-gray-50"
                  title="ランダム生成"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              使用回数上限（空欄で無制限）
            </label>
            <input
              type="number"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              min="1"
              className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3 transition-all focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
              placeholder="10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              有効期限（空欄で無期限）
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3 transition-all focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              メモ（管理用）
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3 transition-all focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-200"
              placeholder="○○さん用、2024年度新規会員向け など"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-3 font-semibold text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "保存中..." : code ? "更新" : "発行"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-800 transition-all hover:bg-gray-100"
            >
              キャンセル
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
