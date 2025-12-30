"use client";
import { useEffect, useState } from "react";
import { getUrl } from "aws-amplify/storage";
import { getCurrentUser } from "aws-amplify/auth";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { models } from "@/lib/amplifyClient";
import { formatRelativeTime } from "@/utils/dateFormatter";
import type { Tweet, Favorite } from "@/lib/amplifyClient";

/** お気に入り付きツイート */
type FavoritedTweet = Tweet & { favoriteId: string };

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUserId(user.userId);

        // 自分のお気に入りを取得
        // owner フィルターが機能しない場合に備えて、全て取得してからフィルター
        const favSub = models.Favorite.observeQuery({}).subscribe({
          next: ({ items }: { items: Favorite[] }) => {
            // 複合ID（{tweetId}#{userId}）を使用している場合は、IDから判定
            const myFavorites = items.filter((fav) => {
              // owner フィールドがある場合はそれで判定
              if (fav.owner) {
                return fav.owner === user.userId;
              }
              // カスタムIDを使用している場合は、ID末尾がuserIdと一致するか確認
              if (fav.id && fav.id.includes('#')) {
                const userId = fav.id.split('#')[1];
                return userId === user.userId;
              }
              return false;
            });
            setFavorites(myFavorites);
          },
        });

        // 全てのTweetを取得
        const tweetSub = models.Tweet.observeQuery({}).subscribe({
          next: ({ items }: { items: Tweet[] }) => {
            setTweets(items);
            setLoading(false);
          },
        });

        return () => {
          favSub.unsubscribe();
          tweetSub.unsubscribe();
        };
      } catch (err) {
        console.error("Error loading favorites:", err);
        setLoading(false);
      }
    };

    init();
  }, []);

  // お気に入りに対応するTweetを取得
  const favoritedTweets = favorites
    .map((fav) => {
      const tweet = tweets.find((t) => t.id === fav.tweetId);
      return tweet ? { ...tweet, favoriteId: fav.id } : null;
    })
    .filter((t): t is FavoritedTweet => t !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/app/tweet"
            className="flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 transition"
          >
            <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">お気に入り</h1>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white">
        {loading ? (
          <div className="p-12 text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : favoritedTweets.length === 0 ? (
          <div className="p-12 text-center border-b border-gray-200">
            <div className="mb-4 text-6xl">💗</div>
            <p className="text-gray-500 text-lg font-medium">お気に入りがありません</p>
            <p className="text-gray-400 text-sm mt-2">ツイートをお気に入りすると、ここに表示されます</p>
            <Link
              href="/app/tweet"
              className="mt-6 inline-block rounded-full bg-pink-500 px-6 py-2 font-semibold text-white hover:bg-pink-600 transition"
            >
              ツイートを見る
            </Link>
          </div>
        ) : (
          favoritedTweets.map((tweet) => (
            <FavoriteTweetCard
              key={tweet.id}
              tweet={tweet}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FavoriteTweetCard({
  tweet,
}: {
  tweet: FavoritedTweet;
  currentUserId: string;
}) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [removing, setRemoving] = useState(false);

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


  const handleRemoveFavorite = async () => {
    if (removing) return;

    setRemoving(true);
    try {
      await models.Favorite.delete({ id: tweet.favoriteId });
      await models.Tweet.update({
        id: tweet.id,
        favoriteCount: Math.max((tweet.favoriteCount || 0) - 1, 0),
      });
    } catch (err) {
      console.error("Error removing favorite:", err);
      alert("お気に入り解除に失敗しました");
    } finally {
      setRemoving(false);
    }
  };

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="border-b border-gray-200"
    >
      <div className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition">
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
              · {formatRelativeTime(tweet.createdAt)}
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
          <div className="flex items-center gap-4 mt-3">
            {/* Remove Favorite Button */}
            <button
              onClick={handleRemoveFavorite}
              disabled={removing}
              className={`flex items-center gap-2 group ${removing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full group-hover:bg-pink-50 transition">
                <svg
                  className="h-5 w-5 text-pink-500 fill-pink-500"
                  fill="currentColor"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-sm text-pink-500">
                {removing ? "解除中..." : "お気に入り解除"}
              </span>
            </button>

            {/* Link to original tweet */}
            <Link
              href="/app/tweet"
              className="ml-auto flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <span>元のツイートを見る</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
