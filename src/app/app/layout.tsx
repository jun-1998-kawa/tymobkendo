"use client";
import { Authenticator, useAuthenticator, View, Text, Heading, TextField } from "@aws-amplify/ui-react";
import { signUp, SignUpInput } from "aws-amplify/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

// Authenticator form fields configuration
const formFields = {
  signUp: {
    "custom:inviteCode": {
      order: 1,
      placeholder: "招待コードを入力",
      label: "招待コード",
      isRequired: true,
    },
    family_name: {
      order: 2,
      placeholder: "山田",
      label: "姓",
      isRequired: true,
    },
    given_name: {
      order: 3,
      placeholder: "太郎",
      label: "名",
      isRequired: true,
    },
    "custom:graduationYear": {
      order: 4,
      placeholder: "2020",
      label: "卒業年度",
      isRequired: false,
      type: "number",
    },
    email: {
      order: 5,
      placeholder: "example@example.com",
      label: "メールアドレス",
      isRequired: true,
    },
    password: {
      order: 6,
      label: "パスワード",
      placeholder: "パスワードを入力",
      isRequired: true,
      helpText: "必須: 8文字以上、大文字（A-Z）・小文字（a-z）・数字（0-9）・記号（!@#$%など）を含む",
    },
    confirm_password: {
      order: 7,
      label: "パスワード（確認）",
      placeholder: "パスワードを再入力",
      isRequired: true,
    },
  },
};

// カスタムサービス：招待コードをclientMetadataとして送信
const services = {
  async handleSignUp(input: SignUpInput) {
    // フォームから招待コードを取得（カスタム属性として送信される）
    const inviteCode = input.options?.userAttributes?.["custom:inviteCode"] || "";

    // 招待コードをclientMetadataとして送信
    return signUp({
      username: input.username,
      password: input.password,
      options: {
        userAttributes: {
          email: input.options?.userAttributes?.email,
          given_name: input.options?.userAttributes?.given_name,
          family_name: input.options?.userAttributes?.family_name,
          "custom:graduationYear": input.options?.userAttributes?.["custom:graduationYear"] || "",
        },
        clientMetadata: {
          inviteCode: inviteCode,
        },
      },
    });
  },
};

// カスタムコンポーネント
const components = {
  SignUp: {
    Header() {
      return (
        <View textAlign="center" padding="1rem">
          <Heading level={3}>新規登録（招待制）</Heading>
          <View
            backgroundColor="var(--amplify-colors-orange-10)"
            padding="0.75rem"
            marginTop="1rem"
            borderRadius="0.25rem"
            style={{ borderLeft: "4px solid var(--amplify-colors-orange-60)" }}
          >
            <Text fontSize="0.875rem" fontWeight="600" color="var(--amplify-colors-orange-80)">
              招待制について
            </Text>
            <Text fontSize="0.75rem" color="var(--amplify-colors-orange-80)" marginTop="0.25rem">
              新規登録には招待コードが必要です。<br />
              招待コードは管理者またはOB会員から取得してください。
            </Text>
          </View>
          <View
            backgroundColor="var(--amplify-colors-blue-10)"
            padding="0.75rem"
            marginTop="0.5rem"
            borderRadius="0.25rem"
            style={{ borderLeft: "4px solid var(--amplify-colors-blue-60)" }}
          >
            <Text fontSize="0.875rem" fontWeight="600" color="var(--amplify-colors-blue-80)">
              パスワード要件
            </Text>
            <Text fontSize="0.75rem" color="var(--amplify-colors-blue-80)" marginTop="0.25rem">
              • 8文字以上<br />
              • 大文字を含む（A-Z）<br />
              • 小文字を含む（a-z）<br />
              • 数字を含む（0-9）<br />
              • 記号を含む（!@#$%^&*など）
            </Text>
          </View>
        </View>
      );
    },
    Footer() {
      return (
        <View textAlign="center" padding="1rem">
          <Text fontSize="0.875rem" color="gray">
            登録後、<strong>no-reply@verificationemail.com</strong> から確認メールが送信されます。
            <br />
            メールに記載された確認コードを入力してください。
          </Text>
        </View>
      );
    },
  },
  SignIn: {
    Header() {
      return (
        <View textAlign="center" padding="1rem">
          <Heading level={3}>ログイン</Heading>
        </View>
      );
    },
  },
};

