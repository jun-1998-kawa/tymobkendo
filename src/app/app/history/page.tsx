"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";

const client = generateClient();
// TODO: After running `npx ampx sandbox`, replace `any` with proper types from Schema
const models = client.models as any;

type HistoryEntry = any;

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = models.HistoryEntry.observeQuery({}).subscribe({
      next: ({ items }: any) => {
        const sorted = [...items].sort((a, b) => b.year - a.year);
        setEntries(sorted);
        setLoading(false);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  const publicEntries = entries.filter((e) => e.isPublic);
  const privateEntries = entries.filter((e) => !e.isPublic);

  return (
    <div style={{ maxWidth: "900px" }}>
      <h2>高校剣道部の歴史</h2>
      <p style={{ color: "#666", marginTop: "0.5rem" }}>
        OB会員限定の情報も含まれます
      </p>

      {loading && <p style={{ marginTop: "2rem" }}>読み込み中...</p>}

      {!loading && entries.length === 0 && (
        <p style={{ marginTop: "2rem", color: "#666" }}>
          まだ歴史エントリーがありません
        </p>
      )}

      {publicEntries.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ borderBottom: "2px solid #007bff", paddingBottom: "0.5rem" }}>
            公開情報
          </h3>
          {publicEntries.map((entry) => (
            <div key={entry.id} style={{
              marginTop: "1.5rem",
              padding: "1.5rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: "#fafafa"
            }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
                <h4 style={{ fontSize: "1.5rem", color: "#007bff" }}>
                  {entry.year}年
                </h4>
                <h5 style={{ fontSize: "1.2rem" }}>{entry.title}</h5>
              </div>
              <div style={{
                marginTop: "1rem",
                whiteSpace: "pre-wrap",
                lineHeight: "1.6"
              }}>
                {entry.bodyMd}
              </div>
            </div>
          ))}
        </div>
      )}

      {privateEntries.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <h3 style={{
            borderBottom: "2px solid #28a745",
            paddingBottom: "0.5rem",
            color: "#28a745"
          }}>
            会員限定情報
          </h3>
          {privateEntries.map((entry) => (
            <div key={entry.id} style={{
              marginTop: "1.5rem",
              padding: "1.5rem",
              border: "2px solid #28a745",
              borderRadius: "4px",
              background: "#f0fff4"
            }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
                <h4 style={{ fontSize: "1.5rem", color: "#28a745" }}>
                  {entry.year}年
                </h4>
                <h5 style={{ fontSize: "1.2rem" }}>{entry.title}</h5>
                <span style={{
                  padding: "0.25rem 0.5rem",
                  background: "#28a745",
                  color: "white",
                  fontSize: "0.75rem",
                  borderRadius: "3px"
                }}>
                  会員限定
                </span>
              </div>
              <div style={{
                marginTop: "1rem",
                whiteSpace: "pre-wrap",
                lineHeight: "1.6"
              }}>
                {entry.bodyMd}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
