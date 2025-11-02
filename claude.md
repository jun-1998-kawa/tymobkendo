# Claude Code 実装ドキュメント（剣道部OB会サイト）

このドキュメントはClaude Codeが実装を進めるための具体的な手順書です。技術スタックはNext.js + TypeScript + AWS Amplify Gen 2（コードファーストBackend）を前提にします。要件は以下です。

- 非会員ページ（公開）
- 会員ページ（要ログイン）
  - 掲示板（スレッド＋投稿、リアルタイム更新）
  - Tweet機能（140文字、画像添付、本人の投稿一覧、削除）
  - 高校剣道部の歴史ページ（公開/会員限定の切替）
- 権限: 会員は投稿可／自分の投稿は編集・削除可／他者の強制削除とサイト主要コンテンツの更新は管理者（ADMINS）のみ
- HP主要コンテンツは「コード改修不要」でサイト上から更新可能（管理画面 + 生成フォーム）
- GitHub連携のCI/CD（PRプレビュー＝一時バックエンド含む）


## 0. 前提・バージョン

- Node.js: 20 もしくは 22（Amplify HostingのSSRランタイム要件に合わせる）
- Next.js: 14 以上（推奨 15）
- パッケージマネージャ: npm（pnpm/yarnでも可）


## 1. プロジェクト初期化

```sh
# Next.js アプリ作成（TypeScript, App Router, src構成）
npx create-next-app@latest ob-kendo \
  --ts --eslint --app --src-dir --import-alias "@/*"

cd ob-kendo

# Amplify Gen 2 フロント/バックエンド依存
npm i aws-amplify @aws-amplify/ui-react @aws-amplify/ui-react-storage
npm i -D @aws-amplify/backend @aws-amplify/backend-cli typescript

# ESMを明示（CDK依存を含むため）
npm pkg set type="module"
```

作成直後にGitHubリポジトリへ初回コミット・push（後述のCI/CDで使用）。


## 2. Amplify Backend ひな形

以下の4ファイルを作成します。

- `amplify/backend.ts`
- `amplify/auth/resource.ts`
- `amplify/data/resource.ts`
- `amplify/storage/resource.ts`

最小スケルトンは下記。必要に応じて後続タスクで詳細化します。

### 2.1 `amplify/backend.ts`
```ts
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";

export const backend = defineBackend({ auth, data, storage });
```

### 2.2 `amplify/auth/resource.ts`
```ts
import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: { email: true },
  groups: ["MEMBERS", "ADMINS"],
  // 備考: 新規ユーザーのグループ付与は運用（管理者が昇格）で行う
});
```

### 2.3 `amplify/data/resource.ts`
```ts
import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  // 140文字Tweet
  Tweet: a
    .model({
      content: a
        .string()
        .validate((v) => v.maxLength(140, "140文字以内で入力してください")),
      imagePaths: a.string().array().optional(),
      author: a.string().optional(),
      isHidden: a.boolean().default(false), // ADMINSが強制非表示にする用途（soft delete）
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read"]),
      allow.owner(), // 自分のupdate/delete
      allow.groups(["ADMINS"]).to(["update", "delete"]),
    ]),

  // 掲示板スレッド
  BoardThread: a
    .model({
      title: a.string().validate((v) => v.minLength(1)),
      pinned: a.boolean().default(false),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read", "create"]),
      allow.owner(),
      allow.groups(["ADMINS"]).to(["update", "delete"]),
    ]),

  // 掲示板メッセージ
  BoardMessage: a
    .model({
      threadId: a.id(),
      body: a.string().validate((v) => v.minLength(1)),
      imagePaths: a.string().array().optional(),
      isHidden: a.boolean().default(false),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read", "create"]),
      allow.owner(),
      allow.groups(["ADMINS"]).to(["update", "delete"]),
    ]),

  // 歴史エントリ（公開/会員限定）
  HistoryEntry: a
    .model({
      year: a.integer(),
      title: a.string(),
      bodyMd: a.string(),
      imagePaths: a.string().array().optional(),
      isPublic: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.guest().to(["read"]), // 公開分
      allow.groups(["MEMBERS", "ADMINS"]).to(["read", "create", "update"]),
      allow.groups(["ADMINS"]).to(["delete"]),
    ]),

  // CMSページ（slugで動的配信）
  Page: a
    .model({
      slug: a.string(),
      title: a.string(),
      bodyMd: a.string(),
      sections: a.string().array().optional(),
      imagePaths: a.string().array().optional(),
      isPublic: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.guest().to(["read"]), // 公開ページ
      allow.groups(["MEMBERS"]).to(["read"]), // 会員限定はisPublic=falseでUI側制御
      allow.groups(["ADMINS"]).to(["create", "update", "delete"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({ schema });
```

