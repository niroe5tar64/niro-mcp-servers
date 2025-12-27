---
description: 要件と既存コードベースの実装ギャップを分析する
allowed-tools: Read, Task
argument-hint: <feature-name>
---

# 実装ギャップ検証

## 引数の解析
- 機能名: `$1`

## 検証
要件が完了していることを確認する:
- `.kiro/specs/$1/` が存在すること
- `.kiro/specs/$1/requirements.md` が存在すること

検証に失敗した場合は、先に要件フェーズを完了するよう案内する。

## サブエージェントの起動

validate-gap-agent にギャップ分析を委譲する:

Task ツールで Subagent を呼び出し、読み取り対象のファイルパターンを渡す:

```
Task(
  subagent_type="validate-gap-agent",
  description="Analyze implementation gap",
  prompt="""
Feature: $1
Spec directory: .kiro/specs/$1/

File patterns to read:
- .kiro/specs/$1/spec.json
- .kiro/specs/$1/requirements.md
- .kiro/steering/*.md
- .kiro/settings/rules/gap-analysis.md
"""
)
```

## 結果の表示

Subagent のサマリーを表示し、次のステップを案内する:

### 次フェーズ: 設計生成

**ギャップ分析が完了した場合**:
- 分析結果をレビュー
- `/kiro:spec-design $1` で技術設計ドキュメントを作成
- または `/kiro:spec-design $1 -y` で要件を自動承認して進む

**注意**: ギャップ分析は任意だが、既存システム向けに推奨。設計判断に役立つ。
