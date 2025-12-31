import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { preSignUp } from "./auth/pre-sign-up/resource";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Stack } from "aws-cdk-lib";

const backend = defineBackend({ auth, data, storage });

// AppSync APIの情報を取得
const graphqlApi = backend.data.resources.graphqlApi;
const cfnApiKey = backend.data.resources.cfnResources.cfnApiKey;

// GraphQL URLを取得（cfnResourcesから）
const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
const graphqlUrl = cfnGraphqlApi.attrGraphQlUrl;

// SSMパラメータ名（固定プレフィックス）
const dataStack = Stack.of(graphqlApi);
const ssmPrefix = "/tymobsite/appsync";

// AppSync EndpointをSSMに保存
const endpointParam = new StringParameter(dataStack, "AppSyncEndpointParam", {
  parameterName: `${ssmPrefix}/endpoint`,
  stringValue: graphqlUrl,
  description: "AppSync GraphQL Endpoint for pre-sign-up Lambda",
});

// API KeyをSSMに保存
const apiKeyParam = new StringParameter(dataStack, "AppSyncApiKeyParam", {
  parameterName: `${ssmPrefix}/apiKey`,
  stringValue: cfnApiKey?.attrApiKey || "",
  description: "AppSync API Key for pre-sign-up Lambda",
});

// preSignUp Lambdaを探してSSM環境変数と権限を設定
// Amplify Gen 2のauth triggersはuserPoolのLambdaConfigに設定される
try {
  const authStack = Stack.of(backend.auth.resources.userPool);
  const allConstructs = authStack.node.findAll();

  // Lambda関数を探す（pre-sign-upを含むもの）
  for (const construct of allConstructs) {
    if (
      construct.node.id.toLowerCase().includes("presignup") ||
      construct.node.id.toLowerCase().includes("pre-sign-up")
    ) {
      const lambda = construct as any;
      if (typeof lambda.addEnvironment === "function") {
        // SSMパラメータ名を環境変数に設定
        lambda.addEnvironment("SSM_APPSYNC_ENDPOINT", endpointParam.parameterName);
        lambda.addEnvironment("SSM_APPSYNC_API_KEY", apiKeyParam.parameterName);

        // SSM読み取り権限を付与
        if (typeof lambda.addToRolePolicy === "function") {
          // ARNを手動で構築（リージョンとアカウントはCDKから取得）
          const region = dataStack.region;
          const account = dataStack.account;
          const ssmArnPrefix = `arn:aws:ssm:${region}:${account}:parameter${ssmPrefix}`;

          lambda.addToRolePolicy(
            new PolicyStatement({
              actions: ["ssm:GetParameter", "ssm:GetParameters"],
              resources: [
                `${ssmArnPrefix}/endpoint`,
                `${ssmArnPrefix}/apiKey`,
              ],
            })
          );
        }
        console.log("Successfully configured preSignUp Lambda with SSM access");
        break;
      }
    }
  }
} catch (error) {
  console.warn("Could not configure preSignUp Lambda:", error);
  // エラーが発生してもデプロイは続行（フォールバックが機能する）
}

export { backend };
