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
      <div className="p-12 text-center border-b border-gray-200">
        <p className="text-gray-500 text-lg">まだ投稿がありません</p>
        <p className="text-gray-400 text-sm mt-2">最初の投稿をしてみましょう</p>
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
