import type { PreSignUpTriggerHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: PreSignUpTriggerHandler = async (event) => {
  // サインアップ時に送信された招待コードを取得
  // clientMetadata または userAttributes から取得（両方に対応）
  const submittedCode =
    event.request.clientMetadata?.inviteCode ||
    event.request.userAttributes?.["custom:inviteCode"];

  if (!submittedCode) {
    throw new Error("招待コードが入力されていません。招待コードを入力してください。");
  }

  // DynamoDBからアクティブな招待コードを取得
  const tableName = process.env.INVITE_CODE_TABLE_NAME;

  if (!tableName) {
    console.error("INVITE_CODE_TABLE_NAME is not set");
    throw new Error("システムエラーが発生しました。管理者にお問い合わせください。");
  }

  const result = await docClient.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: "isActive = :active",
      ExpressionAttributeValues: {
        ":active": true,
      },
    })
  );

  const validCodes = result.Items?.map((item: { code?: string }) => item.code) || [];

  if (!validCodes.includes(submittedCode)) {
    throw new Error("招待コードが無効です。正しい招待コードを入力してください。");
  }

  // 招待コードが有効な場合、サインアップを許可
  return event;
};
