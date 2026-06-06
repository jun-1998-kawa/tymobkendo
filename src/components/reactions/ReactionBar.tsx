"use client";
/**
 * ReactionBar — 任意のコンテンツに貼れる汎用リアクションUI。
 *
 * 対象を (targetType, targetId) で受け取るだけで、対象が何のモデルかは関知しない（直交）。
 * 状態・トグル処理は ReactionsProvider に委譲しているため、本コンポーネントは表示に専念する。
 *
 * 使い方:
 *   <ReactionBar targetType="HistoryEntry" targetId={entry.id} />
 */
import { useReactionStore } from "./ReactionsProvider";
import { summarizeReactions } from "@/lib/reactions";

interface ReactionBarProps {
  targetType: string;
  targetId: string;
  className?: string;
}

export default function ReactionBar({
  targetType,
  targetId,
  className,
}: ReactionBarProps) {
  const { reactions, currentUserId, toggle } = useReactionStore();

  // リアクションは会員機能。未ログイン（公開ページのゲスト等）には何も出さない。
  if (!currentUserId) return null;

  const summary = summarizeReactions(
    reactions,
    targetType,
    targetId,
    currentUserId
  );

  return (
    <div
      role="group"
      aria-label="リアクション"
      className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}
    >
      {summary.map(({ emoji, count, reactedByMe }) => (
        <button
          key={emoji}
          type="button"
          onClick={() => toggle(targetType, targetId, emoji)}
          aria-pressed={reactedByMe}
          aria-label={`${emoji} ${count}`}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-all duration-200 ${
            reactedByMe
              ? "border-accent-500 bg-accent-50 text-accent-700"
              : "border-gray-200 bg-white text-gray-600 hover:border-accent-300 hover:bg-accent-50"
          }`}
        >
          <span aria-hidden="true" className="text-base leading-none">
            {emoji}
          </span>
          {count > 0 && (
            <span className="font-medium tabular-nums">{count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
