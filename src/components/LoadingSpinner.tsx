"use client";

type SpinnerSize = "sm" | "md" | "lg";
type SpinnerColor = "primary" | "accent" | "blue" | "gray";

interface LoadingSpinnerProps {
  /** スピナーのサイズ。デフォルト: "md" */
  size?: SpinnerSize;
  /** スピナーの色。デフォルト: "blue" */
  color?: SpinnerColor;
  /** 表示するテキスト */
  text?: string;
  /** カスタムクラス名 */
  className?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-3",
  lg: "h-12 w-12 border-4",
};

const colorStyles: Record<SpinnerColor, string> = {
  primary: "border-primary-600 border-t-transparent",
  accent: "border-accent-600 border-t-transparent",
  blue: "border-blue-600 border-t-transparent",
  gray: "border-gray-400 border-t-transparent",
};

/**
 * ローディングスピナーコンポーネント
 *
 * @example
 * ```tsx
 * <LoadingSpinner />
 * <LoadingSpinner size="lg" text="読み込み中..." />
 * <LoadingSpinner color="primary" />
 * ```
 */
export function LoadingSpinner({
  size = "md",
  color = "blue",
  text,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full ${sizeStyles[size]} ${colorStyles[color]}`}
        role="status"
        aria-label="読み込み中"
      />
      {text && (
        <p className="mt-3 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
}

interface FullPageLoaderProps {
  /** 表示するテキスト。デフォルト: "読み込み中..." */
  text?: string;
  /** 背景のスタイル。デフォルト: "gradient" */
  background?: "gradient" | "solid" | "transparent";
}

/**
 * フルページローディングコンポーネント
 * ページ全体を覆うローディング表示
 *
 * @example
 * ```tsx
 * if (loading) {
 *   return <FullPageLoader text="確認中..." />;
 * }
 * ```
 */
export function FullPageLoader({
  text = "読み込み中...",
  background = "gradient",
}: FullPageLoaderProps) {
  const bgStyles = {
    gradient: "bg-gradient-to-br from-primary-50 to-gold-50",
    solid: "bg-white",
    transparent: "bg-transparent",
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center ${bgStyles[background]}`}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" color="accent" />
        <p className="mt-4 text-lg text-primary-600">{text}</p>
      </div>
    </div>
  );
}

/**
 * インラインローディングコンポーネント
 * コンテンツ内で使用するローディング表示
 *
 * @example
 * ```tsx
 * {loading ? <InlineLoader /> : <Content />}
 * ```
 */
export function InlineLoader({
  text = "読み込み中...",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`p-12 text-center ${className}`}>
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}
