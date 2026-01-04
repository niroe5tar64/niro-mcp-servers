---
description: 仕様の包括的な要件を生成する
allowed-tools: Read, Task
argument-hint: <feature-name>
---

# 要件生成

## 引数の解析
- 機能名: `$1`

## 検証
仕様が初期化済みであることを確認する:
- `.kiro/specs/$1/` が存在すること
- `.kiro/specs/$1/spec.json` が存在すること

検証に失敗した場合は、先に `/kiro:spec-init` を実行するよう案内する。

## サブエージェントの起動

spec-requirements-agent に要件生成を委譲する:

Task ツールで Subagent を呼び出し、読み取り対象のファイルパターンを渡す:

```
Task(
  subagent_type="spec-requirements-agent",
  description="Generate EARS requirements",
  prompt="""
Feature: $1
Spec directory: .kiro/specs/$1/

File patterns to read:
- .kiro/specs/$1/spec.json
- .kiro/specs/$1/requirements.md
- .kiro/steering/*.md
- .kiro/settings/rules/ears-format.md
- .kiro/settings/templates/specs/requirements.md

Mode: generate
"""
)
```

## 結果の表示

Subagent のサマリーを表示し、次のステップを案内する:

### 次フェーズ: 設計生成

**要件が承認された場合**:
- `.kiro/specs/$1/requirements.md` をレビュー
- **任意のギャップ分析**（既存コードベース向け）:
  - `/kiro:validate-gap $1` で現行コードとのギャップ分析
  - 既存コンポーネント、統合ポイント、実装方針を特定
  - 既存システム向けに推奨、グリーンフィールドなら不要
- その後 `/kiro:spec-design $1 [-y]` で設計フェーズへ

**修正が必要な場合**:
- フィードバックを提供し `/kiro:spec-requirements $1` を再実行

**注意**: 設計フェーズへ進む前に承認が必須。
