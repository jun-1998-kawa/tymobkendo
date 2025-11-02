# Sub-Agents 設計（剣道部OB会サイト）

目的: 実装と運用を効率化するため、Claude Codeを中心に補助する自動化サブエージェント（GitHub Actions / AWS側ワークフロー）を定義します。各エージェントは最小権限・疎結合で導入し、Amplify Gen 2の最新仕様に準拠します。

- ランタイム要件（Amplify Hosting SSR）: Node.js 20/22 を使用（2025-09-15以降 14/16/18は非対応）。[ref]
- PRごとのフルスタックプレビュー（プライベートRepo）を有効化。[ref]
- 画像アップロードは`FileUploader`（旧`StorageManager`改名）を使用。[ref]
- フォームはConnected FormsをCLIで生成（`npx ampx generate forms`）。[ref]
- Storageの所有者スコープは`{entity_id}`で実現。[ref]
- 一覧のリアルタイムは`observeQuery`を推奨。[ref]

refs:
- SSR Node要件/サポート: docs.aws.amazon.com/amplify ... ssr-supported-features, troubleshooting-SSR
- PR Previews: docs.amplify.aws ... pr-previews, docs.aws.amazon.com ... pr-previews
- FileUploader: ui.docs.amplify.aws ... storage/fileuploader
- Connected Forms: docs.amplify.aws ... build-ui/formbuilder
- Storage認可:`{entity_id}`: docs.amplify.aws ... storage/authorization
- observeQuery: docs.amplify.aws ... subscribe-data


## A. エージェント一覧

1) Amplify Orchestrator（開発フロー支援）
- 役割: Gen 2のサンドボックス運用と出力同期。
- トリガ: ローカル開発/PRレビュー。
- アクション:
  - `npx ampx sandbox`で個人用クラウド環境起動。
  - `amplify_outputs.json`の生成/同期。
- 期待効果: バックエンド変更の即時反映と型生成。[ref: sandbox]

2) Schema/AuthZ Guard（権限・バリデーションの回 regres 防止）
- 役割: `amplify/data/resource.ts`や`storage/resource.ts`の差分をLint/レビュー。
- トリガ: PR。
- アクション（CIで実施）:
  - `allow.authenticated/owner/groups`の方針逸脱検出（例: `guest`に`write`が付与された等）。
  - `Tweet.content`の`maxLength(140)`の存在チェック。
  - Storageパス競合/多段ネストの検知（Gen 2制約）。

3) Content Ops（CMS更新/フォーム配備）
- 役割: `Page`/`HistoryEntry`のCRUDをサイトから可能にする。
- トリガ: 管理画面配備/モデル更新時。
- アクション:
  - `npx ampx generate forms`でConnected Formsを生成し`/admin`に組込み。
  - モデル更新時のフォーム再生成を案内（差分バックアップ）。[ref]

4) Moderation Gate（投稿モデレーション）
- 役割: 画像・テキストの不適切コンテンツを検知し自動で`isHidden`に設定（ソフト非表示）。
- トリガ: S3アップロードイベント or Tweet/BoardMessage作成イベント。
- 実装例:
  - S3 -> Lambda(画像: Rekognition)、テキスト: Comprehend（オプション）→ 判定スコア閾値で`isHidden=true`更新。
  - 監査用に`ModerationLog`モデルを追加（任意）。

5) Image Pipeline（最適化/サムネイル）
- 役割: 投稿画像のサムネイル/WEBP生成とメタ更新。
- トリガ: S3 Put 画像。
- アクション: Lambda（Sharp）で`members/{entity_id}/thumbs/*`に生成、元キーにメタ付与。
- 備考: Next.jsのImage最適化はAmplify Hosting側で対応可。[ref: SSR image]

6) Release Manager（CI/CD）
- 役割: Node 20/22の固定、型チェック/ビルド、PRプレビュー案内。
- トリガ: push/PR。
- アクション:
  - Node 20をセットアップ、`npm ci && npm run build`。
  - 必要に応じ`npx ampx generate outputs --branch dev app-id $AWS_APP_ID`でプレビューを既存Backendに指向。[ref: fullstack previews]

7) Retention & Cleanup（S3クリーンアップ）
- 役割: 削除Tweet/BoardMessageに紐づかない孤児画像の定期削除。
- トリガ: EventBridge スケジュール（毎日）。
- アクション: Lambdaで参照整合性を走査し、期限超過オブジェクトを削除。


## B. 実装ロードマップ（Claude向け）

- 0) 既存リポに`.github/workflows/ci.yml`を配置（下記雛形）。
- 1) `amplify/*`の雛形生成後、Schema/AuthZ Guardのルール（eslint-plugin風スクリプト）を追加。
- 2) `/admin`配下にConnected Formsを配置し、`ADMINS`ガードを実装。
- 3) S3アップロードトリガのModeration/Image LambdaをCDK追加（後続タスク）。
- 4) Amplify ConsoleでPRプレビューON、必要なら「既存Backendを共有」設定に切替。[ref]


## C. GitHub Actions 雛形

`.github/workflows/ci.yml` を同梱。Node 20固定、モノレポ/未作成状態でも落ちにくい防御を実装。

```yaml
name: ci
on:
  push:
    branches: [ main ]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install
        if: hashFiles('package.json') != ''
        run: npm ci

      - name: Type Check
        if: "hashFiles('tsconfig.json') != ''"
        run: npm run -s typecheck || true

      - name: Lint
        run: npm run -s lint || true

      - name: Build
        run: npm run -s build || true
```

> 備考: 実アプリ追加後に`typecheck/lint/build`の存在を前提に厳格化してください。


## D. 成功条件（モニタリング）
- PR作成時にAmplifyのボットがプレビューURLをコメントする（プライベートRepo）。[ref]
- 画像アップロード直後にサムネ生成が反映、NG画像は`isHidden`になり一覧に出ない。
- 管理画面から`Page`/`HistoryEntry`の更新が可能（コード改修不要）。

---

注釈（出典）:
- Node 20/22 要件: https://docs.aws.amazon.com/amplify/latest/userguide/ssr-supported-features.html, https://docs.aws.amazon.com/amplify/latest/userguide/troubleshooting-SSR.html
- PR Previews: https://docs.amplify.aws/react/deploy-and-host/fullstack-branching/pr-previews/, https://docs.aws.amazon.com/amplify/latest/userguide/pr-previews.html
- FileUploader: https://ui.docs.amplify.aws/react/connected-components/storage/fileuploader
- Connected Forms: https://docs.amplify.aws/react/build-ui/formbuilder/
- Storage `{entity_id}`: https://docs.amplify.aws/javascript/build-a-backend/storage/authorization/
- observeQuery: https://docs.amplify.aws/react/build-a-backend/data/subscribe-data/

