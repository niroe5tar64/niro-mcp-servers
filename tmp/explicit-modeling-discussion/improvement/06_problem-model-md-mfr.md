# 変更案の具体化: problem-model.md 新設

目的: 問題モデルの単一の真実を確立し、requirements/designの重複と不整合を防ぐ。

## ファイル構成案

- 位置: `.kiro/specs/{feature}/problem-model.md`
- 参照: requirements.md と design.md からリンクする

## セクション案（ドラフト）

```
# 問題モデル（MFR）

## エンティティ
- E1: {{ENTITY_NAME}} - {{DESCRIPTION}}
- E2: {{ENTITY_NAME}} - {{DESCRIPTION}}

## 状態変数
- S1: {{STATE_VAR}} (対象: {{ENTITY}} / 型・範囲: {{TYPE_OR_RANGE}})
- S2: {{STATE_VAR}} (対象: {{ENTITY}} / 型・範囲: {{TYPE_OR_RANGE}})

## 行動（前提/効果）
- A1: {{ACTION_NAME}}
  - 前提: {{PRECONDITIONS}}
  - 効果: {{EFFECTS}}
- A2: {{ACTION_NAME}}
  - 前提: {{PRECONDITIONS}}
  - 効果: {{EFFECTS}}

## 制約
- C1: {{CONSTRAINT}}
- C2: {{CONSTRAINT}}

## 状態遷移（必要な場合のみ）
- 図: Mermaid/表など
- 不変条件: {{INVARIANTS}}

## モデル変更履歴
- YYYY-MM-DD: {{CHANGE_SUMMARY}} (理由: {{RATIONALE}})
```

## requirements/design への参照例

- requirements.md: 「問題モデルは `problem-model.md` を参照」
- design.md: 「問題モデルは `problem-model.md` を参照。設計への反映は本書で補足」

## 運用ルール案

- モデルの更新は `problem-model.md` を起点に行う。
- requirements/design は参照と反映箇所の記述に留める。
- モデル変更時は履歴に理由を記録する。
