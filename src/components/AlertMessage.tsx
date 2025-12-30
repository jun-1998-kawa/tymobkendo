"use client";

import { motion, AnimatePresence } from "framer-motion";

type AlertType = "error" | "success" | "info" | "warning";

interface AlertMessageProps {
  /** アラートの種類 */
  type: AlertType;
  /** 表示するメッセージ */
  message: string;
  /** 表示するかどうか（AnimatePresenceで制御） */
  show?: boolean;
  /** 閉じるボタンのコールバック */
  onClose?: () => void;
  /** アニメーションを有効にするか。デフォルト: true */
  animated?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

const alertStyles: Record<AlertType, { bg: string; text: string; border: string }> = {
  error: {
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
  },
  success: {
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-200",
  },
  info: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
};

/**
 * アラートメッセージコンポーネント
 * エラー、成功、情報、警告メッセージを統一されたスタイルで表示
 *
 * @example
 * ```tsx
 * <AlertMessage
 *   type="error"
 *   message={error}
 *   show={!!error}
 *   onClose={() => setError("")}
 * />
 *
 * <AlertMessage
 *   type="success"
 *   message="保存しました"
 *   show={success}
 * />
 * ```
 */
export function AlertMessage({
  type,
  message,
  show = true,
  onClose,
  animated = true,
  className = "",
}: AlertMessageProps) {
  const styles = alertStyles[type];

  const content = (
    <div
      className={`p-3 text-sm border ${styles.bg} ${styles.text} ${styles.border} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-2 ${styles.text} hover:opacity-70 transition-opacity`}
            aria-label="閉じる"
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
        )}
      </div>
    </div>
  );

  if (!animated) {
    return show ? content : null;
  }

  return (
    <AnimatePresence>
      {show && message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * シンプルなアラートメッセージ（アニメーションなし、掲示板スタイル）
 */
export function SimpleAlertMessage({
  type,
  message,
  show = true,
  className = "",
}: Omit<AlertMessageProps, "animated" | "onClose">) {
  if (!show || !message) return null;

  const styles = alertStyles[type];

  return (
    <div
      className={`p-2 text-sm border ${styles.bg} ${styles.text} ${styles.border} ${className}`}
    >
      {message}
    </div>
  );
}
