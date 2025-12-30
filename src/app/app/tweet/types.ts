/**
 * Tweet機能の型定義
 */
import type { Tweet as AmplifyTweet, Favorite as AmplifyFavorite } from "@/lib/amplifyClient";

// Amplifyの型を再エクスポート（必要に応じてカスタマイズ可能）
export type Tweet = AmplifyTweet;
export type Favorite = AmplifyFavorite;

/**
 * TweetCardコンポーネントのProps
 */
export interface TweetCardProps {
  tweet: Tweet;
  allTweets: Tweet[];
  currentUserId: string;
  favorites: Favorite[];
  onDelete: (tweet: Tweet) => void;
  onReply: (tweet: Tweet) => void;
  isReply?: boolean;
}

/**
 * TweetFormコンポーネントのProps
 */
export interface TweetFormProps {
  currentUserId: string;
  currentUserName: string;
  replyTo: Tweet | null;
  onCancelReply: () => void;
  onPostSuccess: () => void;
}

/**
 * TweetListコンポーネントのProps
 */
export interface TweetListProps {
  tweets: Tweet[];
  currentUserId: string;
  favorites: Favorite[];
  onDelete: (tweet: Tweet) => void;
  onReply: (tweet: Tweet) => void;
}
