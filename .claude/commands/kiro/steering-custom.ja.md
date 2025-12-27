---
description: 特化したプロジェクト文脈向けのカスタムステアリング文書を作成する
allowed-tools: Task
---

# Kiro カスタムステアリング作成

## インタラクティブなワークフロー

このコマンドは Subagent との対話プロセスを開始する:
1. Subagent がユーザーにドメイン/トピックを質問
2. Subagent が利用可能テンプレートを確認
3. Subagent がコードベースから関連パターンを分析
4. Subagent がカスタムステアリングファイルを生成

## サブエージェントの起動

steering-custom-agent にカスタムステアリング作成を委譲する:

Task ツールで Subagent を呼び出し、読み取り対象のファイルパターンを渡す:

```
Task(
  subagent_type="steering-custom-agent",
  description="Create custom steering",
  prompt="""
Interactive Mode: Ask user for domain/topic

File patterns to read:
- .kiro/settings/templates/steering-custom/*.md
- .kiro/settings/rules/steering-principles.md

JIT Strategy: Analyze codebase for relevant patterns as needed
"""
)
```

## 結果の表示

Subagent のサマリーを表示する:
- 作成されたカスタムステアリングファイル
- 使用テンプレート（該当時）
- 分析したコードベースのパターン
- 内容の概要

## 利用可能テンプレート

`.kiro/settings/templates/steering-custom/` にあるテンプレート:
- api-standards.md, testing.md, security.md, database.md
- error-handling.md, authentication.md, deployment.md

## 注意

- Subagent は要件把握のためユーザーと対話する
- テンプレートは出発点としてプロジェクトに合わせて調整する
- すべてのステアリングファイルはプロジェクト記憶として読み込まれる
- エージェント固有ツールのディレクトリ（例: `.cursor/`, `.gemini/`, `.claude/`）は記載しない
- `.kiro/settings/` の内容は記載しない（メタデータでありプロジェクト知識ではない）
- `.kiro/specs/` と `.kiro/steering/` の軽い参照は許容。その他の `.kiro/` ディレクトリは避ける
