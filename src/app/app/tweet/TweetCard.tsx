"use client";
import { useEffect, useState } from "react";
import { getUrl } from "aws-amplify/storage";
import Image from "next/image";
import { models } from "@/lib/amplifyClient";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { formatRelativeTime } from "@/utils/dateFormatter";
import type { TweetCardProps } from "./types";

/**
 * 個別ツイート表示コンポーネント
 */
export function TweetCard({
  tweet,
  allTweets,
  currentUserId,
  favorites,
  onDelete,
  onReply,
  isReply = false,
}: TweetCardProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    const fetchImageUrls = async () => {
      if (tweet.imagePaths && tweet.imagePaths.length > 0 && tweet.authorId) {
        const urls = await Promise.all(
          tweet.imagePaths.map(async (path: string) => {
            try {
              const urlResult = await getUrl({ path: `members/${tweet.authorId}/${path}` });
              return urlResult.url.toString();
            } catch (err) {
              console.error("Error getting image URL:", err);
              return null;
            }
          })
        );
        setImageUrls(urls.filter((url): url is string => url !== null));
      }
    };

    fetchImageUrls();
  }, [tweet.imagePaths, tweet.authorId]);

  // 自分のいいね判定は owner（Cognito sub）で一本化。
  // favoriteCount / replyCount は AppSync の認可で非 owner からは update できないため、
  // クライアント側で派生計算したものを表示する。
  const tweetFavorites = favorites.filter((f) => f.tweetId === tweet.id);
  const myFavorite = tweetFavorites.find((f) => f.owner === currentUserId);
  const isFavorited = !!myFavorite;

  const replies = allTweets.filter((t) => t.replyToId === tweet.id);
  const visibleReplies = replies.filter((t) => !t.isHidden);
  const favoriteCount = tweetFavorites.length;
  const replyCount = visibleReplies.length;

  const canDelete = isAdmin || (!!currentUserId && tweet.authorId === currentUserId);

  // リプライ単独表示時、親が削除済みなら表示は親側のソフト削除欄に任せる。
  // 親自体が allTweets に存在しないパターンは「ParentMissingNotice」で示す。
  const parentMissing =
    !!tweet.replyToId && !allTweets.some((t) => t.id === tweet.replyToId);

  const handleFavorite = async () => {
    if (favoriteLoading || !currentUserId) return;

    setFavoriteLoading(true);
    try {
      if (myFavorite) {
        await models.Favorite.delete({ id: myFavorite.id });
      } else {
        const compositeId = `${tweet.id}#${currentUserId}`;
        await models.Favorite.create({ id: compositeId, tweetId: tweet.id });
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setTimeout(() => setFavoriteLoading(false), 300);
    }
  };

  // 共通: リプライ展開セクション（プレースホルダ側でも再利用するため変数化）
  const repliesSection =
    visibleReplies.length > 0 && !isReply ? (
      <>
        <div className="px-4 py-2 border-t border-gray-100">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors"
          >
            {showReplies
              ? "リプライを非表示"
              : `リプライを表示 (${visibleReplies.length}件)`}
          </button>
        </div>
        {showReplies && (
          <div className="border-t border-gray-200">
            {visibleReplies.map((reply) => (
              <div key={reply.id} className="pl-12">
                <TweetCard
                  tweet={reply}
                  allTweets={allTweets}
                  currentUserId={currentUserId}
                  favorites={favorites}
                  onDelete={onDelete}
                  onReply={onReply}
                  isReply={true}
                />
              </div>
            ))}
          </div>
        )}
      </>
    ) : null;

  // 削除されたツイート: プレースホルダ + リプライ展開のみを表示する
  if (tweet.isHidden) {
    return (
      <div className="border-b border-gray-200">
        <div className="flex gap-3 px-4 py-3 bg-gray-50">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300">
              <span className="text-gray-500">−</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 italic mt-3">
              このツイートは削除されました
            </p>
          </div>
        </div>
        {repliesSection}
      </div>
    );
  }

  return (
    <div className={`border-b border-gray-200 ${isReply ? "bg-gray-50" : ""}`}>
      {parentMissing && !isReply && (
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs italic text-gray-500">
          返信先のツイートは削除されました
        </div>
      )}
      <div className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-primary-900 text-gold-400 font-bold shadow-sm">
            {(tweet.author || "匿名")[0].toUpperCase()}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="font-bold text-gray-900 hover:underline">
              {tweet.author || "匿名"}
            </span>
            <span className="text-gray-500 text-sm">
              · {formatRelativeTime(tweet.createdAt)}
            </span>
          </div>

          {/* Tweet Text */}
          <p className="whitespace-pre-wrap text-gray-900 mt-1 leading-normal">
            {tweet.content}
          </p>

          {/* Images Grid */}
          {imageUrls.length > 0 && (
            <div
              className={`mt-3 overflow-hidden border border-gray-200 ${
                imageUrls.length === 1
                  ? "grid-cols-1"
                  : imageUrls.length === 2
                  ? "grid grid-cols-2 gap-0.5"
                  : imageUrls.length === 3
                  ? "grid grid-cols-2 gap-0.5"
                  : "grid grid-cols-2 gap-0.5"
              }`}
            >
              {imageUrls.map((url, index) => (
                <div
                  key={index}
                  className={`relative bg-gray-100 ${
                    imageUrls.length === 1
                      ? "aspect-video"
                      : imageUrls.length === 3 && index === 0
                      ? "row-span-2 aspect-square"
                      : "aspect-square"
                  }`}
                >
                  <Image
                    src={url}
                    alt={`投稿画像 ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-8 mt-3 text-gray-500">
            {/* Reply Icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReply(tweet);
              }}
              className="flex items-center gap-2 group"
            >
              <div className="flex items-center justify-center p-2 rounded-full group-hover:bg-gold-50 transition-colors">
                <svg
                  className="h-5 w-5 group-hover:text-gold-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              {replyCount > 0 && (
                <span className="text-sm group-hover:text-gold-600">
                  {replyCount}
                </span>
              )}
            </button>

            {/* Favorite Icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFavorite();
              }}
              disabled={favoriteLoading}
              className={`flex items-center gap-2 group ${
                favoriteLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="flex items-center justify-center p-2 rounded-full group-hover:bg-accent-50 transition-colors">
                <svg
                  className={`h-5 w-5 transition-colors ${
                    isFavorited
                      ? "text-accent-500 fill-accent-500"
                      : "group-hover:text-accent-500"
                  }`}
                  fill={isFavorited ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              {favoriteCount > 0 && (
                <span
                  className={`text-sm ${
                    isFavorited ? "text-accent-500" : "group-hover:text-accent-500"
                  }`}
                >
                  {favoriteCount}
                </span>
              )}
            </button>

            {/* Delete Icon: own post or admin only */}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(tweet);
                }}
                className="flex items-center gap-2 group ml-auto"
                aria-label="削除"
              >
                <div className="flex items-center justify-center p-2 group-hover:bg-red-50 transition">
                  <svg
                    className="h-5 w-5 group-hover:text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {repliesSection}
    </div>
  );
}
