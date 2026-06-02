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

# テスト（1回実行）
npm run test

# テスト（ウォッチ＝TDD推奨）
npm run test:watch

# カバレッジ計測（しきい値70%）
npm run test:coverage
```


## 6. TDD 開発フロー（テスト駆動開発）

このプロジェクトは **テスト駆動開発（TDD）を標準フロー** とする。新機能の追加・既存ロジックの変更・バグ修正はすべて、原則として **テストを先に書いてから実装** する。

### 6.0 大原則

- **テストを書かずに実装コードを書き始めない。** まず「期待する振る舞い」をテストで表現する。
- **小さく回す。** 1つの振る舞い → 失敗するテスト → 最小実装 → リファクタ、を細かく繰り返す。
- **テストは仕様書。** テスト名（`it`/`test` の説明）は日本語で「何ができるべきか」を述べる。
- **CI が緑であることを完了条件とする。** `typecheck` / `lint` / `test` がすべて通って初めて「実装完了」。

### 6.1 Red → Green → Refactor サイクル

```
┌─────────────────────────────────────────────────────────┐
│ 1. RED   : 失敗するテストを書く                          │
│            ・期待する振る舞いを1つだけテストに書く       │
│            ・`npm run test:watch` で「赤」を確認する     │
│            ・テストが失敗する理由が正しいことを確認      │
│                          ↓                              │
│ 2. GREEN : テストを通す最小限の実装を書く                │
│            ・とにかく緑にすることを優先（雑でよい）      │
│            ・余計な実装・将来用の汎用化はしない          │
│                          ↓                              │
│ 3. REFACTOR : 緑を保ったまま整理する                     │
│            ・重複除去・命名改善・型の厳密化              │
│            ・テストが緑のままであることを都度確認        │
│            ・必要なら型チェック/lintも実行              │
└─────────────────────────────────────────────────────────┘
        ↑__________________ 次の振る舞いへ ________________│
```

### 6.2 具体的な手順（Claude Code が従う手順）

1. **要件を振る舞いに分解する。** 「○○できる」「○○のときエラーになる」など、テスト可能な単位に箇条書きする。
2. **テストファイルを作成/追記する。**
   - 配置: 対象コードと同階層の `__tests__/` ディレクトリ（例: `src/app/app/tweet/__tests__/page.test.tsx`）。
   - 命名: `*.test.ts` / `*.test.tsx`。
3. **RED:** `npm run test:watch` を起動し、新しいテストが **失敗する** ことを確認する。
4. **GREEN:** 実装コードを書き、対象テストを通す。
5. **REFACTOR:** テストを緑に保ったままコードを整理する。
6. **回帰確認:** `npm run test` で全テストを実行し、既存テストを壊していないか確認する。
7. **仕上げ:** `npm run typecheck` と `npm run lint` を実行して緑にする。
8. **カバレッジ確認（必要に応じて）:** `npm run test:coverage`。グローバルしきい値は **70%**（`jest.config.ts` の `coverageThreshold`）。下回る変更は原則マージしない。

### 6.3 テストの書き方（このリポジトリの規約）

- **フレームワーク:** Jest + React Testing Library（`@testing-library/react` / `user-event`）。設定は `jest.config.ts`、共通モックは `jest.setup.tsx`。
- **ユーザー視点で検証する。** `getByRole` / `getByText` / `findBy*` を優先し、実装詳細（内部 state や class 名）に依存しない。
- **Amplify は常にモックする。** `jest.setup.tsx` で `aws-amplify` / `aws-amplify/data` / `aws-amplify/storage` / `aws-amplify/auth` をモック済み。各テストでは `generateClient` の `models.*`（`observeQuery` / `create` / `update` / `delete`）をケースごとに上書きする。
- **`amplify_outputs.json` はモックに差し替え済み**（`src/test-utils/amplifyOutputsMock.json`）。テスト内で本物を読み込まない。
- **非同期 UI は `findBy*` / `waitFor` で待つ。** `observeQuery` の購読は `subscribe` のコールバックに `next({ items: [...] })` を渡して初期データを流すパターンを踏襲する。
- **後始末:** `beforeEach` で `jest.clearAllMocks()`。購読の `unsubscribe` が呼ばれることもテスト対象にしてよい。
- **AAA で書く:** Arrange（準備・モック設定）→ Act（描画・操作）→ Assert（検証）。

#### テストの雛形（コンポーネント）
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateClient } from 'aws-amplify/data';
import TargetPage from '../page';

jest.mock('aws-amplify/data');
const mockGenerateClient = generateClient as jest.MockedFunction<typeof generateClient>;

describe('対象機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateClient.mockReturnValue({
      models: {
        Tweet: {
          observeQuery: jest.fn().mockReturnValue({
            subscribe: (cb: any) => {
              setTimeout(() => cb.next({ items: [] }), 0);
              return { unsubscribe: jest.fn() };
            },
          }),
          create: jest.fn().mockResolvedValue({ data: { id: 'x' } }),
        },
      },
    } as any);
  });

  it('140文字を超える投稿はできない', async () => {
    // Arrange
    render(<TargetPage />);
    // Act
    await userEvent.type(screen.getByRole('textbox'), 'あ'.repeat(141));
    // Assert
    expect(screen.getByRole('button', { name: /投稿/ })).toBeDisabled();
  });
});
```

