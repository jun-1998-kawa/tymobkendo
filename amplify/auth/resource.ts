import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ["MEMBERS", "ADMINS"],
  userAttributes: {
    name: {
      required: true,
      mutable: true,
    },
    "custom:graduationYear": {
      dataType: "Number",
      mutable: true,
    },
  },
});
