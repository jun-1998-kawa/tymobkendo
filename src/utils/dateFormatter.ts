/**
 * 日付フォーマットユーティリティ
 */

/**
 * 相対時間を返す（Twitter風）
 * 例: "今", "5分", "3時間", "2日", "12月30日"
 */
export function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "今";
  if (diffMins < 60) return `${diffMins}分`;
  if (diffHours < 24) return `${diffHours}時間`;
  if (diffDays < 7) return `${diffDays}日`;

  return date.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

/**
 * ローカル日付を返す
 * 例: "2024/12/30"
 */
export function formatLocalDate(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return date
    .toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "/");
}

/**
 * 日時をフルフォーマットで返す
 * 例: "2024/12/30(月) 15:30:45"
 */
export function formatDateTime(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}/${month}/${day}(${weekday}) ${hours}:${minutes}:${seconds}`;
}

/**
 * 短い日付フォーマット
 * 例: "12月 30日"
 */
export function formatShortDate(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
  });
}
