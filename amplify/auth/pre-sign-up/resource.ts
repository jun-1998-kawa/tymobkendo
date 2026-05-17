import { defineFunction } from "@aws-amplify/backend";

export const preSignUp = defineFunction({
  name: "pre-sign-up",
  entry: "./handler.ts",
  environment: {
    // フォールバック用の招待コード (DynamoDB 接続障害時に限り使用)
    // 通常は backend.ts が INVITE_CODE_TABLE 環境変数を注入し、
    // Lambda は DynamoDB の InviteCode テーブルを直接照会する
    INVITE_CODES: "KENDO2024,TOYAMA2024",
  },
});
