---
description: 仕様に対する実装タスクを生成する
allowed-tools: Read, Task
argument-hint: <feature-name> [-y] [--sequential]
---

# 実装タスク生成

## 引数の解析
- 機能名: `$1`
- 自動承認フラグ: `$2`（任意、"-y"）
- 順次モードフラグ: `$3`（任意、"--sequential"）

## 検証
設計が完了していることを確認する:
- `.kiro/specs/$1/` が存在すること
- `.kiro/specs/$1/design.md` が存在すること
- `sequential = ($3 == "--sequential")` を判定

検証に失敗した場合は、設計フェーズを先に完了するよう案内する。

## サブエージェントの起動

spec-tasks-agent にタスク生成を委譲する:

Task ツールで Subagent を呼び出し、読み取り対象のファイルパターンを渡す:

```
Task(
  subagent_type="spec-tasks-agent",
  description="Generate implementation tasks",
  prompt="""
Feature: $1
Spec directory: .kiro/specs/$1/
Auto-approve: {true if $2 == "-y", else false}
Sequential mode: {true if sequential else false}

File patterns to read:
- .kiro/specs/$1/*.{json,md}
- .kiro/steering/*.md
- .kiro/settings/rules/tasks-generation.md
- .kiro/settings/rules/tasks-parallel-analysis.md (include only when sequential mode is false)
- .kiro/settings/templates/specs/tasks.md

Mode: {generate or merge based on tasks.md existence}
Instruction highlights:
- Map all requirements to tasks and list requirement IDs only (comma-separated) without extra narration
- Promote single actionable sub-tasks to major tasks and keep container summaries concise
- Apply `(P)` markers only when parallel criteria met (omit in sequential mode)
- Mark optional acceptance-criteria-focused test coverage subtasks with `- [ ]*` only when deferrable post-MVP
"""
)
```

## 結果の表示

Subagent のサマリーを表示し、次のステップを案内する:

### 次フェーズ: 実装

**実装開始前**:
- **重要**: `/kiro:spec-impl` を実行する前に会話履歴をクリアし、コンテキストを解放する
- 最初のタスク開始時、またはタスク切替時に適用
- クリーンなコンテキストで正しい焦点と状態を確保する

**タスクが承認された場合**:
- 特定タスクを実行: `/kiro:spec-impl $1 1.1`（推奨: タスクごとにコンテキストをクリア）
- 複数タスクを実行: `/kiro:spec-impl $1 1.1,1.2`（慎重に。タスク間でコンテキストをクリア）
- 引数なし: `/kiro:spec-impl $1`（未完了タスクをすべて実行 - コンテキスト肥大のため非推奨）

**修正が必要な場合**:
- フィードバックを提供し `/kiro:spec-tasks $1` を再実行
- 既存のタスクを参照してマージモード

**注意**: 実装フェーズは適切なコンテキストと検証のもとでタスク実行をガイドする。
