import { defineStorage } from "@aws-amplify/backend";

/**
 * S3ストレージ設定
 *
 * 注意事項:
 * - `{entity_id}` を使用したオーナーベースのアクセス制御は、
 *   Amplify Gen 2のバグ (GitHub Issue #1771) により、グループ権限と
 *   競合するため使用していません。
 *   参照: https://github.com/aws-amplify/amplify-backend/issues/1771
 *
 * - 現在の `members/*` 設定では、認証済みユーザー全員が他のユーザーの
 *   ファイルにもアクセス可能です。OB会サイトの特性上、会員間の
 *   コンテンツ共有を許容する設計としています。
 *
 * - 将来的にユーザー単位のアクセス制御が必要な場合は、Issue #1771の
 *   解決を待つか、Lambda@Edgeによるカスタム認可を検討してください。
 */
export const storage = defineStorage({
  name: "media",
  access: (allow) => ({
    // 公開アセット（ヒーロー画像、ニュース画像等）
    // 誰でも読み取り可能、管理者のみ書き込み・削除可能
    "public/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read"]),
      allow.groups(["ADMINS"]).to(["read", "write", "delete"]),
    ],

    // 会員の投稿画像（認証済みユーザー全員が読み書き可能）
    // 注: {entity_id} は Issue #1771 のため使用不可
    "members/*": [
      allow.authenticated.to(["read", "write", "delete"]),
      allow.groups(["ADMINS"]).to(["read", "write", "delete"]),
      allow.groups(["MEMBERS"]).to(["read", "write", "delete"]),
    ],

    // 掲示板/Tweetの共通参照用（必要に応じて使用）
    // 注意: パス定義は1段ネスト/競合禁止の制約あり
    "feed/*": [allow.groups(["MEMBERS", "ADMINS"]).to(["read"])],
  }),
});
