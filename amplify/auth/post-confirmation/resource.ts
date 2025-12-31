import { defineFunction } from "@aws-amplify/backend";

export const postConfirmation = defineFunction({
  name: "post-confirmation",
  entry: "./handler.ts",
  runtime: 20,
  bundling: {
    // AWS SDKはLambda実行環境に含まれているので外部化
    externalModules: ["@aws-sdk/*"],
  },
});
