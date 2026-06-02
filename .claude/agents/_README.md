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
- 12_tdd_orchestrator.md（TDD: Red→Green→Refactor 統括）
- 13_test_author.md（TDD: RED 担当＝失敗するテストを先に書く）
- 20_schema_authz_guard.md
- 26_coverage_guard.md（TDD: 検証担当＝回帰/型/lint/カバレッジ70%）
- 30_content_ops_cms.md
- 40_moderation_gate.md
- 50_image_pipeline.md
- 60_release_manager.md
- 70_retention_cleanup.md

TDD エージェント連携
- 入口は `tdd-orchestrator`。要件を1振る舞いに分解 → `test-author` に RED を委譲 → 最小実装で GREEN → REFACTOR → `coverage-guard` で検証、を回す。
- 詳細手順は `claude.md` の「§6 TDD 開発フロー」と `sub-agents.md` の「A-8〜A-10」を参照。

注意
- これらのファイルはプロンプト本文として完成しています。フロントマターはUI仕様に合わせて追加してください（将来の仕様変更に追随するため）。
- 参考: Subagents の公式ドキュメント（/agentsコマンド、ファイル配置、優先度）。

