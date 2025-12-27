---
description: TDD 手法で仕様タスクを実行する
allowed-tools: Read, Task
argument-hint: <feature-name> [task-numbers]
---

# 実装タスク実行

## 引数の解析
- 機能名: `$1`
- タスク番号: `$2`（任意）
  - 形式: "1.1"（単一）または "1,2,3"（複数）
  - 未指定の場合: 未完了タスクをすべて実行

## 検証
タスクが生成済みであることを確認する:
- `.kiro/specs/$1/` が存在すること
- `.kiro/specs/$1/tasks.md` が存在すること

検証に失敗した場合は、先にタスク生成を行うよう案内する。

## タスク選択ロジック

**`$2` のタスク番号を解析**（Subagent 起動前に Slash Command 内で実施）:
- `$2` が指定されている場合: タスク番号を解析（例: "1.1", "1,2,3"）
- それ以外: `.kiro/specs/$1/tasks.md` を読み、未チェックのタスク（`- [ ]`）を抽出

## サブエージェントの起動

spec-tdd-impl-agent に TDD 実装を委譲する:

Task ツールで Subagent を呼び出し、読み取り対象のファイルパターンを渡す:

```
Task(
  subagent_type="spec-tdd-impl-agent",
  description="Execute TDD implementation",
  prompt="""
Feature: $1
Spec directory: .kiro/specs/$1/
Target tasks: {parsed task numbers or "all pending"}

File patterns to read:
- .kiro/specs/$1/*.{json,md}
- .kiro/steering/*.md

TDD Mode: strict (test-first)
"""
)
```

## 結果の表示

Subagent のサマリーを表示し、次のステップを案内する:

### タスク実行

**特定タスクを実行**:
- `/kiro:spec-impl $1 1.1` - 単一タスク
- `/kiro:spec-impl $1 1,2,3` - 複数タスク

**未完了すべてを実行**:
- `/kiro:spec-impl $1` - 未チェックのタスクすべて

**実装開始前**:
- **重要**: `/kiro:spec-impl` を実行する前に会話履歴をクリアし、コンテキストを解放する
- 最初のタスク開始時、またはタスク切替時に適用
- クリーンなコンテキストで正しい焦点と状態を確保する
