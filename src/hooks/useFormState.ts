/**
 * フォーム状態管理フック
 * loading, error, success の状態を一元管理
 */
import { useState, useCallback } from "react";

interface UseFormStateOptions {
  /** エラーメッセージの自動クリア時間（ms）。0で無効化。デフォルト: 5000 */
  errorAutoCloseMs?: number;
  /** 成功メッセージの自動クリア時間（ms）。0で無効化。デフォルト: 3000 */
  successAutoCloseMs?: number;
}

interface UseFormStateReturn {
  /** ローディング状態 */
  loading: boolean;
  /** エラーメッセージ */
  error: string;
  /** 成功状態 */
  success: boolean;
  /** ローディング状態を設定 */
  setLoading: (value: boolean) => void;
  /** エラーメッセージを設定（autoClear: trueで自動クリア） */
  setError: (message: string, autoClear?: boolean) => void;
  /** 成功状態を設定（autoClear: trueで自動クリア） */
  setSuccess: (value: boolean, autoClear?: boolean) => void;
  /** 全状態をリセット */
  reset: () => void;
  /** エラーをクリア */
  clearError: () => void;
  /** 成功をクリア */
  clearSuccess: () => void;
}

/**
 * フォームの状態（loading, error, success）を管理するカスタムフック
 *
 * @example
 * ```tsx
 * const { loading, error, success, setLoading, setError, setSuccess } = useFormState();
 *
 * const handleSubmit = async () => {
 *   setLoading(true);
 *   try {
 *     await submitData();
 *     setSuccess(true, true); // 自動クリア有効
 *   } catch (e) {
 *     setError(e.message, true); // 自動クリア有効
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 * ```
 */
export function useFormState(options: UseFormStateOptions = {}): UseFormStateReturn {
  const { errorAutoCloseMs = 5000, successAutoCloseMs = 3000 } = options;

  const [loading, setLoadingState] = useState(false);
  const [error, setErrorState] = useState("");
  const [success, setSuccessState] = useState(false);

  const setLoading = useCallback((value: boolean) => {
    setLoadingState(value);
  }, []);

  const clearError = useCallback(() => {
    setErrorState("");
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccessState(false);
  }, []);

  const setError = useCallback(
    (message: string, autoClear = true) => {
      setErrorState(message);
      if (autoClear && errorAutoCloseMs > 0 && message) {
        setTimeout(() => {
          setErrorState("");
        }, errorAutoCloseMs);
      }
    },
    [errorAutoCloseMs]
  );

  const setSuccess = useCallback(
    (value: boolean, autoClear = true) => {
      setSuccessState(value);
      if (autoClear && successAutoCloseMs > 0 && value) {
        setTimeout(() => {
          setSuccessState(false);
        }, successAutoCloseMs);
      }
    },
    [successAutoCloseMs]
  );

  const reset = useCallback(() => {
    setLoadingState(false);
    setErrorState("");
    setSuccessState(false);
  }, []);

  return {
    loading,
    error,
    success,
    setLoading,
    setError,
    setSuccess,
    reset,
    clearError,
    clearSuccess,
  };
}
