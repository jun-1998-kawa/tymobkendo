import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: { email: true },
  groups: ["MEMBERS", "ADMINS"],
  // 備考: 新規ユーザーのグループ付与は運用（管理者が昇格）で行う
});
