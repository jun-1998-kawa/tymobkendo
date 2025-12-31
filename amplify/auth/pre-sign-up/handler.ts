import type { PreSignUpTriggerHandler } from "aws-lambda";
import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";

// SSMクライアント（Lambda実行環境でキャッシュ）
const ssmClient = new SSMClient({});

// AppSync設定のキャッシュ
let cachedConfig: { endpoint: string; apiKey: string } | null = null;

interface InviteCode {
  id: string;
  code: string;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  expiresAt: string | null;
}

/**
 * SSMからAppSync設定を取得（キャッシュあり）
 */
async function getAppSyncConfig(): Promise<{ endpoint: string; apiKey: string } | null> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const endpointParamName = process.env.SSM_APPSYNC_ENDPOINT;
  const apiKeyParamName = process.env.SSM_APPSYNC_API_KEY;

  if (!endpointParamName || !apiKeyParamName) {
    console.log("SSM parameter names not configured, using fallback");
    return null;
  }

  try {
    const response = await ssmClient.send(
      new GetParametersCommand({
        Names: [endpointParamName, apiKeyParamName],
        WithDecryption: false,
      })
    );

    const params = response.Parameters || [];
    const endpoint = params.find((p) => p.Name === endpointParamName)?.Value;
    const apiKey = params.find((p) => p.Name === apiKeyParamName)?.Value;

    if (endpoint && apiKey) {
      cachedConfig = { endpoint, apiKey };
      return cachedConfig;
    }
  } catch (error) {
    console.error("Failed to get SSM parameters:", error);
  }

  return null;
}

/**
 * AppSync経由でInviteCodeを検証
 */
async function validateWithAppSync(
  code: string,
  config: { endpoint: string; apiKey: string }
): Promise<{ valid: boolean; error?: string; inviteCode?: InviteCode }> {
  const query = `
    query ListInviteCodeByCode($code: String!) {
      listInviteCodeByCode(code: $code) {
        items {
          id
          code
          isActive
          usageLimit
          usageCount
          expiresAt
        }
      }
    }
  `;

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify({ query, variables: { code } }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error("AppSync query errors:", result.errors);
      return { valid: false, error: "AppSync query failed" };
    }

    const inviteCode: InviteCode | undefined =
      result.data?.listInviteCodeByCode?.items?.[0];

    if (!inviteCode) {
      return { valid: false, error: "招待コードが無効です。正しい招待コードを入力してください。" };
    }

    if (!inviteCode.isActive) {
      return { valid: false, error: "この招待コードは無効化されています。" };
    }

    if (inviteCode.expiresAt) {
      const expiresAt = new Date(inviteCode.expiresAt);
      if (expiresAt < new Date()) {
        return { valid: false, error: "この招待コードは有効期限が切れています。" };
      }
    }

    if (inviteCode.usageLimit !== null) {
      if ((inviteCode.usageCount || 0) >= inviteCode.usageLimit) {
        return { valid: false, error: "この招待コードは使用回数の上限に達しています。" };
      }
    }

    return { valid: true, inviteCode };
  } catch (error) {
    console.error("AppSync request failed:", error);
    return { valid: false, error: "AppSync request failed" };
  }
}

/**
 * AppSync経由で使用回数をインクリメント
 */
async function incrementUsageCount(
  id: string,
  currentCount: number,
  config: { endpoint: string; apiKey: string }
): Promise<void> {
  const mutation = `
    mutation UpdateInviteCode($input: UpdateInviteCodeInput!) {
      updateInviteCode(input: $input) {
        id
        usageCount
      }
    }
  `;

  try {
    await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            id,
            usageCount: currentCount + 1,
          },
        },
      }),
    });
  } catch (error) {
    console.error("Failed to increment usage count:", error);
    // 使用回数の更新失敗はサインアップをブロックしない
  }
}

/**
 * フォールバック: 環境変数の招待コードで検証
 */
function validateWithEnvCodes(code: string): { valid: boolean; error?: string } {
  const validCodesEnv = process.env.INVITE_CODES || "";
  const validCodes = validCodesEnv
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  if (validCodes.length === 0) {
    return { valid: false, error: "招待コードが設定されていません。" };
  }

  if (validCodes.includes(code)) {
    return { valid: true };
  }

  return { valid: false, error: "招待コードが無効です。正しい招待コードを入力してください。" };
}

export const handler: PreSignUpTriggerHandler = async (event) => {
  // サインアップ時に送信された招待コードを取得
  const submittedCode =
    event.request.clientMetadata?.inviteCode ||
    event.request.userAttributes?.["custom:inviteCode"];

  if (!submittedCode) {
    throw new Error("招待コードが入力されていません。招待コードを入力してください。");
  }

  // AppSync設定を取得
  const appSyncConfig = await getAppSyncConfig();

  if (appSyncConfig) {
    // DynamoDB経由で検証
    console.log("Validating invite code via AppSync/DynamoDB");
    const result = await validateWithAppSync(submittedCode, appSyncConfig);

    if (result.valid && result.inviteCode) {
      // 使用回数をインクリメント
      await incrementUsageCount(
        result.inviteCode.id,
        result.inviteCode.usageCount || 0,
        appSyncConfig
      );
      return event;
    }

    if (result.error && !result.error.includes("AppSync")) {
      // AppSyncは動作しているが、招待コードが無効
      throw new Error(result.error);
    }

    // AppSyncエラーの場合はフォールバック
    console.log("AppSync validation failed, falling back to env codes");
  }

  // フォールバック: 環境変数の招待コードで検証
  console.log("Validating invite code via environment variables");
  const fallbackResult = validateWithEnvCodes(submittedCode);

  if (!fallbackResult.valid) {
    throw new Error(
      fallbackResult.error || "招待コードが無効です。正しい招待コードを入力してください。"
    );
  }

  return event;
};
