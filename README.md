# 剣道部OB会サイト

AWS Amplify Gen 2 + Next.js (App Router) + TypeScript で構築された剣道部OB会の公式サイトです。

## 機能

### 公開機能
- トップページ
- 歴史ページ（公開分）
- 動的ページ（CMSで管理）

### 会員機能（要ログイン）
- **Tweet**: 140文字で近況を投稿（画像添付対応予定）
- **掲示板**: スレッド形式の掲示板
- **歴史**: 高校剣道部の歴史（会員限定含む）

### 管理者機能（ADMINS グループ）
- ページ・歴史エントリーのCRUD（Connected Forms）
- 他者投稿の削除・非表示

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React 19, TypeScript
- **バックエンド**: AWS Amplify Gen 2 (Auth, Data, Storage)
- **CI/CD**: GitHub Actions → Amplify Hosting
- **Node.js**: 20 または 22

## プロジェクト構成

```
.
├── amplify/               # Amplify Gen 2 バックエンド定義
│   ├── backend.ts
│   ├── auth/resource.ts
│   ├── data/resource.ts   # Data models & authorization
│   └── storage/resource.ts
├── src/
│   └── app/
│       ├── (members)/app/ # 会員専用ページ
│       │   ├── tweet/
│       │   ├── board/
│       │   └── history/
│       ├── layout.tsx
│       ├── page.tsx       # トップページ
│       └── providers.tsx  # Amplify設定
├── tools/                 # CI用ツール
│   └── schema-authz-guard.cjs
├── .github/workflows/ci.yml
└── package.json
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Amplify Sandbox の起動

```bash
npx ampx sandbox
```

初回起動時に以下が自動生成されます：
- `amplify_outputs.json`（Amplifyの設定ファイル）
- 型定義（Data models用）
- 一時的なAWSバックエンド環境

### 3. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 にアクセスします。

## コマンド

```bash
npm run dev         # 開発サーバー起動
npm run build       # プロダクションビルド
npm run start       # プロダクションサーバー起動
npm run lint        # ESLint実行
npm run typecheck   # TypeScript型チェック
```

## バックエンド（Amplify Gen 2）

### 認証
- Email + Password
- グループ: `MEMBERS`, `ADMINS`

### データモデル
- **Tweet**: 140文字投稿（owner/ADMINS権限）
- **BoardThread**: 掲示板スレッド
- **BoardMessage**: 掲示板メッセージ
- **HistoryEntry**: 歴史エントリー（公開/会員限定）
- **Page**: 動的CMSページ

### ストレージ
- `public/*`: 公開アセット（ヒーロー画像等）
- `members/{entity_id}/*`: 会員の投稿画像（本人RWX、会員閲覧可）

## CI/CD

GitHub Actions でビルド・型チェック・schema-authz-guard を実行します。

### PR プレビュー

Amplify Hosting の PR Previews を有効化すると、PR毎に一時バックエンド環境が自動生成されます。

```bash
# amplify.yml で Node 20 を指定
nvm install 20
nvm use 20
```

## 権限ポリシー

- **会員（MEMBERS）**: 投稿可、自分の投稿は編集・削除可
- **管理者（ADMINS）**: 他者投稿の削除・非表示、HP主要コンテンツの更新

## 開発ガイドライン

### 型安全性

Amplify Sandbox起動後、以下のTODOコメントがあるファイルで型を修正してください：

```ts
// TODO: After running `npx ampx sandbox`, replace `any` with proper types from Schema
```

### バリデーション

- **Tweet**: 140文字制限（フロントエンド実装済み）
- **認可ルール**: `tools/schema-authz-guard.cjs` で自動チェック

### サブエージェント

`.claude/agents/` 配下に以下のサブエージェントが定義されています：

- `controller`: プロジェクトオーケストレーター
- `amplify-orchestrator`: Amplify Gen 2 セットアップ
- `schema-authz-guard`: 認可ルール検証
- `content-ops-cms`: CMS管理
- その他（モデレーション、画像最適化、リリース管理等）

詳細は `sub-agents.md` と `CLAUDE.md` を参照してください。

## トラブルシューティング

### amplify_outputs.json が見つからない

```bash
npx ampx sandbox
```

を実行して、バックエンド環境を起動してください。

### 型エラーが発生する

Sandbox起動後、生成された型定義を使用するようにコードを更新してください（TODOコメント参照）。

### ビルドエラー

```bash
npm run typecheck  # 型チェック
npm run lint       # リント
node tools/schema-authz-guard.cjs  # 認可ルールチェック
```

## ライセンス

Private（剣道部OB会専用）
