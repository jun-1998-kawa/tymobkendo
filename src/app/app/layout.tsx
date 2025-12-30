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
      { href: "/app", label: "ホーム", icon: "home" },
      { href: "/app/tweet", label: "近況", icon: "edit" },
      { href: "/app/favorites", label: "お気に入り", icon: "heart" },
      { href: "/app/board", label: "掲示板", icon: "message" },
      { href: "/app/history", label: "歴史", icon: "book" },
    ];

    // 管理者の場合は管理ページを追加
    if (isAdmin) {
      items.push({ href: "/admin", label: "管理", icon: "settings" });
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
          {/* Logo/Title */}
          <Link
            href="/app"
            className="group flex items-center gap-2"
          >
            <span className="hidden text-base font-bold text-gray-900 sm:block">
              戸山剣道部<span className="text-accent-600">OB会</span>
            </span>
            <span className="text-base font-bold text-gray-900 sm:hidden">
              OB会
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
            className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              isActive(item.href)
                ? "text-accent-600"
                : "text-gray-400"
            }`}
          >
            <NavIcon name={item.icon} active={isActive(item.href)} />
            <span>{item.label}</span>
            {isActive(item.href) && (
              <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent-500 to-gold-500" />
            )}
          </Link>
        ))}
      </nav>
    </header>
  );
}

// SVG Icon Component
function NavIcon({ name, active }: { name: string; active: boolean }) {
  const className = `h-5 w-5 transition-colors ${active ? "text-accent-600" : "text-gray-400"}`;

  switch (name) {
    case "home":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      );
    case "edit":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      );
    case "heart":
      return (
        <svg className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      );
    case "message":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      );
    case "book":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      );
    case "settings":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
}

function Footer() {
  return (
    <footer className="hidden border-t border-gray-100 bg-white px-4 py-6 md:block">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">戸山剣道部OB会</span>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} 戸山高校剣道部OB会
          </p>
        </div>
      </div>
    </footer>
  );
}