> メモ: `allow.owner()`は作成ユーザーに対するCRUDを付与します。管理者`ADMINS`は他者投稿の強制非表示(`isHidden`)や削除が可能です。

### 2.4 `amplify/storage/resource.ts`
```ts
import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "media",
  access: (allow) => ({
    // 公開アセット（ヒーロー画像等）
    "public/*": [allow.guest.to(["read"]), allow.authenticated.to(["read"])],

    // 会員の投稿画像（本人RWX、会員は閲覧）
    "members/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
      allow.groups(["MEMBERS", "ADMINS"]).to(["read"]),
    ],

    // 掲示板/Tweetの共通参照用（必要に応じて使用）
    // 注意: パス定義は1段ネスト/競合禁止の制約あり
    "feed/*": [allow.groups(["MEMBERS", "ADMINS"]).to(["read"])],
  }),
});
```


## 3. ローカルSandbox

```sh
# 初回は型生成と一時環境のプロビジョニングが走る
npx ampx sandbox
# 終了は Ctrl+C、完全削除は
# npx ampx sandbox delete
```

実行後に生成される`amplify_outputs.json`をフロントで読み込みます。


## 4. フロント実装（骨組み）

### 4.1 Amplify初期化とUI
- `src/app/providers.tsx`を作成し、以下を設定:
  - `"use client"`宣言
  - `Amplify.configure(outputs)`（`amplify_outputs.json`）
  - `<ThemeProvider>`/`<Authenticator.Provider>`ラップ
- グローバルCSSに`@aws-amplify/ui-react/styles.css`を取込

### 4.2 ルーティング案（App Router）
- 公開: `/`（LP）, `/about`, `/contact`, `/history`（公開分）, `/pages/[slug]`
- 会員: `/app`（ダッシュボード）, `/app/tweet`, `/app/board`, `/app/board/[threadId]`, `/app/history`（会員限定）
- 管理: `/admin`配下にCMS・モデレーション（`ADMINS`のみ）

### 4.3 Tweetページ最小要件
- 入力: 140文字カウンタ＋エラーメッセージ
- 画像: `<FileUploader acceptedFileTypes={["image/*"]} />` または `uploadData({ path, data:file })`
- 作成: `client.models.Tweet.create`
- 一覧: `client.models.Tweet.observeQuery()`でリアルタイム取得
- 自分の投稿: 所有者フィルタ（`owner`×`createdAt`の並び替えは必要に応じて二次索引を追加）
- 削除: `Tweet.delete`（本人 or `ADMINS`）／非表示は`update({ isHidden:true })`

### 4.4 掲示板
- スレ作成: `BoardThread.create`
- 投稿: `BoardMessage.create({ threadId, body, ... })`
- 一覧/詳細: `observeQuery`＋ページネーション
- モデレート: `ADMINS`のみ`delete`/`isHidden`更新

### 4.5 歴史・ページ（CMS）
- `HistoryEntry`/`Page`をDBから読み取って描画。
- `isPublic`で公開/会員限定を切替（公開ページはゲスト可）。


## 5. 生成フォーム（コード改修不要の更新）

サイト内管理画面でCRUD可能にするため、Connected Formsを生成して組み込みます。

```sh
# モデルに対応するフォーム群を生成
npx ampx generate forms
```

- 生成先 `src/ui-components/*Form.tsx` を `/admin`配下にインポートし、フォームの`onSuccess`でトースト表示/リダイレクト。
- バリデーションはフォーム標準機能＋スキーマ側`validate`で二重化。
- アクセス制御はレイアウトでグループチェック（`useAuthenticator`で`cognito:groups`を確認し`ADMINS`のみ表示）。


## 6. フロント実装（コード断片サンプル）

