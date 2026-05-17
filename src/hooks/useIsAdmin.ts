"use client";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

interface UseIsAdminReturn {
  isAdmin: boolean;
  loading: boolean;
}

/**
 * 現在ログイン中ユーザーが Cognito の ADMINS グループに属しているかを返す。
 *
 * 注意: 認可は最終的に AppSync 側で評価される。このフックは UI 上の出し分け（削除ボタンの表示等）に限り使用すること。
 */
export function useIsAdmin(): UseIsAdminReturn {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const session = await fetchAuthSession();
        const groups =
          (session.tokens?.accessToken?.payload["cognito:groups"] as string[]) ||
          [];
        if (!cancelled) setIsAdmin(groups.includes("ADMINS"));
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return { isAdmin, loading };
}
