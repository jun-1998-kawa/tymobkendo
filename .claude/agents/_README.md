# Claude Code Subagents (Project-Level)

使い方（Claude Code v2025 Research Preview 準拠）
- 公式仕様: プロジェクト配下 `.claude/agents/` のMarkdown（YAMLフロントマター付き）が最優先で読み込まれます。ユーザ全体は `~/.claude/agents/`。名前衝突時はプロジェクト定義が優先されます。
- UI での作成/読み込み: Claude Code内で `/agents` → Create New Agent。必要に応じ、各ファイルの本文を System Prompt に貼り付けて保存してください。
- 反映されない場合: 一度Claude Codeセッションを再起動（ターミナル/IDEを閉じる→再起動）。

YAMLフロントマターの雛形（実環境に合わせてキー名はUIで確認して調整してください）
```
---
name: Amplify Orchestrator
description: Setup and maintain Amplify Gen 2 backend and sandbox.
scope: project
allowed_tools:
  - shell
  - git
  - editor
  - web
---
```

同梱エージェント
- 01_controller.md（オーケストレーター）
- 10_amplify_orchestrator.md
- 20_schema_authz_guard.md
- 30_content_ops_cms.md
- 40_moderation_gate.md
- 50_image_pipeline.md
- 60_release_manager.md
- 70_retention_cleanup.md

注意
- これらのファイルはプロンプト本文として完成しています。フロントマターはUI仕様に合わせて追加してください（将来の仕様変更に追随するため）。
- 参考: Subagents の公式ドキュメント（/agentsコマンド、ファイル配置、優先度）。

