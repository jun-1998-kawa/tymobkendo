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
      author: a.string(), // 投稿者の表示名（Cognito の姓名キャッシュ）
      authorId: a.string(), // 投稿者のUser ID（画像パス・権限判定用）
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
      videoPaths: a.string().array(), // 動画パスの配列
      isPublic: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read"]), // ログイン済みユーザー全員が読み取り可能
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
      videoPaths: a.string().array(), // 動画パスの配列
      isPublic: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.guest().to(["read"]), // 未ログインユーザーは Identity Pool guest credentials で read
      // ログイン中のユーザーが公開ページ（identityPool authMode）から読む場合は
      // IAM の認証済みロールになるため、明示的に read を許可する。
      allow.authenticated("identityPool").to(["read"]),
      allow.groups(["MEMBERS"]).to(["read"]),
      allow.groups(["ADMINS"]).to(["create", "update", "delete"]),
    ]),

  // ニュース・お知らせ（公開ページで表示）
  News: a
    .model({
      title: a.string().required(),
      excerpt: a.string().required(),
      content: a.string().required(),
      category: a.string().required(),
      publishedAt: a.datetime(),
      isPublished: a.boolean().default(false),
      isPinned: a.boolean().default(false),
      imagePaths: a.string().array(),
      videoPaths: a.string().array(),
    })
    .authorization((allow) => [
      allow.guest().to(["read"]),
      allow.authenticated().to(["read"]),
      // 公開ページ（identityPool authMode）からログイン中ユーザーが読む場合用
      allow.authenticated("identityPool").to(["read"]),
      allow.groups(["ADMINS"]).to(["create", "update", "delete"]),
    ]),

  // ヒーロースライド（Phase 2: スライドショー高度化）
  HeroSlide: a
    .model({
      order: a.integer().required(),
      mediaPath: a.string().required(),
      mediaType: a.enum(["image", "video"]),
      title: a.string(),
      subtitle: a.string(),
      isActive: a.boolean().default(true),
      kenBurnsEffect: a.boolean().default(false),
    })
    .authorization((allow) => [
      allow.guest().to(["read"]),
      allow.authenticated().to(["read"]),
      // 公開ページ（identityPool authMode）からログイン中ユーザーが読む場合用
      allow.authenticated("identityPool").to(["read"]),
      allow.groups(["ADMINS"]).to(["create", "update", "delete"]),
    ]),

  // 招待コード管理
  // Pre-sign-up Lambda は AppSync を経由せず DynamoDB に IAM 直接アクセスする (backend.ts で grant)。
  // そのため AppSync 側の認可は管理者のみで十分。
  InviteCode: a
    .model({
      code: a.string().required(),
      isActive: a.boolean().default(true),
      usageLimit: a.integer(),
      usageCount: a.integer().default(0),
      expiresAt: a.datetime(),
      note: a.string(),
    })
    .secondaryIndexes((index) => [
      index("code"), // GSI: inviteCodesByCode (Lambda 側で使用)
    ])
    .authorization((allow) => [
      allow.groups(["ADMINS"]).to(["create", "read", "update", "delete"]),
    ]),

  // サイト設定（トップページのコンテンツ管理）
  SiteConfig: a
    .model({
      heroTitle: a.string().required(),
      heroSubtitle: a.string().required(),
      heroImagePath: a.string(),
      heroImagePaths: a.string().array(),
      heroSlideInterval: a.integer().default(6000),
      useHeroSlides: a.boolean().default(false),

      welcomeTitle: a.string().required(),
      welcomeBody: a.string().required(),

      featuresJson: a.string().required(),

      ctaTitle: a.string().required(),
      ctaBody: a.string().required(),

      footerCopyright: a.string().required(),

      // 会員ページのタブ表示制御（管理画面から非表示にできる）
      showTweet: a.boolean().default(true),       // 近況
      showFavorites: a.boolean().default(true),   // お気に入り
      showBoard: a.boolean().default(true),       // 掲示板

      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.guest().to(["read"]),
      allow.authenticated().to(["read"]),
      // 公開ページ（identityPool authMode）からログイン中ユーザーが読む場合用
      allow.authenticated("identityPool").to(["read"]),
      allow.groups(["ADMINS"]).to(["create", "update", "delete"]),
    ]),

});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    // identityPool guest を使うため apiKeyAuthorizationMode は撤去。
    // userPool (authenticated) と iam (guest 含む) の 2 モード運用。
  },
});
