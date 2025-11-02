"use client";

export default function AppDashboard() {
  return (
    <div>
      <h1>会員ダッシュボード</h1>
      <p>ようこそ！会員専用エリアです。</p>
      <ul style={{ marginTop: "1rem" }}>
        <li>Tweet: 140文字で近況を投稿</li>
        <li>掲示板: スレッド形式の掲示板</li>
        <li>歴史: 高校剣道部の歴史（会員限定含む）</li>
      </ul>
    </div>
  );
}
