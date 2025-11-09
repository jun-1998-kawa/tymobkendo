"use client";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Authenticator form fields configuration
const formFields = {
  signUp: {
    family_name: {
      order: 1,
      placeholder: "山田",
      label: "姓",
      isRequired: true,
    },
    given_name: {
      order: 2,
      placeholder: "太郎",
      label: "名",
      isRequired: true,
    },
    "custom:graduationYear": {
      order: 3,
      placeholder: "2020",
      label: "卒業年度",
      isRequired: false,
      type: "number",
    },
    email: {
      order: 4,
      placeholder: "example@example.com",
      label: "メールアドレス",
      isRequired: true,
    },
    password: {
      order: 5,
      label: "パスワード",
      placeholder: "パスワードを入力",
      isRequired: true,
    },
    confirm_password: {
      order: 6,
      label: "パスワード（確認）",
      placeholder: "パスワードを再入力",
      isRequired: true,
    },
  },
};

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator
      formFields={formFields}
      signUpAttributes={["given_name", "family_name", "custom:graduationYear"] as any}
    >
      {({ signOut, user }) => {
        return (
          <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary-50 via-white to-gold-50">
            <Header signOut={signOut} userEmail={user?.signInDetails?.loginId} user={user} />
            <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
            <Footer />
          </div>
        );
      }}
    </Authenticator>
  );
}

function Header({ signOut, userEmail, user }: { signOut?: () => void; userEmail?: string; user?: any }) {
  const pathname = usePathname();

  // ユーザーのグループを取得
  const groups = user?.signInUserSession?.accessToken?.payload["cognito:groups"] || [];
  const isAdmin = groups.includes("ADMINS");

  const navItems = [
    { href: "/app", label: "ダッシュボード", icon: "🏠" },
    { href: "/app/tweet", label: "近況投稿", icon: "💬" },
    { href: "/app/board", label: "掲示板", icon: "📋" },
    { href: "/app/history", label: "歴史", icon: "📜" },
  ];

  // 管理者の場合は管理ページを追加
  if (isAdmin) {
    navItems.push({ href: "/admin", label: "管理", icon: "⚙️" });
  }

  const isActive = (href: string) => pathname === href || (href === "/admin" && pathname.startsWith("/admin"));

  return (
    <header className="sticky top-0 z-50 border-b border-primary-200 bg-white/95 shadow-md backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <Link
            href="/app"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-600 to-gold-600 text-xl font-bold text-white shadow-md">
              戸
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-primary-800">
                戸山剣道部OB会
              </h1>
              <p className="text-xs text-primary-500">会員ページ</p>
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
                    ? "bg-gradient-to-r from-accent-600 to-accent-700 text-white shadow-md"
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
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-primary-800">{userEmail}</p>
              <p className="text-xs text-primary-500">{isAdmin ? "管理者" : "会員"}</p>
            </div>
            <button
              onClick={signOut}
              className="rounded-lg border-2 border-accent-600 bg-white px-4 py-2 font-semibold text-accent-600 transition-all duration-200 hover:bg-accent-600 hover:text-white"
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
                  ? "bg-gradient-to-r from-accent-600 to-accent-700 text-white shadow-md"
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

function Footer() {
  return (
    <footer className="border-t border-primary-200 bg-white px-4 py-6 text-center">
      <p className="text-sm text-primary-500">
        © 2024 戸山高校剣道部OB会. All rights reserved.
      </p>
    </footer>
  );
}
