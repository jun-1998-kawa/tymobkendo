import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    // 標準属性：名前
    name: {
      mutable: true,
      required: true,
    },
    // カスタム属性：卒業年度（"custom:"プレフィックスなし）
    graduationYear: {
      dataType: "String",
      mutable: true,
      minLen: 4,
      maxLen: 4,
    },
  },
  groups: ["MEMBERS", "ADMINS"],
});
