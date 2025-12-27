---
description: 仕様に対する包括的な技術設計を作成する
allowed-tools: Read, Task
argument-hint: <feature-name> [-y]
---

# 技術設計生成

## 引数の解析
- 機能名: `$1`
- 自動承認フラグ: `$2`（任意、"-y"）

## 検証
要件が完了していることを確認する:
- `.kiro/specs/$1/` が存在すること
- `.kiro/specs/$1/requirements.md` が存在すること

検証に失敗した場合は、要件フェーズを先に完了するよう案内する。

## サブエージェントの起動

spec-design-agent に設計生成を委譲する:

Task ツールで Subagent を呼び出し、読み取り対象のファイルパターンを渡す:

```
Task(
  subagent_type="spec-design-agent",
  description="Generate technical design and update research log",
  prompt="""
Feature: $1
Spec directory: .kiro/specs/$1/
Auto-approve: {true if $2 == "-y", else false}

File patterns to read:
- .kiro/specs/$1/*.{json,md}
- .kiro/steering/*.md
- .kiro/settings/rules/design-*.md
- .kiro/settings/templates/specs/design.md
- .kiro/settings/templates/specs/research.md

Discovery: auto-detect based on requirements
Mode: {generate or merge based on design.md existence}
Language: respect spec.json language for design.md/research.md outputs
"""
)
```

## 結果の表示

Subagent のサマリーを表示し、次のステップを案内する:

### 次フェーズ: タスク生成

**設計が承認された場合**:
- `.kiro/specs/$1/design.md` をレビュー
- **任意**: `/kiro:validate-design $1` で対話的な品質レビュー
- その後 `/kiro:spec-tasks $1 -y` で実装タスクを生成

**修正が必要な場合**:
- フィードバックを提供し `/kiro:spec-design $1` を再実行
- 既存の設計を参照してマージモード

**注意**: タスク生成に進む前に設計承認が必要。
