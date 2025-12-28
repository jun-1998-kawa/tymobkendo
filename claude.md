# Claude Code 実装ドキュメント（剣道部OB会サイト）

このドキュメントはClaude Codeが実装を進めるための具体的な手順書です。技術スタックはNext.js + TypeScript + AWS Amplify Gen 2（コードファーストBackend）を前提にします。

## 要件サマリ

- **非会員ページ**（公開）: トップページ、ニュース
- **会員ページ**（要ログイン・招待制）
  - Tweet機能（140文字、画像添付、リプライ、いいね）
  - 掲示板（スレッド＋投稿）
  - 高校剣道部の歴史ページ（公開/会員限定の切替）
  - お気に入り一覧
- **権限**: 会員は投稿可／自分の投稿は編集・削除可／他者の強制削除とサイト主要コンテンツの更新は管理者（ADMINS）のみ
- **招待制**: 新規登録には招待コードが必要（Pre Sign-up Lambdaで検証）
- **CMS**: サイト上から更新可能（管理画面）
- **CI/CD**: GitHub連携（PRプレビュー＝一時バックエンド含む）


## 0. 前提・バージョン

| 項目 | バージョン |
|------|-----------|
| Node.js | 20 または 22（`.nvmrc`で指定） |
| Next.js | 15.1.3 |
| React | 19.0.0 |
| TypeScript | 5.7.2 |
| Tailwind CSS | 3.4.1 |
| Framer Motion | 12.x |


## 1. プロジェクト構造

```
ob-kendo/
├── amplify/
│   ├── auth/
│   │   ├── resource.ts          # 認証設定（招待制）
│   │   └── pre-sign-up/
│   │       ├── resource.ts      # Lambda関数定義
│   │       └── handler.ts       # 招待コード検証
│   ├── data/
│   │   └── resource.ts          # データモデル定義
│   ├── storage/
│   │   └── resource.ts          # S3ストレージ設定
│   └── backend.ts               # バックエンド統合
├── src/
│   ├── app/
│   │   ├── page.tsx             # 公開トップページ
│   │   ├── providers.tsx        # Amplify/Theme設定
│   │   ├── layout.tsx           # ルートレイアウト
│   │   ├── news/[id]/page.tsx   # ニュース詳細
│   │   ├── app/                 # 会員ページ（要ログイン）
│   │   │   ├── layout.tsx       # 認証ガード＋招待制フォーム
│   │   │   ├── page.tsx         # ダッシュボード
│   │   │   ├── tweet/page.tsx   # 近況投稿
│   │   │   ├── favorites/page.tsx
│   │   │   ├── board/page.tsx
│   │   │   ├── board/[threadId]/page.tsx
│   │   │   └── history/page.tsx
│   │   └── admin/               # 管理ページ（ADMINSのみ）
│   │       ├── layout.tsx       # 管理者ガード
│   │       ├── page.tsx
│   │       ├── hero-slides/page.tsx
│   │       ├── site-config/page.tsx
│   │       ├── news/page.tsx
│   │       ├── pages/page.tsx
│   │       └── history/page.tsx
│   └── components/
│       ├── HeroNavigation.tsx
│       ├── NewsSection.tsx
│       ├── ShinaiSlash.tsx
│       └── ui/                  # アニメーションコンポーネント
│           ├── FadeIn.tsx
│           ├── HeroSlideshow.tsx
│           ├── ScaleUp.tsx
│           ├── SlideIn.tsx
│           └── Stagger.tsx
└── amplify_outputs.json         # 自動生成（sandbox実行後）
```


## 2. Amplify Backend

### 2.1 `amplify/backend.ts`
```ts
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";

export const backend = defineBackend({ auth, data, storage });
```

### 2.2 `amplify/auth/resource.ts`（招待制対応）
```ts
import { defineAuth } from "@aws-amplify/backend";
import { preSignUp } from "./pre-sign-up/resource";

export const auth = defineAuth({
  loginWith: { email: true },
  groups: ["ADMINS", "MEMBERS"],
  triggers: {
    preSignUp,  // 招待コード検証Lambda
  },
  userAttributes: {
    "custom:inviteCode": {
      dataType: "String",
      mutable: true,
    },
  },
});
```

### 2.3 招待コード検証Lambda

#### `amplify/auth/pre-sign-up/resource.ts`
```ts
import { defineFunction, secret } from "@aws-amplify/backend";

export const preSignUp = defineFunction({
  name: "pre-sign-up",
  entry: "./handler.ts",
  environment: {
    // 招待コード（カンマ区切りで複数指定可能）
    // 本番環境ではSecrets Managerを推奨: INVITE_CODES: secret("INVITE_CODES")
    INVITE_CODES: "KENDO2024,TOYAMA2024",
  },
});
```

#### `amplify/auth/pre-sign-up/handler.ts`
```ts
import type { PreSignUpTriggerHandler } from "aws-lambda";

export const handler: PreSignUpTriggerHandler = async (event) => {
  const submittedCode =
    event.request.clientMetadata?.inviteCode ||
    event.request.userAttributes?.["custom:inviteCode"];

  if (!submittedCode) {
    throw new Error("招待コードが入力されていません。");
  }

  const validCodes = (process.env.INVITE_CODES || "")
    .split(",").map((c) => c.trim()).filter(Boolean);

  if (!validCodes.includes(submittedCode)) {
    throw new Error("招待コードが無効です。");
  }

  return event;
};
```

### 2.4 データモデル（`amplify/data/resource.ts`）

