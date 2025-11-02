"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import Link from "next/link";

const client = generateClient();
// TODO: After running `npx ampx sandbox`, replace `any` with proper types from Schema
const models = client.models as any;

type BoardThread = any;

export default function BoardPage() {
  const [threads, setThreads] = useState<BoardThread[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sub = models.BoardThread.observeQuery({}).subscribe({
      next: ({ items }: any) => {
        // ピン留めを優先してソート
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

    try {
      await models.BoardThread.create({ title: title.trim() });
      setTitle("");
    } catch (e: any) {
      setError(e.message || "スレッド作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px" }}>
      <h2>掲示板</h2>

      <div style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        <h3>新規スレッド作成</h3>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="スレッドタイトル"
            style={{
              flex: 1,
              padding: "0.75rem",
              fontSize: "1rem",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}
          />
          <button
            onClick={handleCreate}
            disabled={!title.trim() || loading}
            style={{
              padding: "0.75rem 1.5rem",
              background: !title.trim() || loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: !title.trim() || loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "作成中..." : "作成"}
          </button>
        </div>
        {error && (
          <div style={{
            marginTop: "0.5rem",
            padding: "0.75rem",
            background: "#fee",
            border: "1px solid #fcc",
            borderRadius: "4px",
            color: "#c33"
          }}>
            {error}
          </div>
        )}
      </div>

      <h3>スレッド一覧</h3>
      <div style={{ marginTop: "1rem" }}>
        {threads.length === 0 && (
          <p style={{ color: "#666" }}>まだスレッドがありません</p>
        )}

        {threads.map((thread) => (
          <Link
            key={thread.id}
            href={`/app/board/${thread.id}`}
            style={{
              display: "block",
              padding: "1rem",
              marginBottom: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: thread.pinned ? "#fffbea" : "#fafafa",
              textDecoration: "none",
              color: "inherit",
              transition: "background 0.2s"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {thread.pinned && (
                  <span style={{
                    display: "inline-block",
                    marginRight: "0.5rem",
                    padding: "0.25rem 0.5rem",
                    background: "#ffc107",
                    color: "#000",
                    fontSize: "0.75rem",
                    borderRadius: "3px",
                    fontWeight: "bold"
                  }}>
                    📌 ピン留め
                  </span>
                )}
                <strong>{thread.title}</strong>
              </div>
              <small style={{ color: "#666" }}>
                {new Date(thread.createdAt).toLocaleDateString("ja-JP")}
              </small>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
