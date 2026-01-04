---
description: 対話的な技術設計レビューと検証を行う
allowed-tools: Read, Task
argument-hint: <feature-name>
---

# 技術設計検証

## 引数の解析
- 機能名: `$1`

## 検証
設計が完了していることを確認する:
- `.kiro/specs/$1/` が存在すること
- `.kiro/specs/$1/design.md` が存在すること

検証に失敗した場合は、先に設計フェーズを完了するよう案内する。

## サブエージェントの起動

validate-design-agent に設計検証を委譲する:

Task ツールで Subagent を呼び出し、読み取り対象のファイルパターンを渡す:

```
Task(
  subagent_type="validate-design-agent",
  description="Interactive design review",
  prompt="""
Feature: $1
Spec directory: .kiro/specs/$1/

File patterns to read:
- .kiro/specs/$1/spec.json
- .kiro/specs/$1/requirements.md
- .kiro/specs/$1/design.md
- .kiro/steering/*.md
- .kiro/settings/rules/design-review.md
"""
)
```

## 結果の表示

Subagent のサマリーを表示し、次のステップを案内する:

### 次フェーズ: タスク生成

**設計が検証に合格（GO）した場合**:
- フィードバックを確認し必要なら修正
- `/kiro:spec-tasks $1` で実装タスクを生成
- または `/kiro:spec-tasks $1 -y` で自動承認して進む

**設計が改訂必要（NO-GO）の場合**:
- 指摘された重大課題に対応
- `/kiro:spec-design $1` を改善して再実行
- `/kiro:validate-design $1` で再検証

**注意**: 設計検証は推奨だが任意。早期に問題を検出できる。
