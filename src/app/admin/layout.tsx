"use client";
import { Authenticator, useAuthenticator, View, Text, Heading } from "@aws-amplify/ui-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

// カスタムコンポーネント（管理者用）
const components = {
  SignIn: {
    Header() {
      return (
        <View textAlign="center" padding="1rem">
          <Heading level={3}>管理者ログイン</Heading>
          <Text fontSize="0.875rem" color="red">
            この画面は管理者専用です
          </Text>
        </View>
      );
    },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator
      components={components}
      hideSignUp={true}
    >
      {({ signOut, user }) => <AdminGuard signOut={signOut} user={user}>{children}</AdminGuard>}
    </Authenticator>
  );
}

function AdminGuard({ signOut, user, children }: any) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // fetchAuthSessionを使ってより確実にグループ情報を取得
        const session = await fetchAuthSession();
        const groups = session.tokens?.accessToken?.payload["cognito:groups"] as string[] || [];
        console.log("🔍 Admin layout - Groups:", groups);
        const adminStatus = groups.includes("ADMINS");
        console.log("🔍 Admin layout - Is Admin:", adminStatus);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-gold-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-accent-600 border-t-transparent"></div>
          <p className="text-lg text-primary-600">確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-gold-50 px-4">
        <div className="max-w-md rounded-2xl border-2 border-red-200 bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-6xl">🚫</div>
          <h1 className="mb-4 font-serif text-3xl font-bold text-primary-800">
            アクセス権限がありません
          </h1>
          <p className="mb-6 text-lg text-primary-600">
            この管理画面にアクセスするには、管理者権限が必要です。
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-lg bg-gradient-to-r from-accent-600 to-accent-700 px-6 py-3 font-semibold text-white transition-all hover:scale-105"
            >
              トップページへ
            </Link>
            <button
              onClick={signOut}
              className="rounded-lg border-2 border-primary-800 bg-white px-6 py-3 font-semibold text-primary-800 transition-all hover:bg-primary-800 hover:text-white"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary-50 via-white to-gold-50">
      <AdminHeader signOut={signOut} />
      <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
      <AdminFooter />
    </div>
  );
}

function AdminHeader({ signOut }: { signOut?: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "ホーム" },
    { href: "/admin/news", label: "ニュース" },
    { href: "/admin/site-config", label: "サイト設定" },
    { href: "/admin/hero-slides", label: "スライド" },
    { href: "/admin/history", label: "歴史" },
    { href: "/admin/invite-codes", label: "招待コード" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/admin" className="font-serif text-base font-bold text-gray-900">
            管理画面
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-accent-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-full -translate-x-1/2 bg-gradient-to-r from-accent-500 to-gold-500" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm text-gray-500 hover:text-gray-900 md:block"
            >
              公開ページ
            </Link>
            <button
              onClick={signOut}
              className="border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-accent-300 hover:text-accent-700"
            >
              ログアウト
            </button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto pb-2 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "border-b-2 border-accent-500 text-accent-700"
                  : "text-gray-600"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function AdminFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white px-4 py-4 text-center">
      <p className="text-xs text-gray-400">管理画面 - 戸山高校剣道部OB会</p>
    </footer>
  );
}