// 日本語テキスト
const translations = {
  ja: {
    "Sign In": "ログイン",
    "Sign Up": "新規登録",
    "Sign Out": "ログアウト",
    "Sign in": "ログイン",
    "Sign up": "新規登録",
    "Username": "ユーザー名",
    "Password": "パスワード",
    "Email": "メールアドレス",
    "Phone Number": "電話番号",
    "Confirm Password": "パスワード（確認）",
    "Code": "確認コード",
    "Confirmation Code": "確認コード",
    "Lost your code?": "コードを紛失しましたか？",
    "Resend Code": "コードを再送信",
    "Submit": "送信",
    "Back to Sign In": "ログインに戻る",
    "Send Code": "コードを送信",
    "Confirm": "確認",
    "Create Account": "アカウント作成",
    "Forgot your password?": "パスワードをお忘れですか？",
    "Reset Password": "パスワードリセット",
    "Enter your username": "ユーザー名を入力",
    "Enter your password": "パスワードを入力",
    "Confirm Sign Up": "サインアップ確認",
    "Confirming": "確認中",
    "Signing in": "ログイン中",
    "We Emailed You": "メールを送信しました",
    "Your code is on the way. To log in, enter the code we emailed to":
      "確認コードを送信しました。以下のメールアドレスに届いたコードを入力してください：",
    "It may take a minute to arrive.": "メールが届くまで少し時間がかかる場合があります。",
  },
};

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator
      formFields={formFields}
      signUpAttributes={["given_name", "family_name", "custom:graduationYear", "custom:inviteCode"] as any}
      components={components}
      services={services}
      // @ts-ignore
      variation="default"
      hideSignUp={false}
    >
      {({ signOut, user }) => {
        return (
          <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-white">
            <Header signOut={signOut} userEmail={user?.signInDetails?.loginId} user={user} />
            <main className="flex-1 px-4 pb-20 pt-6 md:px-8 md:pb-8">{children}</main>
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
  const [scrolled, setScrolled] = useState(false);

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

  // スクロール検知
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = useMemo(() => {
    const items = [
      { href: "/app", label: "ホーム", icon: "🏠" },
      { href: "/app/tweet", label: "近況", icon: "📝" },
      { href: "/app/favorites", label: "お気に入り", icon: "⭐" },
      { href: "/app/board", label: "掲示板", icon: "💬" },
      { href: "/app/history", label: "歴史", icon: "📚" },
    ];

    // 管理者の場合は管理ページを追加
    if (isAdmin) {
      items.push({ href: "/admin", label: "管理", icon: "⚙️" });
    }

    return items;
  }, [isAdmin]);

  const isActive = (href: string) => pathname === href || (href === "/admin" && pathname.startsWith("/admin"));

  // ユーザー名のイニシャルを取得
  const getInitials = (email?: string) => {
    if (!email) return "?";
    return email.charAt(0).toUpperCase();
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-gray-200/80 bg-white/80 backdrop-blur-lg shadow-sm"
          : "border-b border-gray-200 bg-white"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Title with accent */}
          <Link
            href="/app"
            className="group flex items-center gap-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-800 to-primary-900 text-sm font-bold text-gold-400 shadow-sm transition-transform duration-300 group-hover:scale-105">
              剣
            </span>
            <span className="hidden text-base font-bold text-gray-900 sm:block">
              戸山剣道部<span className="text-accent-600">OB会</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? "text-accent-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent-500 to-gold-500" />
                )}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* User Avatar */}
            <div className="hidden items-center gap-2 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-gold-500 text-sm font-bold text-white shadow-sm">
                {getInitials(userEmail)}
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-700">{userEmail?.split("@")[0]}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all duration-200 hover:border-accent-300 hover:bg-accent-50 hover:text-accent-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Hidden on desktop */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white/95 backdrop-blur-lg md:hidden">
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              isActive(item.href)
                ? "text-accent-600"
                : "text-gray-500"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
            {isActive(item.href) && (
              <span className="absolute top-0 h-0.5 w-12 bg-gradient-to-r from-accent-500 to-gold-500" />
            )}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="hidden border-t border-gray-100 bg-white px-4 py-6 md:block">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary-800 to-primary-900 text-xs font-bold text-gold-400">
              剣
            </span>
            <span className="text-sm font-medium text-gray-600">戸山剣道部OB会</span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} 戸山高校剣道部OB会. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
