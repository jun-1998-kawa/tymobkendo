"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";

const client = generateClient();
// TODO: After running `npx ampx sandbox`, replace `any` with proper types from Schema
const models = client.models as any;

type Tweet = any;

export default function TweetPage() {
  const [content, setContent] = useState("");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sub = models.Tweet.observeQuery({}).subscribe({
      next: ({ items }: any) => setTweets(items.filter((t: any) => !t.isHidden)),
    });
    return () => sub.unsubscribe();
  }, []);

  const max = 140;
  const disabled = content.length === 0 || content.length > max;

  const handlePost = async () => {
    if (disabled) return;

    setLoading(true);
    setError("");

    try {
      await models.Tweet.create({ content });
      setContent("");
    } catch (e: any) {
      setError(e.message || "投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return;

    try {
      await models.Tweet.delete({ id });
    } catch (e: any) {
      alert(e.message || "削除に失敗しました");
    }
  };

  return (
    <div style={{ maxWidth: "800px" }}>
      <h2>近況を投稿</h2>

      <div style={{ marginTop: "1rem" }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={max}
          placeholder="今何してる？"
          style={{
            width: "100%",
            minHeight: "100px",
            padding: "0.75rem",
            fontSize: "1rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            resize: "vertical"
          }}
        />

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "0.5rem"
        }}>
          <div style={{
            color: content.length > max ? "red" : "#666",
            fontSize: "0.9rem"
          }}>
            {content.length}/{max}
            {content.length > max && " (文字数オーバー)"}
          </div>

          <button
            disabled={disabled || loading}
            onClick={handlePost}
            style={{
              padding: "0.75rem 1.5rem",
              background: disabled || loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: disabled || loading ? "not-allowed" : "pointer",
              fontSize: "1rem"
            }}
          >
            {loading ? "投稿中..." : "投稿"}
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: "1rem",
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

      <h3 style={{ marginTop: "2rem" }}>最新の投稿</h3>
      <div style={{ marginTop: "1rem" }}>
        {tweets.length === 0 && (
          <p style={{ color: "#666" }}>まだ投稿がありません</p>
        )}

        {tweets.map((t) => (
          <div key={t.id} style={{
            padding: "1rem",
            marginBottom: "1rem",
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
                {t.author || "匿名"} · {new Date(t.createdAt).toLocaleString("ja-JP")}
              </small>
              <button
                onClick={() => handleDelete(t.id)}
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
            <p style={{ whiteSpace: "pre-wrap" }}>{t.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