#### テストの雛形（純粋関数 / hook）
```ts
import { formatDate } from '@/utils/dateFormatter';

describe('formatDate', () => {
  it('ISO文字列を日本語表記に変換する', () => {
    expect(formatDate('2026-06-02T00:00:00Z')).toBe('2026年6月2日');
  });
});
```

### 6.4 バグ修正の TDD

1. **まずバグを再現する失敗テストを書く**（修正前は必ず赤になることを確認）。
2. 修正を入れてテストを緑にする。
3. そのテストは回帰防止として残す。

### 6.5 不変条件（必ずテストで守る項目）

実装変更時、以下のドメイン不変条件はテストで担保すること（`§2.4` / `§7` 参照）:

- Tweet 本文は **140文字** を超えて投稿できない。
- 自分の投稿のみ編集・削除でき、他者の投稿の削除・`isHidden` 化は **ADMINS のみ**。
- CMS（News / Page / HistoryEntry / SiteConfig / HeroSlide）の更新は **ADMINS のみ**。
- 招待コードが無効/未入力の場合はサインアップが拒否される（`pre-sign-up` ハンドラ）。

### 6.6 完了の定義（Definition of Done）

- [ ] 追加/変更した振る舞いに対応するテストがある
- [ ] `npm run test` が全件パス
- [ ] `npm run typecheck` がパス
- [ ] `npm run lint` がパス
- [ ] カバレッジがしきい値（70%）を下回っていない

### 6.7 自動オーケストレーション（フック）

このTDDフローは手動運用に頼らず、ハーネスのフックで毎ターン自動的に駆動される。

- 仕組み: `.claude/settings.json` の `UserPromptSubmit` フックが、プロンプト送信のたびに
  `.claude/tdd-directive.md` の内容をコンテキストへ自動注入する。
- 効果: コードを書く依頼では、メインの応答者が自動的に `tdd-orchestrator` として振る舞い、
  Agent ツールで `test-author`（RED）・`coverage-guard`（検証）などのサブエージェントへ委譲する。
- 対象外: 質問・調査・設定変更・ドキュメントのみの依頼ではTDDフローはスキップされる（指示文内で判断）。
- 反映: `.claude/settings.json` を新規作成した直後のセッションではフック監視が効かない場合がある。
  `/hooks` を一度開く（設定再読込）か、セッションを再起動すると有効になる。
- 無効化/編集: `/hooks` メニューから確認・編集・一時停止が可能。フック全停止は設定の `disableAllHooks`。


## 7. CI/CD（GitHub連携）

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


## 8. 権限とモデレーション

| 操作 | 一般会員 | 管理者(ADMINS) |
|------|----------|----------------|
| 投稿作成 | ○ | ○ |
| 自分の投稿編集/削除 | ○ | ○ |
| 他者の投稿削除 | × | ○ |
| 投稿の非表示(isHidden) | × | ○ |
| CMS編集(News/Page/History) | × | ○ |
| サイト設定変更 | × | ○ |
| 招待コード変更 | × | ○（デプロイ要） |


## 9. 今後の拡張候補

- [ ] 招待コードのDB管理化（管理画面から変更可能に）
- [ ] 画像のライフサイクル管理（不要オブジェクト削除Lambda）
- [ ] 二次索引追加（`owner`×`createdAt`）
- [ ] プッシュ通知


## 付記

- 本ドキュメントはAmplify Gen 2の仕様に基づく
- 破壊的変更があれば`npx ampx sandbox`で型を再生成
- テストファイルは`__tests__`ディレクトリに配置（Jest使用）