| モデル | 説明 | 認可 |
|--------|------|------|
| **Tweet** | 140文字投稿、リプライ、いいね対応 | 認証ユーザー作成/読取、owner編集/削除、ADMINS全権 |
| **Favorite** | いいね | 認証ユーザー作成/読取、owner削除 |
| **BoardThread** | 掲示板スレッド | 認証ユーザー作成/読取、owner編集/削除、ADMINS全権 |
| **BoardMessage** | 掲示板投稿 | 同上 |
| **HistoryEntry** | 歴史エントリ（年表） | publicApiKey読取、MEMBERS作成/更新、ADMINS全権 |
| **Page** | CMSページ（slug指定） | publicApiKey読取、ADMINS作成/更新/削除 |
| **News** | ニュース・お知らせ | publicApiKey読取、ADMINS作成/更新/削除 |
| **HeroSlide** | スライドショー | publicApiKey読取、ADMINS作成/更新/削除 |
| **SiteConfig** | サイト設定（トップページ） | publicApiKey読取、ADMINS作成/更新/削除 |

#### Tweetモデル詳細
```ts
Tweet: a.model({
  content: a.string().required(),        // 140文字（フロントで制限）
  imagePaths: a.string().array(),
  author: a.string(),                    // 表示名
  authorId: a.string(),                  // Cognito User ID
  replyToId: a.id(),                     // リプライ元Tweet ID
  replyCount: a.integer().default(0),    // リプライ数（非正規化）
  favoriteCount: a.integer().default(0), // いいね数（非正規化）
  isHidden: a.boolean().default(false),  // ソフト削除
})
```

### 2.5 ストレージ（`amplify/storage/resource.ts`）
```ts
export const storage = defineStorage({
  name: "media",
  access: (allow) => ({
    "public/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read"]),
      allow.groups(["ADMINS"]).to(["read", "write", "delete"]),
    ],
    "members/{entity_id}/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],
    "feed/*": [
      allow.groups(["MEMBERS", "ADMINS"]).to(["read"]),
    ],
  }),
});
```


## 3. フロントエンド実装

### 3.1 Amplify初期化（`src/app/providers.tsx`）
```tsx
"use client";
import "@aws-amplify/ui-react/styles.css";
import { ThemeProvider, Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import { I18n } from "aws-amplify/utils";
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs, { ssr: true });
I18n.setLanguage("ja");

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <Authenticator.Provider>{children}</Authenticator.Provider>
    </ThemeProvider>
  );
}
```

### 3.2 会員レイアウト（招待制対応）

`src/app/app/layout.tsx`で以下を実装:
- 招待コード入力フィールド（サインアップ時）
- カスタム`handleSignUp`で`clientMetadata`に招待コードを含める
- 日本語ローカライズ
- パスワード要件の表示

### 3.3 ルーティング

| パス | 種別 | 説明 |
|------|------|------|
| `/` | 公開 | トップページ（Hero、News、CTA） |
| `/news/[id]` | 公開 | ニュース詳細 |
| `/app` | 会員 | ダッシュボード |
| `/app/tweet` | 会員 | 近況投稿 |
| `/app/favorites` | 会員 | お気に入り一覧 |
| `/app/board` | 会員 | 掲示板一覧 |
| `/app/board/[threadId]` | 会員 | スレッド詳細 |
| `/app/history` | 会員 | 歴史ページ |
| `/admin` | 管理者 | 管理ダッシュボード |
| `/admin/hero-slides` | 管理者 | スライド管理 |
| `/admin/site-config` | 管理者 | サイト設定 |
| `/admin/news` | 管理者 | ニュース管理 |
| `/admin/pages` | 管理者 | ページ管理 |
| `/admin/history` | 管理者 | 歴史管理 |


## 4. 招待コードの運用

### コードの変更方法

`amplify/auth/pre-sign-up/resource.ts`を編集:
```ts
environment: {
  INVITE_CODES: "CODE1,CODE2,CODE3",  // カンマ区切り
},
```

変更後は再デプロイが必要（`npx ampx sandbox` or GitHub push）。

### 本番環境での推奨設定

AWS Secrets Managerを使用:
```ts
environment: {
  INVITE_CODES: secret("INVITE_CODES"),
},
```


## 5. 開発コマンド

```sh
# ローカル開発
npm run dev

# Amplify Sandbox（バックエンド起動）
npx ampx sandbox

# 型チェック
npm run typecheck

# ビルド
npm run build

# テスト
npm run test
```


## 6. CI/CD（GitHub連携）

### `amplify.yml`
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - nvm install 20
        - nvm use 20
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - "**/*"
  cache:
    paths:
      - node_modules/**/*
```

### PRプレビュー
- Amplifyコンソールで「Web Previews」を有効化
- PR毎に一時バックエンドが自動生成
- PRクローズで自動削除


## 7. 権限とモデレーション

| 操作 | 一般会員 | 管理者(ADMINS) |
|------|----------|----------------|
| 投稿作成 | ○ | ○ |
| 自分の投稿編集/削除 | ○ | ○ |
| 他者の投稿削除 | × | ○ |
| 投稿の非表示(isHidden) | × | ○ |
| CMS編集(News/Page/History) | × | ○ |
| サイト設定変更 | × | ○ |
| 招待コード変更 | × | ○（デプロイ要） |


## 8. 今後の拡張候補

- [ ] 招待コードのDB管理化（管理画面から変更可能に）
- [ ] 画像のライフサイクル管理（不要オブジェクト削除Lambda）
- [ ] 二次索引追加（`owner`×`createdAt`）
- [ ] プッシュ通知


## 付記

- 本ドキュメントはAmplify Gen 2の仕様に基づく
- 破壊的変更があれば`npx ampx sandbox`で型を再生成
- テストファイルは`__tests__`ディレクトリに配置（Jest使用）
