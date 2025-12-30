/**
 * 画像アップロードフック
 * S3への画像アップロードとURL取得を共通化
 */
import { useState, useCallback } from "react";
import { uploadData, getUrl } from "aws-amplify/storage";

interface UseImageUploadOptions {
  /** ベースパス: "members" | "public" */
  basePath: "members" | "public";
  /** ユーザーIDまたはサブパス（membersの場合は必須） */
  userId?: string;
  /** カテゴリ名（ファイル名のプレフィックス）*/
  category?: string;
  /** 最大ファイル数。デフォルト: 4 */
  maxFiles?: number;
  /** 許可するファイルタイプ。デフォルト: ["image/*"] */
  acceptTypes?: string[];
  /** アップロード成功時のコールバック */
  onSuccess?: (paths: string[]) => void;
  /** アップロードエラー時のコールバック */
  onError?: (error: Error) => void;
}

interface UseImageUploadReturn {
  /** アップロードされた画像のパス（ファイル名のみ） */
  imagePaths: string[];
  /** アップロード中かどうか */
  uploading: boolean;
  /** エラーメッセージ */
  error: string;
  /** 画像アップロードハンドラ */
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  /** 画像を削除 */
  handleRemoveImage: (index: number) => void;
  /** 状態をリセット */
  reset: () => void;
  /** 画像パスを設定（初期値設定用） */
  setImagePaths: (paths: string[]) => void;
}

/**
 * 画像アップロードを管理するカスタムフック
 *
 * @example
 * ```tsx
 * // 会員用（members/パス）
 * const { imagePaths, uploading, handleImageUpload, handleRemoveImage } = useImageUpload({
 *   basePath: "members",
 *   userId: currentUserId,
 *   category: "tweet",
 *   maxFiles: 4,
 * });
 *
 * // 管理者用（public/パス）
 * const { imagePaths, uploading, handleImageUpload } = useImageUpload({
 *   basePath: "public",
 *   category: "news",
 *   maxFiles: 4,
 * });
 * ```
 */
export function useImageUpload(options: UseImageUploadOptions): UseImageUploadReturn {
  const {
    basePath,
    userId,
    category = "image",
    maxFiles = 4,
    onSuccess,
    onError,
  } = options;

  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (imagePaths.length + files.length > maxFiles) {
        const msg = `画像は最大${maxFiles}枚までアップロードできます`;
        setError(msg);
        setTimeout(() => setError(""), 5000);
        return;
      }

      setUploading(true);
      setError("");
      const uploadedPaths: string[] = [];

      try {
        for (const file of Array.from(files)) {
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(7);
          const fileName = `${category}-${timestamp}-${randomStr}-${file.name}`;

          // パスを構築
          let fullPath: string;
          if (basePath === "members" && userId) {
            fullPath = `members/${userId}/${fileName}`;
          } else if (basePath === "public") {
            fullPath = `public/${category}/${fileName}`;
          } else {
            throw new Error("Invalid basePath or missing userId for members path");
          }

          await uploadData({
            path: fullPath,
            data: file,
            options: {
              contentType: file.type,
            },
          }).result;

          uploadedPaths.push(fileName);
        }

        const newPaths = [...imagePaths, ...uploadedPaths];
        setImagePaths(newPaths);
        onSuccess?.(uploadedPaths);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("アップロードに失敗しました");
        console.error("Error uploading images:", error);
        setError("画像のアップロードに失敗しました");
        setTimeout(() => setError(""), 5000);
        onError?.(error);
      } finally {
        setUploading(false);
        // input要素をリセット
        e.target.value = "";
      }
    },
    [imagePaths, maxFiles, basePath, userId, category, onSuccess, onError]
  );

  const handleRemoveImage = useCallback((index: number) => {
    setImagePaths((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const reset = useCallback(() => {
    setImagePaths([]);
    setUploading(false);
    setError("");
  }, []);

  return {
    imagePaths,
    uploading,
    error,
    handleImageUpload,
    handleRemoveImage,
    reset,
    setImagePaths,
  };
}

/**
 * 画像URLを取得するユーティリティ関数
 *
 * @example
 * ```tsx
 * const urls = await getImageUrls(imagePaths, "members", userId);
 * ```
 */
export async function getImageUrls(
  paths: string[],
  basePath: "members" | "public",
  userId?: string,
  category?: string
): Promise<string[]> {
  if (!paths || paths.length === 0) return [];

  const urls = await Promise.all(
    paths.map(async (path) => {
      try {
        let fullPath: string;
        if (basePath === "members" && userId) {
          fullPath = `members/${userId}/${path}`;
        } else if (basePath === "public") {
          fullPath = category ? `public/${category}/${path}` : `public/${path}`;
        } else {
          return null;
        }

        const urlResult = await getUrl({ path: fullPath });
        return urlResult.url.toString();
      } catch (err) {
        console.error("Error getting image URL:", err);
        return null;
      }
    })
  );

  return urls.filter((url): url is string => url !== null);
}

/**
 * 画像URLを取得するフック
 *
 * @example
 * ```tsx
 * const { urls, loading } = useImageUrls(tweet.imagePaths, "members", tweet.authorId);
 * ```
 */
export function useImageUrls(
  paths: string[] | null | undefined,
  basePath: "members" | "public",
  userId?: string,
  category?: string
) {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // pathsが変更されたときにURLを取得
  useState(() => {
    if (!paths || paths.length === 0) {
      setUrls([]);
      return;
    }

    setLoading(true);
    getImageUrls(paths, basePath, userId, category)
      .then(setUrls)
      .finally(() => setLoading(false));
  });

  return { urls, loading };
}
