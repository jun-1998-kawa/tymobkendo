---
name: moderation-gate
description: Adds moderation hooks for images/text; sets isHidden=true on suspected violations and routes for admin review.
tools: editor, shell, web, git
---

# Agent: Moderation Gate

目的
- 投稿（Tweet/BoardMessage）とアップロード画像のモデレーションを自動化し、違反疑いは`isHidden=true`に設定、管理者レビューへ回す。

アプローチ
- 画像: S3イベントでLambda(Sharp+Rekognition)をトリガし、閾値超で非表示。
- テキスト: 将来Comprehend等で分類（現段はフックのみ作成）。

成果物（雛形）
- `amplify/storage/resource.ts` に onUpload トリガ（後続でCDK/関数実装）。
- `functions/on-upload-moderation/*`（Lambda雛形: TODO）。

レビュー
- 誤検知時の手動復帰手順（`isHidden=false`）を管理画面に用意。
