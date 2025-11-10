import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  // 140文字Tweet
  Tweet: a
    .model({
      content: a.string().required(), // 140文字制限はフロントエンドで実装
      imagePaths: a.string().array(),
      author: a.string(), // Cognitoの表示名（姓名）を保存
      authorId: a.string(), // Cognito User ID（検索用）
      replyToId: a.id(), // リプライ元のTweet ID（nullの場合は元投稿）
      replyCount: a.integer().default(0), // リプライの数（非正規化）
      favoriteCount: a.integer().default(0), // いいね数（非正規化）
      isHidden: a.boolean().default(false), // ADMINSが強制非表示にする用途（soft delete）
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read"]),
      allow.owner(), // 自分のupdate/delete
      allow.groups(["ADMINS"]).to(["update", "delete"]),
    ]),

  // Favorite（いいね）
  Favorite: a
    .model({
      tweetId: a.id().required(), // いいねされたTweet ID
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read"]),
      allow.owner().to(["delete"]), // 自分のいいねは削除可能
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
      authorId: a.string(), // 投稿者のUser ID（画像パス用）
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

  // ヒーロースライド（Phase 2: スライドショー高度化）
  HeroSlide: a
    .model({
      order: a.integer().required(), // 表示順序（昇順）
      mediaPath: a.string().required(), // 画像 or 動画のS3パス
      mediaType: a.enum(["image", "video"]), // メディアタイプ
      title: a.string(), // スライドごとのタイトル（オプション）
      subtitle: a.string(), // サブタイトル（オプション）
      isActive: a.boolean().default(true), // 表示/非表示
      kenBurnsEffect: a.boolean().default(false), // Ken Burnsエフェクト有効化
    })
    .authorization((allow) => [
      allow.guest().to(["read"]), // 公開ページで誰でも閲覧可能
      allow.authenticated().to(["read"]),
      allow.groups(["ADMINS"]).to(["create", "update", "delete"]),
    ]),

  // サイト設定（トップページのコンテンツ管理）
  SiteConfig: a
    .model({
      // Heroセクション
      heroTitle: a.string().required(),
      heroSubtitle: a.string().required(),
      heroImagePath: a.string(), // S3のパス（後方互換性のため残す、非推奨）
      heroImagePaths: a.string().array(), // 複数画像パス（スライドショー用、Phase 1）
      heroSlideInterval: a.integer().default(6000), // スライド切替間隔（ms）
      useHeroSlides: a.boolean().default(false), // HeroSlideモデルを使用するか（Phase 2）

      // Welcomeセクション
      welcomeTitle: a.string().required(),
      welcomeBody: a.string().required(),

      // Features（JSON文字列で配列管理）
      // [{icon: "💬", title: "近況投稿", description: "..."}]
      featuresJson: a.string().required(),

      // CTAセクション
      ctaTitle: a.string().required(),
      ctaBody: a.string().required(),

      // フッター
      footerCopyright: a.string().required(),

      // 管理用
      isActive: a.boolean().default(true), // アクティブな設定（1レコードのみ想定）
    })
    .authorization((allow) => [
      allow.guest().to(["read"]), // トップページは誰でも閲覧可能
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
