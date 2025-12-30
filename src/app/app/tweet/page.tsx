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

    // Tweetを購読
    const tweetSub = models.Tweet.observeQuery({}).subscribe({
      next: ({ items }: { items: Tweet[] }) => {
        const sorted = items
          .filter((t) => !t.isHidden)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        setTweets(sorted);
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
    // リプライがある場合は警告
    if ((tweet.replyCount ?? 0) > 0) {
      if (
        !confirm(
          `このツイートには${tweet.replyCount}件のリプライがあります。削除すると「このツイートは削除されました」と表示されます。削除しますか？`
        )
      ) {
        return;
      }
      // ソフト削除（isHidden = true）
      try {
        await models.Tweet.update({
          id: tweet.id,
          isHidden: true,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "削除に失敗しました";
        alert(message);
      }
    } else {
      // リプライがない場合は完全削除
      if (!confirm("この投稿を削除しますか？")) return;
      try {
        await models.Tweet.delete({ id: tweet.id });
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
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">ホーム</h1>
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
        <TweetList
          tweets={tweets}
          currentUserId={currentUserId}
          favorites={favorites}
          onDelete={handleDelete}
          onReply={handleReply}
        />
      </div>
    </div>
  );
}
