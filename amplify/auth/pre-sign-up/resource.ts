import { defineFunction, secret } from "@aws-amplify/backend";

export const preSignUp = defineFunction({
  name: "pre-sign-up",
  entry: "./handler.ts",
  environment: {
    // 招待コード（カンマ区切りで複数指定可能）
    // 本番環境ではSecrets Managerを使用: INVITE_CODES: secret("INVITE_CODES")
    INVITE_CODES: "KENDO2024,TOYAMA2024",
  },
});
