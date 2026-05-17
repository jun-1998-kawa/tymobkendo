import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Stack } from "aws-cdk-lib";

const backend = defineBackend({ auth, data, storage });

// preSignUp Lambda に InviteCode DynamoDB テーブルへの直接アクセス権を付与する。
// AppSync api key 認証を撤廃したため、招待コード検証は AppSync を通さず
// IAM 経由で DynamoDB を直接照会する方式に変更。
try {
  const inviteCodeTable = backend.data.resources.tables["InviteCode"];
  const authStack = Stack.of(backend.auth.resources.userPool);
  const allConstructs = authStack.node.findAll();

  for (const construct of allConstructs) {
    if (
      construct.node.id.toLowerCase().includes("presignup") ||
      construct.node.id.toLowerCase().includes("pre-sign-up")
    ) {
      const lambda = construct as any;
      if (typeof lambda.addEnvironment === "function") {
        lambda.addEnvironment("INVITE_CODE_TABLE", inviteCodeTable.tableName);

        if (typeof lambda.addToRolePolicy === "function") {
          // テーブル本体 + GSI (inviteCodesByCode) への Query/Update 権限
          lambda.addToRolePolicy(
            new PolicyStatement({
              actions: [
                "dynamodb:Query",
                "dynamodb:UpdateItem",
                "dynamodb:GetItem",
              ],
              resources: [
                inviteCodeTable.tableArn,
                `${inviteCodeTable.tableArn}/index/*`,
              ],
            })
          );
        }
        console.log(
          "Successfully configured preSignUp Lambda with DynamoDB access"
        );
        break;
      }
    }
  }
} catch (error) {
  console.warn("Could not configure preSignUp Lambda DDB access:", error);
}

// postConfirmation LambdaにCognito AdminAddUserToGroup権限を付与
try {
  const authStack = Stack.of(backend.auth.resources.userPool);
  const userPoolArn = backend.auth.resources.userPool.userPoolArn;
  const allConstructs = authStack.node.findAll();

  for (const construct of allConstructs) {
    if (
      construct.node.id.toLowerCase().includes("postconfirmation") ||
      construct.node.id.toLowerCase().includes("post-confirmation")
    ) {
      const lambda = construct as any;
      if (typeof lambda.addToRolePolicy === "function") {
        lambda.addToRolePolicy(
          new PolicyStatement({
            actions: ["cognito-idp:AdminAddUserToGroup"],
            resources: [userPoolArn],
          })
        );
        console.log(
          "Successfully configured postConfirmation Lambda with Cognito access"
        );
        break;
      }
    }
  }
} catch (error) {
  console.warn("Could not configure postConfirmation Lambda:", error);
}

export { backend };
