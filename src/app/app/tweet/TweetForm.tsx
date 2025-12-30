"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useFormState } from "@/hooks/useFormState";
import { models } from "@/lib/amplifyClient";
import { AlertMessage } from "@/components/AlertMessage";
import type { TweetFormProps, Tweet } from "./types";

const MAX_CHARACTERS = 140;

/**
 * ツイート投稿フォームコンポーネント
 */
export function TweetForm({
  currentUserId,
  currentUserName,
  replyTo,
  onCancelReply,
  onPostSuccess,
}: TweetFormProps) {
  const [content, setContent] = useState("");

  const { loading, error, success, setLoading, setError, setSuccess } = useFormState();

  const {
    imagePaths,
    uploading,
    error: uploadError,
    handleImageUpload,
    handleRemoveImage,
    reset: resetImages,
  } = useImageUpload({
    basePath: "members",
    userId: currentUserId,
    category: "tweet",
    maxFiles: 4,
    onError: (err) => setError(err.message),
  });

  const disabled = content.length === 0 || content.length > MAX_CHARACTERS;

  const handlePost = async () => {
    if (disabled) return;

    setLoading(true);

    try {
      const tweetData: Partial<Tweet> & { content: string } = {
        content,
        imagePaths: imagePaths.length > 0 ? imagePaths : undefined,
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
      resetImages();
      onCancelReply();
      setSuccess(true);
      onPostSuccess();
    } catch (e) {
      const message = e instanceof Error ? e.message : "投稿に失敗しました";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !disabled) {
      handlePost();
    }
  };

  const displayError = error || uploadError;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex gap-3 p-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-gold-500 text-white font-bold text-lg shadow-sm">
            {currentUserName[0]?.toUpperCase() || "自"}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-1 min-w-0">
          {/* Reply To Indicator */}
          {replyTo && (
            <div className="mb-2 text-sm text-gray-600 bg-accent-50 p-2 flex items-center justify-between border-l-2 border-accent-400 rounded-r">
              <span>
                <span className="font-medium text-accent-700">@{replyTo.author}</span> へのリプライ
              </span>
              <button
                onClick={onCancelReply}
                className="text-gray-400 hover:text-accent-600 transition-colors"
              >
                ×
              </button>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_CHARACTERS + 10}
            placeholder={replyTo ? "返信をツイート" : "いまどうしてる？"}
            className="w-full resize-none border-0 text-xl placeholder-gray-500 focus:outline-none focus:ring-0 bg-transparent"
            rows={3}
          />

          {/* Image Preview Grid */}
          {imagePaths.length > 0 && (
            <div
              className={`mt-3 overflow-hidden border border-gray-200 ${
                imagePaths.length === 1
                  ? "grid-cols-1"
                  : imagePaths.length === 2
                  ? "grid grid-cols-2 gap-0.5"
                  : imagePaths.length === 3
                  ? "grid grid-cols-2 gap-0.5"
                  : "grid grid-cols-2 gap-0.5"
              }`}
            >
              {imagePaths.map((path, index) => (
                <div
                  key={index}
                  className={`relative bg-gray-100 ${
                    imagePaths.length === 1
                      ? "aspect-video"
                      : imagePaths.length === 3 && index === 0
                      ? "row-span-2 aspect-square"
                      : "aspect-square"
                  }`}
                >
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-sm text-gray-500">画像</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute right-2 top-2 bg-gray-900/75 p-1.5 text-white hover:bg-gray-900"
                    title="削除"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
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
              <label
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-accent-50 transition-colors ${
                  uploading || imagePaths.length >= 4
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading || imagePaths.length >= 4}
                  className="hidden"
                />
                <svg
                  className="h-5 w-5 text-accent-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </label>

              {uploading && (
                <span className="text-sm text-accent-600">アップロード中...</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Character Counter */}
              {content.length > 0 && (
                <div
                  className={`text-sm font-medium ${
                    content.length > MAX_CHARACTERS
                      ? "text-red-600"
                      : content.length > MAX_CHARACTERS * 0.9
                      ? "text-orange-600"
                      : "text-gray-500"
                  }`}
                >
                  {content.length}/{MAX_CHARACTERS}
                </div>
              )}

              {/* Post Button */}
              <button
                disabled={disabled || loading || uploading}
                onClick={handlePost}
                className={`rounded-full px-5 py-2 font-semibold text-sm transition-all duration-200 ${
                  disabled || loading || uploading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-sm hover:from-accent-700 hover:to-accent-600 hover:shadow-md"
                }`}
              >
                {loading ? "投稿中..." : replyTo ? "返信" : "ポスト"}
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
          <div className="mt-3">
            <AlertMessage
              type="success"
              message="投稿しました"
              show={success}
            />
            <AlertMessage
              type="error"
              message={displayError}
              show={!!displayError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
