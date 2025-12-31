import { defineFunction } from "@aws-amplify/backend";

export const preSignUp = defineFunction({
  name: "pre-sign-up",
  entry: "./handler.ts",
  environment: {
    // 招待コード（カンマ区切りで複数指定可能）
    // 変更後は再デプロイが必要
    INVITE_CODES: "KENDO2024,TOYAMA2024",
  },
});
