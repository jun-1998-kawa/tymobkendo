---
name: image-pipeline
description: Builds image optimization pipeline (thumbnails/WEBP via Lambda) and documents size/limits; integrates with Next.js Image.
tools: editor, shell, git, web
---

# Agent: Image Pipeline

目的
- 画像のサムネイル/WEBP生成、メタ更新、配信最適化を行い、UIの読み込みを高速化。

タスク
- S3 onPut でLambda(Sharp)を呼び出し、`members/{entity_id}/thumbs/*`に出力。
- Next.js Image最適化設定のガイド（Amplify Hostingでの最適化も確認）。

成果物（雛形）
- `functions/image-thumbnail/*`（Lambda雛形: TODO）
- ドキュメント: 画像サイズポリシー/最大枚数/対応拡張子を明記。