### 6.1 Amplify設定
```ts
// src/app/providers.tsx
"use client";
import "@aws-amplify/ui-react/styles.css";
import { ThemeProvider, Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

Amplify.configure(outputs);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Authenticator.Provider>{children}</Authenticator.Provider>
    </ThemeProvider>
  );
}
```

### 6.2 会員レイアウト（ガード）
```tsx
// src/app/(members)/layout.tsx
"use client";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div>
          <header>
            <span>{user?.signInDetails?.loginId}</span>
            <button onClick={signOut}>Sign out</button>
          </header>
          <main>{children}</main>
        </div>
      )}
    </Authenticator>
  );
}
```

### 6.3 Tweetページの要点
```tsx
// src/app/(members)/tweet/page.tsx
"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { FileUploader } from "@aws-amplify/ui-react-storage";

const client = generateClient<Schema>();

type Tweet = Schema["Tweet"]["type"];

export default function TweetPage() {
  const [content, setContent] = useState("");
  const [tweets, setTweets] = useState<Tweet[]>([]);

  useEffect(() => {
    const sub = client.models.Tweet.observeQuery().subscribe({
      next: ({ items }) => setTweets(items.filter((t) => !t.isHidden)),
    });
    return () => sub.unsubscribe();
  }, []);

  const max = 140;
  const disabled = content.length === 0 || content.length > max;

  return (
    <div>
      <h2>近況を投稿</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={max}
      />
      <div>{content.length}/{max}</div>
      <FileUploader
        acceptedFileTypes={["image/*"]}
        maxFileCount={4}
        // onUploadSuccess でパスを保持して create 時に渡す
      />
      <button
        disabled={disabled}
        onClick={async () => {
          await client.models.Tweet.create({ content });
          setContent("");
        }}
      >投稿</button>

      <h3>最新</h3>
      <ul>
        {tweets.map((t) => (
          <li key={t.id}>
            <p>{t.content}</p>
            <button onClick={() => client.models.Tweet.delete({ id: t.id })}>削除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```


## 7. CI/CD（GitHub連携とPRプレビュー）

1. リポジトリをGitHubに作成し`main`へpush
2. Amplifyコンソールで「GitHub接続」→ 対象ブランチを選択
3. Web Previews（PRプレビュー）を有効化（プライベートRepo推奨）。PR毎に一時バックエンドが自動生成され、クローズで削除。
4. Nodeランタイムは20/22を選択（または`amplify.yml`/`.nvmrc`で指定）。

`amplify.yml`の一例（Node 20指定）:
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


## 8. 権限とモデレーション運用

- 会員は投稿可（`authenticated`）。自分の投稿は編集・削除可（`owner`）。
- 管理者は他者投稿の`delete`/`update`可（`ADMINS`）。強制削除の代替として`isHidden`での非表示（soft delete）を推奨。
- 画像は`members/{entity_id}/*`で本人RWX、会員は閲覧のみ。パス定義の制約（1段ネスト、`*`と`{entity_id}`の競合禁止）に注意。


## 9. テスト観点（最小）

- 非会員でも公開ページ/画像へアクセスできる
- 会員のみ会員ページへアクセスできる（Authenticatorでガード）
- Tweet: 140文字バリデーションがUI/サーバの双方で有効
- 掲示板: スレ/投稿がリアルタイム反映、本人以外の削除不可、管理者は可能
- 管理画面: `ADMINS`のみ表示、`Page`/`HistoryEntry`のCRUDがサイト上で完結


## 10. 次の実装タスク（Claude向け）

1) 章「2. Amplify Backend ひな形」の4ファイルを生成し、`npx ampx sandbox`で疎通確認。
2) `src/app/providers.tsx`と`(members)/layout.tsx`を追加し、公開/会員/管理のルーティングを作成。
3) `Tweet`/`BoardThread`/`BoardMessage`/`HistoryEntry`/`Page`の最小ページを作成。
4) `npx ampx generate forms`でフォーム生成し、`/admin`に組み込む。
5) GitHubにpush→Amplify接続→PRプレビューON→Node 20指定。


## 付記
- 画像のライフサイクル（不要オブジェクト掃除）は後続でLambda追加検討（任意）。
- 必要に応じて二次索引を追加（例: `owner`×`createdAt`）して一覧性能を最適化。
- 本ドキュメントはAmplify Gen 2の仕様に基づく。破壊的変更があれば生成コマンドや型の再生成を実施してください。

