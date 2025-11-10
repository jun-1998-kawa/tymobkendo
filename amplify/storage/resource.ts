import { defineStorage } from "@aws-amplify/backend";

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

    // 会員の投稿画像（本人RWX、会員は読み書き削除可能）
    "members/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
      allow.groups(["MEMBERS", "ADMINS"]).to(["read", "write", "delete"]),
    ],

    // 掲示板/Tweetの共通参照用（必要に応じて使用）
    // 注意: パス定義は1段ネスト/競合禁止の制約あり
    "feed/*": [allow.groups(["MEMBERS", "ADMINS"]).to(["read"])],
  }),
});
