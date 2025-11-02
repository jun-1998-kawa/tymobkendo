"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import Link from "next/link";
import { useParams } from "next/navigation";

const client = generateClient();
// TODO: After running `npx ampx sandbox`, replace `any` with proper types from Schema
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

    try {
      await models.BoardMessage.create({
        threadId,
        body: body.trim()
      });
      setBody("");
    } catch (e: any) {
      setError(e.message || "投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return;

    try {
      await models.BoardMessage.delete({ id });
    } catch (e: any) {
      alert(e.message || "削除に失敗しました");
    }
  };

  return (
    <div style={{ maxWidth: "800px" }}>
      <Link href="/app/board" style={{ color: "#007bff", textDecoration: "none" }}>
        ← 掲示板一覧に戻る
      </Link>

      {thread && (
        <div style={{ marginTop: "1rem", marginBottom: "2rem" }}>
          <h2>{thread.title}</h2>
          <small style={{ color: "#666" }}>
            作成日: {new Date(thread.createdAt).toLocaleString("ja-JP")}
          </small>
        </div>
      )}

      <div style={{ marginBottom: "2rem" }}>
        <h3>返信する</h3>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="メッセージを入力"
          style={{
            width: "100%",
            minHeight: "100px",
            padding: "0.75rem",
            fontSize: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            resize: "vertical",
            marginTop: "0.5rem"
          }}
        />
        <div style={{ marginTop: "0.5rem" }}>
          <button
            onClick={handlePost}
            disabled={!body.trim() || loading}
            style={{
              padding: "0.75rem 1.5rem",
              background: !body.trim() || loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: !body.trim() || loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "投稿中..." : "投稿"}
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

      <h3>メッセージ ({messages.length})</h3>
      <div style={{ marginTop: "1rem" }}>
        {messages.length === 0 && (
          <p style={{ color: "#666" }}>まだメッセージがありません</p>
        )}

        {messages.map((msg, index) => (
          <div key={msg.id} style={{
            padding: "1rem",
            marginBottom: "0.75rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            background: "#fafafa"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem"
            }}>
              <small style={{ color: "#666" }}>
                #{index + 1} · {new Date(msg.createdAt).toLocaleString("ja-JP")}
              </small>
              <button
                onClick={() => handleDelete(msg.id)}
                style={{
                  padding: "0.25rem 0.5rem",
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "0.8rem"
                }}
              >
                削除
              </button>
            </div>
            <p style={{ whiteSpace: "pre-wrap" }}>{msg.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
