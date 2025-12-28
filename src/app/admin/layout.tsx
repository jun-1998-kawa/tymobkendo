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
      <AdminHeader signOut={signOut} userEmail={user?.signInDetails?.loginId} />
      <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
      <AdminFooter />
    </div>
  );
}

function AdminHeader({ signOut, userEmail }: { signOut?: () => void; userEmail?: string }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "ダッシュボード", icon: "🏠" },
    { href: "/admin/invite-codes", label: "招待コード", icon: "🎟️" },
    { href: "/admin/hero-slides", label: "スライド管理", icon: "🖼️" },
    { href: "/admin/site-config", label: "サイト設定", icon: "⚙️" },
    { href: "/admin/news", label: "ニュース管理", icon: "📰" },
    { href: "/admin/pages", label: "ページ管理", icon: "📄" },
    { href: "/admin/history", label: "歴史管理", icon: "📜" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 border-b-2 border-accent-300 bg-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <Link
            href="/admin"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-amber-600 text-xl font-bold text-white shadow-md">
              管
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-primary-800">
                管理画面
              </h1>
              <p className="text-xs text-red-600">ADMINS ONLY</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md"
                    : "text-primary-700 hover:bg-primary-100"
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden rounded-lg border border-primary-300 bg-white px-4 py-2 text-sm font-semibold text-primary-700 transition-all hover:bg-primary-100 md:block"
            >
              公開ページへ
            </Link>
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-primary-800">{userEmail}</p>
              <p className="text-xs font-bold text-red-600">管理者</p>
            </div>
            <button
              onClick={signOut}
              className="rounded-lg border-2 border-red-600 bg-white px-4 py-2 font-semibold text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="mt-4 flex gap-2 overflow-x-auto md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md"
                  : "bg-primary-100 text-primary-700 hover:bg-primary-200"
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function AdminFooter() {
  return (
    <footer className="border-t border-primary-200 bg-white px-4 py-6 text-center">
      <p className="text-sm text-primary-500">
        管理画面 - 戸山高校剣道部OB会
      </p>
    </footer>
  );
}
