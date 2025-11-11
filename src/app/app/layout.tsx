"use client";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

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
          <div className="flex min-h-screen flex-col bg-gray-50">
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.accessToken?.payload["cognito:groups"] as string[] || [];
        const adminStatus = groups.includes("ADMINS");
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };

    checkAdminStatus();
  }, [user]);

  const navItems = useMemo(() => {
    const items = [
      { href: "/app", label: "ダッシュボード" },
      { href: "/app/tweet", label: "近況投稿" },
      { href: "/app/favorites", label: "お気に入り" },
      { href: "/app/board", label: "掲示板" },
      { href: "/app/history", label: "歴史" },
    ];

    // 管理者の場合は管理ページを追加
    if (isAdmin) {
      items.push({ href: "/admin", label: "管理" });
    }

    return items;
  }, [isAdmin]);

  const isActive = (href: string) => pathname === href || (href === "/admin" && pathname.startsWith("/admin"));

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <Link
            href="/app"
            className="text-base font-semibold text-gray-900 hover:text-gray-700"
          >
            戸山剣道部OB会
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-xs text-gray-600">{userEmail}</p>
            </div>
            <button
              onClick={signOut}
              className="border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="mt-3 flex gap-2 overflow-x-auto md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-4 text-center">
      <p className="text-xs text-gray-500">
        © 2024 戸山高校剣道部OB会. All rights reserved.
      </p>
    </footer>
  );
}
