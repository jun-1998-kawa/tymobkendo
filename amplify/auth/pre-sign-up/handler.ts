import type { PreSignUpTriggerHandler } from "aws-lambda";

export const handler: PreSignUpTriggerHandler = async (event) => {
  // サインアップ時に送信された招待コードを取得
  // clientMetadata または userAttributes から取得（両方に対応）
  const submittedCode =
    event.request.clientMetadata?.inviteCode ||
    event.request.userAttributes?.["custom:inviteCode"];

  if (!submittedCode) {
    throw new Error("招待コードが入力されていません。招待コードを入力してください。");
  }

  // 環境変数から有効な招待コードを取得（カンマ区切り）
  const validCodesEnv = process.env.INVITE_CODES || "";
  const validCodes = validCodesEnv.split(",").map((code) => code.trim()).filter(Boolean);

  if (validCodes.length === 0) {
    console.error("INVITE_CODES environment variable is not set or empty");
    throw new Error("システムエラーが発生しました。管理者にお問い合わせください。");
  }

  if (!validCodes.includes(submittedCode)) {
    throw new Error("招待コードが無効です。正しい招待コードを入力してください。");
  }

  // 招待コードが有効な場合、サインアップを許可
  return event;
};
