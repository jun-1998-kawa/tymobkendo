"use client";
import { useEffect, useState } from "react";
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { models } from "@/lib/amplifyClient";
import { TweetForm } from "./TweetForm";
import { TweetList } from "./TweetList";
import type { Tweet, Favorite } from "./types";

/**
 * ツイートページ
 * データの取得・購読とコンポーネントのオーケストレーションを担当
 */
export default function TweetPage() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [replyTo, setReplyTo] = useState<Tweet | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // 現在のユーザー情報を取得
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        setCurrentUserId(user.userId);

        // 姓名を結合して表示名にする
        const familyName = attributes.family_name || "";
        const givenName = attributes.given_name || "";
        const displayName = `${familyName} ${givenName}`.trim() || "匿名";
        setCurrentUserName(displayName);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchCurrentUser();

    // Tweetを購読（isHidden もそのまま残す。TweetCard 側で「削除されました」プレースホルダを描画するため）
    const tweetSub = models.Tweet.observeQuery({}).subscribe({
      next: ({ items }: { items: Tweet[] }) => {
        const sorted = [...items].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTweets(sorted);
        setInitialLoading(false);
      },
    });

    // Favoriteを購読
    const favSub = models.Favorite.observeQuery({}).subscribe({
      next: ({ items }: { items: Favorite[] }) => {
        setFavorites(items);
      },
    });

    return () => {
      tweetSub.unsubscribe();
      favSub.unsubscribe();
    };
  }, []);

  const handleDelete = async (tweet: Tweet) => {
    // リプライ数はクライアントの購読データから派生計算する。
    // （Tweet.replyCount フィールドは認可上 owner しか更新できず信頼できないため）
    const replyCount = tweets.filter(
      (t) => t.replyToId === tweet.id && !t.isHidden
    ).length;

    if (replyCount > 0) {
      if (
        !confirm(
          `このツイートには${replyCount}件のリプライがあります。削除すると「このツイートは削除されました」と表示されます。削除しますか？`
        )
      ) {
        return;
      }
      // ソフト削除（isHidden = true）。リプライ文脈を保つ。
      try {
        await models.Tweet.update({ id: tweet.id, isHidden: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : "削除に失敗しました";
        alert(message);
      }
    } else {
      // リプライが無ければ完全削除
      if (!confirm("この投稿を削除しますか？")) return;
      try {
        await models.Tweet.delete({ id: tweet.id });
        // 自分が押した Favorite だけは削除を試みる（他人の Favorite は authz で消せないので
        // DB 上に残るが、お気に入りページは tweet.find が null になるため UI からは消える）
        const ownFavoritesOnThisTweet = favorites.filter(
          (f) => f.tweetId === tweet.id && f.owner === currentUserId
        );
        await Promise.allSettled(
          ownFavoritesOnThisTweet.map((f) =>
            models.Favorite.delete({ id: f.id })
          )
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : "削除に失敗しました";
        alert(message);
      }
    }
  };

  const handleReply = (tweet: Tweet) => {
    setReplyTo(tweet);
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const handlePostSuccess = () => {
    // 投稿成功時の処理（必要に応じて追加）
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="sticky top-14 z-10 border-b border-gray-100 bg-white/90 backdrop-blur-lg px-4 py-3 md:top-0">
        <h1 className="text-xl font-bold text-gray-900">
          <span className="underline-gold">近況投稿</span>
        </h1>
      </div>

      {/* Post Form */}
      <TweetForm
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        replyTo={replyTo}
        onCancelReply={cancelReply}
        onPostSuccess={handlePostSuccess}
      />

      {/* Tweet List */}
      <div className="bg-white">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
            <p className="text-sm text-gray-500">読み込み中...</p>
          </div>
        ) : (
          <TweetList
            tweets={tweets}
            currentUserId={currentUserId}
            favorites={favorites}
            onDelete={handleDelete}
            onReply={handleReply}
          />
        )}
      </div>
    </div>
  );
}
