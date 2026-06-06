/**
 * Reaction（リアクション）共通ロジック
 *
 * 特定のモデルに依存しない汎用リアクション機構。対象は (targetType, targetId)
 * のペアで参照するため、HistoryEntry / Tweet / News / BoardMessage など
 * どのコンテンツにも同じ仕組みで「絵文字リアクション」を付けられる（直交）。
 *
 * ここは React / Amplify に依存しない純粋関数のみを置く（単体テスト容易・再利用可能）。
 */
import type { Reaction } from "@/lib/amplifyClient";

/**
 * 利用可能なリアクション絵文字（パレット）。
 * ここを編集すれば、リアクションを使う全箇所に一括反映される（DRY）。
 */
export const REACTION_EMOJIS = ["👍", "❤️", "🎉", "🙌", "🔥"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/**
 * リアクションの対象種別。対象モデル名と一致させる。
 * 新しいコンテンツにリアクションを広げる場合はここに追加する。
 */
export type ReactionTargetType =
  | "HistoryEntry"
  | "Tweet"
  | "News"
  | "BoardMessage"
  | "Page";

/**
 * 「1ユーザー × 1対象 × 1絵文字」で一意になる決定的な ID を生成する。
 * 同じ組み合わせは常に同じ ID になるため、
 * - 重複リアクションを構造的に防げる
 * - トグル時に既存レコードを検索せずに create / delete できる（冪等）
 */
export function buildReactionId(
  targetType: string,
  targetId: string,
  emoji: string,
  userId: string
): string {
  return `${targetType}#${targetId}#${emoji}#${userId}`;
}

export interface ReactionSummaryItem {
  emoji: ReactionEmoji;
  count: number;
  /** currentUserId が当該絵文字を付けているか */
  reactedByMe: boolean;
}

/**
 * 指定した対象に対するリアクション集計を、パレット定義順で返す。
 * - 他の対象 / 他の targetType のリアクションは無視する
 * - count は該当絵文字の総数
 * - reactedByMe は currentUserId が付けたものがあるか（owner で判定）
 */
export function summarizeReactions(
  reactions: Reaction[],
  targetType: string,
  targetId: string,
  currentUserId?: string | null
): ReactionSummaryItem[] {
  const forTarget = reactions.filter(
    (r) => r.targetType === targetType && r.targetId === targetId
  );
  return REACTION_EMOJIS.map((emoji) => {
    const matching = forTarget.filter((r) => r.emoji === emoji);
    return {
      emoji,
      count: matching.length,
      reactedByMe:
        !!currentUserId && matching.some((r) => r.owner === currentUserId),
    };
  });
}
