import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { preSignUp } from "./auth/pre-sign-up/resource";
import { Function } from "aws-cdk-lib/aws-lambda";

export const backend = defineBackend({ auth, data, storage, preSignUp });

// Pre Sign-up LambdaにInviteCodeテーブルへの読み取り権限を付与
const inviteCodeTable = backend.data.resources.tables["InviteCode"];
const preSignUpLambda = backend.preSignUp.resources.lambda as Function;

// 環境変数を設定
preSignUpLambda.addEnvironment("INVITE_CODE_TABLE_NAME", inviteCodeTable.tableName);

// DynamoDBへの読み取り権限を付与
inviteCodeTable.grantReadData(preSignUpLambda);
