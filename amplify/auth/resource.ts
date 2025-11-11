import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ["ADMINS", "MEMBERS"],  // ADMINSを先にして優先順位を上げる
});
