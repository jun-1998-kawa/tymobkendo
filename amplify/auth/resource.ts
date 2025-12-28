import { defineAuth } from "@aws-amplify/backend";
import { preSignUp } from "./pre-sign-up/resource";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ["ADMINS", "MEMBERS"],  // ADMINSを先にして優先順位を上げる
  triggers: {
    preSignUp,
  },
  userAttributes: {
    // 招待コード（サインアップ時のみ使用、検証後は不要）
    "custom:inviteCode": {
      dataType: "String",
      mutable: true,
    },
  },
});
