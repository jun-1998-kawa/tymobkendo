"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { uploadData, getUrl } from "aws-amplify/storage";
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const client = generateClient();
const models = client.models as any;

type Tweet = any;
type Favorite = any;

export default function TweetPage() {
  const [content, setContent] = useState("");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [favorites, setFavorites] = useState<Favorite[]>([]);
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
      next: ({ items }: any) => {
        const sorted = items
          .filter((t: any) => !t.isHidden)
          .sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        setTweets(sorted);
      },
    });

    // Favoriteを購読
    const favSub = models.Favorite.observeQuery({}).subscribe({
      next: ({ items }: any) => {
        setFavorites(items);
      },
    });

    return () => {
      tweetSub.unsubscribe();
      favSub.unsubscribe();
    };
  }, []);

  const max = 140;
  const disabled = content.length === 0 || content.length > max;
  const charPercentage = (content.length / max) * 100;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imagePaths.length + files.length > 4) {
      setError("画像は最大4枚までアップロードできます");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setUploading(true);
    const uploadedPaths: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileName = `tweets/${timestamp}-${randomStr}-${file.name}`;

        // members/{entity_id}/ パスを使用（自動的に現在のユーザーIDに解決される）
        await uploadData({
          path: `members/${currentUserId}/${fileName}`,
          data: file,
          options: {
            contentType: file.type,
          },
        }).result;

        uploadedPaths.push(fileName);
      }

      setImagePaths([...imagePaths, ...uploadedPaths]);
    } catch (error) {
      console.error("Error uploading images:", error);
      setError("画像のアップロードに失敗しました");
      setTimeout(() => setError(""), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagePaths(imagePaths.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (disabled) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const tweetData: any = {
        content,
        imagePaths: imagePaths.length > 0 ? imagePaths : null,
        author: currentUserName,
        authorId: currentUserId,
      };

      // リプライの場合
      if (replyTo) {
        tweetData.replyToId = replyTo.id;

        // 元投稿のreplyCountを増やす
        await models.Tweet.update({
          id: replyTo.id,
          replyCount: (replyTo.replyCount || 0) + 1,
        });
      }

      await models.Tweet.create(tweetData);

      setContent("");
      setImagePaths([]);
      setReplyTo(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || "投稿に失敗しました");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tweet: Tweet) => {
    // リプライがある場合は警告
    if (tweet.replyCount > 0) {
      if (!confirm(`このツイートには${tweet.replyCount}件のリプライがあります。削除すると「このツイートは削除されました」と表示されます。削除しますか？`)) {
        return;
      }
      // ソフト削除（isHidden = true）
      try {
        await models.Tweet.update({
          id: tweet.id,
          isHidden: true,
        });
      } catch (e: any) {
        alert(e.message || "削除に失敗しました");
      }
    } else {
      // リプライがない場合は完全削除
      if (!confirm("この投稿を削除しますか？")) return;
      try {
        await models.Tweet.delete({ id: tweet.id });
      } catch (e: any) {
        alert(e.message || "削除に失敗しました");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !disabled) {
      handlePost();
    }
  };

  const handleReply = (tweet: Tweet) => {
    setReplyTo(tweet);
    setContent(""); // リプライ時は内容をリセット
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  // メインのツイート（リプライを除く）
  const mainTweets = tweets.filter((t) => !t.replyToId);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">ホーム</h1>
      </div>

      {/* Post Form */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex gap-3 p-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-400 text-white font-semibold text-lg">
              {currentUserName[0]?.toUpperCase() || "自"}
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-1 min-w-0">
            {/* Reply To Indicator */}
            {replyTo && (
              <div className="mb-2 text-sm text-gray-500 bg-gray-50 p-2 rounded flex items-center justify-between">
                <span>
                  <span className="text-blue-600">@{replyTo.author}</span> へのリプライ
                </span>
                <button
                  onClick={cancelReply}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            )}

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={max + 10}
              placeholder={replyTo ? "返信をツイート" : "いまどうしてる？"}
              className="w-full resize-none border-0 text-xl placeholder-gray-500 focus:outline-none focus:ring-0 bg-transparent"
              rows={3}
            />

            {/* Image Preview Grid */}
            {imagePaths.length > 0 && (
              <div className={`mt-3 rounded-2xl overflow-hidden border border-gray-200 ${
                imagePaths.length === 1 ? 'grid-cols-1' :
                imagePaths.length === 2 ? 'grid grid-cols-2 gap-0.5' :
                imagePaths.length === 3 ? 'grid grid-cols-2 gap-0.5' :
                'grid grid-cols-2 gap-0.5'
              }`}>
                {imagePaths.map((path, index) => (
                  <div
                    key={index}
                    className={`relative bg-gray-100 ${
                      imagePaths.length === 1 ? 'aspect-video' :
                      imagePaths.length === 3 && index === 0 ? 'row-span-2 aspect-square' :
                      'aspect-square'
                    }`}
                  >
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-4xl">🖼️</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute right-2 top-2 rounded-full bg-gray-900/75 p-1.5 text-white hover:bg-gray-900"
                      title="削除"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
              <div className="flex items-center gap-1">
                {/* Image Upload Button */}
                <label className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-blue-50 transition ${
                  uploading || imagePaths.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading || imagePaths.length >= 4}
                    className="hidden"
                  />
                  <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </label>

                {uploading && (
                  <span className="text-sm text-gray-500">アップロード中...</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Character Counter Circle */}
                {content.length > 0 && (
                  <div className="relative">
                    <svg className="h-8 w-8 -rotate-90 transform">
                      <circle cx="16" cy="16" r="14" stroke="#E1E8ED" strokeWidth="3" fill="none" />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke={content.length > max ? "#f91880" : content.length > max * 0.9 ? "#ffad1f" : "#1DA1F2"}
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 14}`}
                        strokeDashoffset={`${2 * Math.PI * 14 * (1 - Math.min(charPercentage, 100) / 100)}`}
                        className="transition-all duration-300"
                      />
                    </svg>
                    {content.length > max * 0.9 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold" style={{ color: content.length > max ? "#f91880" : "#ffad1f" }}>
                          {max - content.length}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Post Button */}
                <button
                  disabled={disabled || loading || uploading}
                  onClick={handlePost}
                  className={`rounded-full px-5 py-2 font-bold text-sm transition ${
                    disabled || loading || uploading
                      ? "bg-blue-300 text-white cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {loading ? "投稿中..." : replyTo ? "返信" : "ポスト"}
                </button>
              </div>
            </div>

            {/* Success/Error Messages */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 rounded-lg bg-green-50 p-3 text-green-800 text-sm border border-green-200"
                >
                  投稿しました
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 rounded-lg bg-red-50 p-3 text-red-800 text-sm border border-red-200"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Tweet List */}
      <div className="bg-white">
        {mainTweets.length === 0 ? (
          <div className="p-12 text-center border-b border-gray-200">
            <p className="text-gray-500 text-lg">まだ投稿がありません</p>
            <p className="text-gray-400 text-sm mt-2">最初の投稿をしてみましょう</p>
          </div>
        ) : (
          mainTweets.map((tweet) => (
            <TweetCard
              key={tweet.id}
              tweet={tweet}
              allTweets={tweets}
              currentUserId={currentUserId}
              favorites={favorites}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Tweet Card Component
function TweetCard({
  tweet,
  allTweets,
  currentUserId,
  favorites,
  onDelete,
  onReply,
  isReply = false,
}: {
  tweet: any;
  allTweets: any[];
  currentUserId: string;
  favorites: any[];
  onDelete: (tweet: any) => void;
  onReply: (tweet: any) => void;
  isReply?: boolean;
}) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showReplies, setShowReplies] = useState(false);

  useEffect(() => {
    const fetchImageUrls = async () => {
      if (tweet.imagePaths && tweet.imagePaths.length > 0 && tweet.authorId) {
        const urls = await Promise.all(
          tweet.imagePaths.map(async (path: string) => {
            try {
              // members/{authorId}/ パスから画像を取得
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
  };

  const handleFavorite = async () => {
    const isFavorited = favorites.some(
      (f) => f.tweetId === tweet.id && f.owner === currentUserId
    );

    try {
      if (isFavorited) {
        // いいねを取り消す
        const fav = favorites.find(
          (f) => f.tweetId === tweet.id && f.owner === currentUserId
        );
        if (fav) {
          await models.Favorite.delete({ id: fav.id });
          await models.Tweet.update({
            id: tweet.id,
            favoriteCount: Math.max((tweet.favoriteCount || 0) - 1, 0),
          });
        }
      } else {
        // いいねする
        await models.Favorite.create({ tweetId: tweet.id });
        await models.Tweet.update({
          id: tweet.id,
          favoriteCount: (tweet.favoriteCount || 0) + 1,
        });
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const isFavorited = favorites.some(
    (f) => f.tweetId === tweet.id && f.owner === currentUserId
  );

  // このツイートへのリプライを取得
  const replies = allTweets.filter((t) => t.replyToId === tweet.id);

  // 削除されたツイートの場合
  if (tweet.isHidden) {
    return (
      <div className="flex gap-3 border-b border-gray-200 px-4 py-3 bg-gray-50">
        <div className="flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300">
            <span className="text-gray-500">−</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 italic mt-3">このツイートは削除されました</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-b border-gray-200 ${isReply ? 'bg-gray-50' : ''}`}>
      <div className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-400 text-white font-semibold">
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
              · {formatDate(tweet.createdAt)}
            </span>
          </div>

          {/* Tweet Text */}
          <p className="whitespace-pre-wrap text-gray-900 mt-1 leading-normal">
            {tweet.content}
          </p>

          {/* Images Grid */}
          {imageUrls.length > 0 && (
            <div className={`mt-3 rounded-2xl overflow-hidden border border-gray-200 ${
              imageUrls.length === 1 ? 'grid-cols-1' :
              imageUrls.length === 2 ? 'grid grid-cols-2 gap-0.5' :
              imageUrls.length === 3 ? 'grid grid-cols-2 gap-0.5' :
              'grid grid-cols-2 gap-0.5'
            }`}>
              {imageUrls.map((url, index) => (
                <div
                  key={index}
                  className={`relative bg-gray-100 ${
                    imageUrls.length === 1 ? 'aspect-video' :
                    imageUrls.length === 3 && index === 0 ? 'row-span-2 aspect-square' :
                    'aspect-square'
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
          <div className="flex items-center gap-12 mt-3 text-gray-500">
            {/* Reply Icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReply(tweet);
              }}
              className="flex items-center gap-2 group"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full group-hover:bg-blue-50 transition">
                <svg className="h-5 w-5 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              {tweet.replyCount > 0 && (
                <span className="text-sm group-hover:text-blue-500">
                  {tweet.replyCount}
                </span>
              )}
            </button>

            {/* Retweet Icon (placeholder) */}
            <button className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-9 h-9 rounded-full group-hover:bg-green-50 transition">
                <svg className="h-5 w-5 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </button>

            {/* Favorite Icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFavorite();
              }}
              className="flex items-center gap-2 group"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full group-hover:bg-pink-50 transition">
                <svg
                  className={`h-5 w-5 ${
                    isFavorited ? "text-pink-500 fill-pink-500" : "group-hover:text-pink-500"
                  }`}
                  fill={isFavorited ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              {tweet.favoriteCount > 0 && (
                <span className={`text-sm ${isFavorited ? "text-pink-500" : "group-hover:text-pink-500"}`}>
                  {tweet.favoriteCount}
                </span>
              )}
            </button>

            {/* Delete Icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(tweet);
              }}
              className="flex items-center gap-2 group ml-auto"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full group-hover:bg-red-50 transition">
                <svg className="h-5 w-5 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Show Replies Toggle */}
      {replies.length > 0 && !isReply && (
        <div className="px-4 py-2 border-t border-gray-200">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showReplies ? "リプライを非表示" : `リプライを表示 (${replies.length}件)`}
          </button>
        </div>
      )}

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="border-t border-gray-200">
          {replies.map((reply) => (
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
    </div>
  );
}
