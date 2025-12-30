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
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
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
