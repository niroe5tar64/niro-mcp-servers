---
description: 実装を要件・設計・タスクに対して検証する
allowed-tools: Read, Task
argument-hint: [feature-name] [task-numbers]
---

# 実装検証

## 引数の解析
- 機能名: `$1`（任意）
- タスク番号: `$2`（任意）

## 自動検出ロジック

**Subagent 起動前に検出を行う**:

**引数なし**（`$1` が空）:
- 会話履歴から `/kiro:spec-impl <feature> [tasks]` パターンを解析
- または `.kiro/specs/*/tasks.md` から `[x]` のチェック済みタスクを検出
- 検出した機能とタスクを Subagent に渡す

**機能のみ**（`$1` あり、`$2` なし）:
- `.kiro/specs/$1/tasks.md` を読み `[x]` を抽出
- 機能と検出タスクを Subagent に渡す

**両方指定**（`$1` と `$2` あり）:
- 検出せずにそのまま Subagent に渡す

## サブエージェントの起動

validate-impl-agent に検証を委譲する:

Task ツールで Subagent を呼び出し、読み取り対象のファイルパターンを渡す:

```
Task(
  subagent_type="validate-impl-agent",
  description="Validate implementation",
  prompt="""
Feature: {$1 or auto-detected}
Target tasks: {$2 or auto-detected}
Mode: {auto-detect, feature-all, or explicit}

File patterns to read:
- .kiro/specs/{feature}/*.{json,md}
- .kiro/steering/*.md

Validation scope: {based on detection results}
"""
)
```

## 結果の表示

Subagent のサマリーを表示し、次のステップを案内する:

### 次のステップ

**GO 判定の場合**:
- 実装が検証済みで準備完了
- デプロイまたは次の機能へ進む

**NO-GO 判定の場合**:
- 指摘された重大問題に対応
- 修正のため `/kiro:spec-impl <feature> [tasks]` を再実行
- `/kiro:validate-impl [feature] [tasks]` で再検証

**注意**: 実装後の検証を推奨。仕様整合と品質を確保する。
