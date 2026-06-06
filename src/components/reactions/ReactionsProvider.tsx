"use client";
/**
 * ReactionsProvider — リアクションの状態・購読・トグルを一元管理する Context。
 *
 * - observeQuery の購読は「1回だけ」ここで行う（各 ReactionBar が個別購読しない）
 * - 現在ユーザー取得・create/delete のトグル実装もここに集約（DRY）
 * - <ReactionBar> はこの Context を読むだけで、対象モデルを一切知らない（直交）
 * - 1ユーザーにつき「1投稿1リアクション」（排他）。別の絵文字を選ぶと前のは外れる。
 *
 * 会員エリアのレイアウト（src/app/app/layout.tsx）でマウントする想定。
 */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { models } from "@/lib/amplifyClient";
import type { Reaction } from "@/lib/amplifyClient";
import { buildReactionId } from "@/lib/reactions";

interface ReactionStore {
  reactions: Reaction[];
  currentUserId: string | null;
  toggle: (
    targetType: string,
    targetId: string,
    emoji: string
  ) => Promise<void>;
}

const ReactionsContext = createContext<ReactionStore | null>(null);

export function useReactionStore(): ReactionStore {
  const ctx = useContext(ReactionsContext);
  if (!ctx) {
    throw new Error(
      "useReactionStore は <ReactionsProvider> の内側で使用してください"
    );
  }
  return ctx;
}

export function ReactionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // 連打・競合対策：処理中の対象（targetType#targetId）を保持し、
  // 1対象につき同時に1操作だけに直列化する（切替中の二重付与を防ぐ）。
  const pending = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    let sub: { unsubscribe: () => void } | undefined;

    getCurrentUser()
      .then((u) => {
        if (cancelled) return;
        setCurrentUserId(u.userId);
        // ログイン中のみ購読する。公開ページ（ゲスト＝identityPool）では
        // userPool 購読が失敗するため購読自体を行わない。
        sub = models.Reaction.observeQuery({}).subscribe({
          next: ({ items }: { items: Reaction[] }) => setReactions(items),
        });
      })
      .catch(() => {
        if (!cancelled) setCurrentUserId(null);
      });

    return () => {
      cancelled = true;
      sub?.unsubscribe();
    };
  }, []);

  const toggle = async (
    targetType: string,
    targetId: string,
    emoji: string
  ) => {
    if (!currentUserId) return;
    const targetKey = `${targetType}#${targetId}`;
    if (pending.current.has(targetKey)) return;
    pending.current.add(targetKey);

    // この対象に対する「自分の」既存リアクション（絵文字問わず）。
    // owner は AppSync が付与する Cognito sub で、currentUserId と一致する
    // 前提（既存 Favorite と同じ突合方式）。
    const mine = reactions.filter(
      (r) =>
        r.targetType === targetType &&
        r.targetId === targetId &&
        r.owner === currentUserId
    );
    const same = mine.find((r) => r.emoji === emoji);

    try {
      if (same) {
        // 同じ絵文字をもう一度 → 取り消し（トグルOFF）
        await models.Reaction.delete({ id: same.id });
      } else {
        // 1投稿1リアクション（排他）：自分の既存リアクションを外してから
        // 新しい絵文字を付ける。他人のリアクションには触れない。
        await Promise.all(
          mine.map((r) => models.Reaction.delete({ id: r.id }))
        );
        const id = buildReactionId(targetType, targetId, emoji, currentUserId);
        await models.Reaction.create({ id, targetType, targetId, emoji });
      }
    } catch (err) {
      console.error("Error toggling reaction:", err);
    } finally {
      pending.current.delete(targetKey);
    }
  };

  return (
    <ReactionsContext.Provider value={{ reactions, currentUserId, toggle }}>
      {children}
    </ReactionsContext.Provider>
  );
}
