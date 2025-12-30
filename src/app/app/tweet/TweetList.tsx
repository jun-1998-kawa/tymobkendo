"use client";
import { TweetCard } from "./TweetCard";
import type { TweetListProps } from "./types";

/**
 * ツイート一覧コンポーネント
 */
export function TweetList({
  tweets,
  currentUserId,
  favorites,
  onDelete,
  onReply,
}: TweetListProps) {
  // メインのツイート（リプライを除く）
  const mainTweets = tweets.filter((t) => !t.replyToId);

  if (mainTweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-b border-gray-100">
        <div className="mb-4 text-5xl">🥋</div>
        <p className="text-gray-700 text-lg font-medium">まだ投稿がありません</p>
        <p className="text-gray-500 text-sm mt-2">最初の一歩を踏み出しましょう</p>
      </div>
    );
  }

  return (
    <>
      {mainTweets.map((tweet) => (
        <TweetCard
          key={tweet.id}
          tweet={tweet}
          allTweets={tweets}
          currentUserId={currentUserId}
          favorites={favorites}
          onDelete={onDelete}
          onReply={onReply}
        />
      ))}
    </>
  );
}
