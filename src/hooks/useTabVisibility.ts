"use client";
import { useEffect, useState } from "react";
import { models } from "@/lib/amplifyClient";
import type { SiteConfig } from "@/lib/amplifyClient";

export interface TabVisibility {
  /** 近況タブ */
  showTweet: boolean;
  /** お気に入りタブ */
  showFavorites: boolean;
  /** 掲示板タブ */
  showBoard: boolean;
}

interface UseTabVisibilityReturn extends TabVisibility {
  loading: boolean;
}

// 既定は全タブ表示（設定未取得・取得失敗時のフォールバック）
const DEFAULT_VISIBILITY: TabVisibility = {
  showTweet: true,
  showFavorites: true,
  showBoard: true,
};

/**
 * 管理画面（サイト設定）で制御される会員ページのタブ表示状態を返す。
 *
 * 注意: これは UI 上の出し分けに限る。データ自体へのアクセス可否は別途
 * AppSync 側の認可で制御される（タブを隠してもデータは保護されない）。
 */
export function useTabVisibility(): UseTabVisibilityReturn {
  const [visibility, setVisibility] = useState<TabVisibility>(DEFAULT_VISIBILITY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: configs } = await models.SiteConfig.list({
          filter: { isActive: { eq: true } },
          limit: 1,
        });
        const config = configs?.[0] as SiteConfig | undefined;
        if (!cancelled && config) {
          setVisibility({
            // null/undefined（未設定）は表示扱い
            showTweet: config.showTweet !== false,
            showFavorites: config.showFavorites !== false,
            showBoard: config.showBoard !== false,
          });
        }
      } catch (error) {
        console.error("Error loading tab visibility:", error);
        // フォールバックで全タブ表示を維持
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...visibility, loading };
}
