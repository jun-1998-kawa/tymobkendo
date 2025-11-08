import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  // 140文字Tweet
  Tweet: a
    .model({
      content: a.string().required(), // 140文字制限はフロントエンドで実装
      imagePaths: a.string().array(),
      author: a.string(),
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
      title: a.string().required(),
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
      threadId: a.id().required(),
      body: a.string().required(),
      imagePaths: a.string().array(),
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
      year: a.integer().required(),
      title: a.string().required(),
      bodyMd: a.string().required(),
      imagePaths: a.string().array(),
      isPublic: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.guest().to(["read"]), // 公開分
      allow.groups(["MEMBERS"]).to(["read", "create", "update"]),
      allow.groups(["ADMINS"]), // 全権限（create, read, update, delete）
    ]),

  // CMSページ（slugで動的配信）
  Page: a
    .model({
      slug: a.string().required(),
      title: a.string().required(),
      bodyMd: a.string().required(),
      sections: a.string().array(),
      imagePaths: a.string().array(),
      isPublic: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.guest().to(["read"]), // 公開ページ
      allow.groups(["MEMBERS"]).to(["read"]), // 会員限定はisPublic=falseでUI側制御
      allow.groups(["ADMINS"]).to(["create", "update", "delete"]),
    ]),

  // ニュース・お知らせ（公開ページで表示）
  News: a
    .model({
      title: a.string().required(),
      excerpt: a.string().required(), // 一覧表示用の要約
      content: a.string().required(), // Markdown対応本文
      category: a.string().required(), // お知らせ、イベント、活動報告など
      publishedAt: a.datetime(),
      isPublished: a.boolean().default(false),
      isPinned: a.boolean().default(false),
      imagePaths: a.string().array(), // 画像パスの配列
    })
    .authorization((allow) => [
      allow.guest().to(["read"]), // 公開ページで誰でも閲覧可能
      allow.authenticated().to(["read"]),
      allow.groups(["ADMINS"]).to(["create", "update", "delete"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: { expiresInDays: 30 }
  }
});
