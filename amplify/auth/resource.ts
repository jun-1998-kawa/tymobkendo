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
    // カスタム属性：卒業年度（西暦4桁）
    graduationYear: {
      dataType: "String",
      mutable: true,
    },
  },
  groups: ["MEMBERS", "ADMINS"],
});
