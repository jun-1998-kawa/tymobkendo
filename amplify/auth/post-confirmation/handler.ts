import type { PostConfirmationTriggerHandler } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({});

/**
 * Post Confirmation Lambda
 *
 * 新規ユーザーの確認完了後に自動的にMEMBERSグループに追加する。
 * これにより、会員限定コンテンツ（HistoryEntry等）へのアクセスが可能になる。
 */
export const handler: PostConfirmationTriggerHandler = async (event) => {
  // 確認完了イベントのみ処理（パスワードリセット等は除外）
  if (event.triggerSource !== "PostConfirmation_ConfirmSignUp") {
    console.log(`Skipping trigger source: ${event.triggerSource}`);
    return event;
  }

  const userPoolId = event.userPoolId;
  const username = event.userName;

  console.log(`Adding user ${username} to MEMBERS group in pool ${userPoolId}`);

  try {
    await cognitoClient.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: username,
        GroupName: "MEMBERS",
      })
    );

    console.log(`Successfully added user ${username} to MEMBERS group`);
  } catch (error) {
    // グループ追加に失敗してもサインアップ自体は成功させる
    // 管理者が後から手動で追加できるため
    console.error(`Failed to add user ${username} to MEMBERS group:`, error);
  }

  return event;
};
