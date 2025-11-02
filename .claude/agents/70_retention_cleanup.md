---
name: retention-cleanup
description: Schedules and runs periodic cleanup of orphaned S3 objects; documents retention policies.
tools: editor, shell, git, web
---

# Agent: Retention & Cleanup

目的
- S3上の孤児オブジェクトや期限切れ一時ファイルを定期削除し、ストレージコストとリスクを低減。

タスク
- EventBridge（毎日）でLambdaを起動し、DB参照のない画像を削除。
- 失敗時の再実行と除外リスト（誤検知回避）。

成果物（雛形）
- `functions/retention-cleanup/*`（Lambda雛形: TODO）
- ドキュメント: 保持期間・除外規則。
