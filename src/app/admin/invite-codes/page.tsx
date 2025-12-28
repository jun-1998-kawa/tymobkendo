"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../../amplify/data/resource";

const client = generateClient<Schema>();

type InviteCode = Schema["InviteCode"]["type"];

export default function InviteCodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 招待コード一覧を取得
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const { data } = await client.models.InviteCode.list();
        setCodes(data);
      } catch (err) {
        console.error("Error fetching invite codes:", err);
        setError("招待コードの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchCodes();
  }, []);

  // 新しい招待コードを作成
  const handleCreate = async () => {
    if (!newCode.trim()) {
      setError("招待コードを入力してください");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const { data } = await client.models.InviteCode.create({
        code: newCode.trim(),
        description: newDescription.trim() || undefined,
        isActive: true,
      });

      if (data) {
        setCodes([...codes, data]);
        setNewCode("");
        setNewDescription("");
      }
    } catch (err) {
      console.error("Error creating invite code:", err);
      setError("招待コードの作成に失敗しました");
    } finally {
      setIsCreating(false);
    }
  };

  // 招待コードの有効/無効を切り替え
  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const { data } = await client.models.InviteCode.update({
        id,
        isActive: !currentStatus,
      });

      if (data) {
        setCodes(codes.map((c) => (c.id === id ? data : c)));
      }
    } catch (err) {
      console.error("Error toggling invite code:", err);
      setError("招待コードの更新に失敗しました");
    }
  };

  // 招待コードを削除
  const handleDelete = async (id: string) => {
    if (!confirm("この招待コードを削除しますか？")) return;

    try {
      await client.models.InviteCode.delete({ id });
      setCodes(codes.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error deleting invite code:", err);
      setError("招待コードの削除に失敗しました");
    }
  };

  // ランダムコードを生成
  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setNewCode(code);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="animate-pulse">
          <div className="mb-8 h-8 w-48 rounded bg-gray-200"></div>
          <div className="space-y-4">
            <div className="h-24 rounded bg-gray-200"></div>
            <div className="h-24 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">招待コード管理</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* 新規作成フォーム */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          新しい招待コードを作成
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              招待コード
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="例: KENDO2024"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={generateRandomCode}
                className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                自動生成
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              説明（任意）
            </label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="例: 2024年度OB会員用"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={isCreating || !newCode.trim()}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "作成中..." : "作成"}
          </button>
        </div>
      </div>

      {/* 招待コード一覧 */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <h2 className="border-b border-gray-200 px-6 py-4 text-lg font-semibold text-gray-900">
          招待コード一覧
        </h2>
        {codes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            招待コードがありません。新しいコードを作成してください。
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {codes.map((code) => (
              <li key={code.id} className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <code className="rounded bg-gray-100 px-3 py-1 text-lg font-mono font-bold text-gray-900">
                      {code.code}
                    </code>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        code.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {code.isActive ? "有効" : "無効"}
                    </span>
                  </div>
                  {code.description && (
                    <p className="mt-1 text-sm text-gray-500">{code.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    作成日: {new Date(code.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(code.id, code.isActive ?? true)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      code.isActive
                        ? "border border-orange-300 text-orange-600 hover:bg-orange-50"
                        : "border border-green-300 text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {code.isActive ? "無効化" : "有効化"}
                  </button>
                  <button
                    onClick={() => handleDelete(code.id)}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 使い方ガイド */}
      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-2 font-semibold text-blue-900">使い方</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• 招待コードを作成し、OB会員に共有してください</li>
          <li>• 新規登録時に招待コードの入力が必要になります</li>
          <li>• 不要になったコードは無効化または削除できます</li>
          <li>• 固定コード（例: KENDO2024）を長期間使用することも可能です</li>
        </ul>
      </div>
    </div>
  );
}
