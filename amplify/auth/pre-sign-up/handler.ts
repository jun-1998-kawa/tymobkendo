import type { PreSignUpTriggerHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

/**
 * Pre-sign-up Lambda — 招待コード検証
 *
 * 旧実装は AppSync を api key 経由で叩いていたが、api key の自動失効による
 * デプロイ事故が起きるため、DynamoDB へ IAM 経由で直接アクセスする方式に変更。
 * backend.ts で InviteCode テーブルへの read+write 権限と
 * INVITE_CODE_TABLE 環境変数が注入される前提。
 */

const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);

const INVITE_CODE_TABLE = process.env.INVITE_CODE_TABLE;
const INVITE_CODE_INDEX = "inviteCodesByCode"; // Amplify Gen 2 が secondaryIndexes から自動生成する GSI 名

interface InviteCodeRecord {
  id: string;
  code: string;
  isActive?: boolean | null;
  usageLimit?: number | null;
  usageCount?: number | null;
  expiresAt?: string | null;
}

async function findByCode(code: string): Promise<InviteCodeRecord | null> {
  if (!INVITE_CODE_TABLE) return null;
  const result = await ddb.send(
    new QueryCommand({
      TableName: INVITE_CODE_TABLE,
      IndexName: INVITE_CODE_INDEX,
      KeyConditionExpression: "#c = :code",
      ExpressionAttributeNames: { "#c": "code" },
      ExpressionAttributeValues: { ":code": code },
      Limit: 1,
    })
  );
  const item = result.Items?.[0];
  return (item as InviteCodeRecord) ?? null;
}

async function incrementUsage(id: string, current: number): Promise<void> {
  if (!INVITE_CODE_TABLE) return;
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: INVITE_CODE_TABLE,
        Key: { id },
        UpdateExpression: "SET usageCount = :new",
        ConditionExpression: "attribute_not_exists(usageCount) OR usageCount = :old",
        ExpressionAttributeValues: { ":new": current + 1, ":old": current },
      })
    );
  } catch (err) {
    // インクリメント失敗はサインアップ自体をブロックしない
    console.error("Failed to increment usageCount:", err);
  }
}

/**
 * フォールバック: 環境変数の招待コード (INVITE_CODES) で検証
 * DynamoDB 接続障害時の最終防衛線
 */
function validateFromEnv(code: string): { valid: boolean; error?: string } {
  const validCodes = (process.env.INVITE_CODES || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  if (validCodes.length === 0) {
    return { valid: false, error: "招待コードが設定されていません。" };
  }
  if (validCodes.includes(code)) return { valid: true };
  return {
    valid: false,
    error: "招待コードが無効です。正しい招待コードを入力してください。",
  };
}

export const handler: PreSignUpTriggerHandler = async (event) => {
  const submittedCode =
    event.request.clientMetadata?.inviteCode ||
    event.request.userAttributes?.["custom:inviteCode"];

  if (!submittedCode) {
    throw new Error(
      "招待コードが入力されていません。招待コードを入力してください。"
    );
  }

  // DynamoDB 直接検証
  if (INVITE_CODE_TABLE) {
    try {
      const record = await findByCode(submittedCode);

      if (!record) {
        throw new Error(
          "招待コードが無効です。正しい招待コードを入力してください。"
        );
      }

      if (record.isActive === false) {
        throw new Error("この招待コードは無効化されています。");
      }

      if (record.expiresAt) {
        const expiresAt = new Date(record.expiresAt);
        if (expiresAt < new Date()) {
          throw new Error("この招待コードは有効期限が切れています。");
        }
      }

      if (record.usageLimit != null) {
        const used = record.usageCount ?? 0;
        if (used >= record.usageLimit) {
          throw new Error(
            "この招待コードは使用回数の上限に達しています。"
          );
        }
      }

      // インクリメント (失敗してもサインアップは通す)
      await incrementUsage(record.id, record.usageCount ?? 0);

      return event;
    } catch (err) {
      // ユーザー向けエラーメッセージはそのまま投げる (Error.message が "招待コード..." で始まる)
      if (err instanceof Error && err.message.includes("招待コード")) {
        throw err;
      }
      console.error("DynamoDB validation failed, falling back to env codes:", err);
      // 通信エラー等は env フォールバックへ
    }
  }

  // フォールバック: 環境変数の固定コードで検証
  const fallback = validateFromEnv(submittedCode);
  if (!fallback.valid) {
    throw new Error(
      fallback.error || "招待コードが無効です。正しい招待コードを入力してください。"
    );
  }
  return event;
};
