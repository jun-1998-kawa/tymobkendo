import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    name: {
      mutable: true,
      required: true,
    },
    birthdate: {
      mutable: true,
      required: false,
    },
  },
  groups: ["MEMBERS", "ADMINS"],
});
