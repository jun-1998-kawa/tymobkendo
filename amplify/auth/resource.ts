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
    // 標準属性：プロフィール（卒業年度などを入れる）
    profile: {
      mutable: true,
      required: false,
    },
  },
  groups: ["MEMBERS", "ADMINS"],
});
