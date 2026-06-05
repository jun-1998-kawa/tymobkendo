import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { preSignUp } from "./auth/pre-sign-up/resource";
import { postConfirmation } from "./auth/post-confirmation/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Function as LambdaFunction } from "aws-cdk-lib/aws-lambda";

// defineFunction で定義した Lambda（preSignUp / postConfirmation）は auth とは
// 別スタックに配置される。そのため旧実装の Stack.of(userPool).node.findAll() では
// Lambda 構築物にヒットせず、環境変数も IAM 権限も「黙って」注入されていなかった。
// → preSignUp は INVITE_CODE_TABLE 未設定で DynamoDB 検証をスキップし、
//   postConfirmation は AdminAddUserToGroup 権限が無くグループ追加に失敗していた。
// 公式の backend.<fn>.resources.lambda 経由で確実に設定する。
const backend = defineBackend({
  auth,
  data,
  storage,
  preSignUp,
  postConfirmation,
});

// preSignUp Lambda に InviteCode DynamoDB テーブルへの直接アクセス権を付与する。
// AppSync api key 認証を撤廃したため、招待コード検証は AppSync を通さず
// IAM 経由で DynamoDB を直接照会する方式に変更。
const inviteCodeTable = backend.data.resources.tables["InviteCode"];
// resources.lambda は IFunction 型のため、addEnvironment を持つ L2 Function にキャスト。
const preSignUpLambda = backend.preSignUp.resources.lambda as LambdaFunction;
// handler は process.env.INVITE_CODE_TABLE を読み、GSI inviteCodesByCode を Query する。
preSignUpLambda.addEnvironment("INVITE_CODE_TABLE", inviteCodeTable.tableName);
// テーブル本体 + GSI への Query/GetItem/UpdateItem を付与（grant は index/* も含む）。
inviteCodeTable.grantReadWriteData(preSignUpLambda);

// postConfirmation Lambda に Cognito AdminAddUserToGroup 権限を付与する。
// 新規ユーザーを自動で MEMBERS グループへ追加するために必要。
backend.postConfirmation.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["cognito-idp:AdminAddUserToGroup"],
    resources: [backend.auth.resources.userPool.userPoolArn],
  })
);

export { backend };
