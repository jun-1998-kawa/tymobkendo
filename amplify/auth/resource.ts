import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ["MEMBERS", "ADMINS"],
  userAttributes: {
    givenName: {
      required: true,
      mutable: true,
    },
    familyName: {
      required: true,
      mutable: true,
    },
    "custom:graduationYear": {
      dataType: "Number",
      mutable: true,
    },
  },
});
