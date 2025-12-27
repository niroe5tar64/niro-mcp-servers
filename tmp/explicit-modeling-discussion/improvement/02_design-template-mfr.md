# 変更案の具体化: designテンプレ

目的: 要件段階の問題モデルを確定し、設計要素にどう反映されるかを明示する。

## 追加位置

- 「概要」の後、または「アーキテクチャ」の直前に配置。
- 既存の「データモデル」セクションと近い位置に置くと整合確認がしやすい。

## セクション案（ドラフト）

```
## 問題モデル確定（MFR）

### モデル参照
- 参照: {{REQUIREMENTS_MODEL_REF}} 例: requirements.md#問題モデル
- 変更点: {{MODEL_DELTAS}} 例: 状態変数S2の追加、制約C3の明文化

### エンティティ（確定版）
- {{ENTITY_1}}: {{DESCRIPTION}}
- {{ENTITY_2}}: {{DESCRIPTION}}

### 状態変数（確定版）
- {{STATE_VAR_1}}: {{APPLIES_TO}}, {{TYPE_OR_RANGE}}, {{SOURCE_OF_TRUTH}}
- {{STATE_VAR_2}}: {{APPLIES_TO}}, {{TYPE_OR_RANGE}}, {{SOURCE_OF_TRUTH}}

### 行動と設計要素の対応
- {{ACTION_1}}
  - 前提: {{PRECONDITIONS}}
  - 効果: {{EFFECTS}}
  - 実装箇所: {{COMPONENT_OR_API}}
- {{ACTION_2}}
  - 前提: {{PRECONDITIONS}}
  - 効果: {{EFFECTS}}
  - 実装箇所: {{COMPONENT_OR_API}}

### 制約と担保手段
| 制約ID | 制約内容 | 担保手段 | 実装箇所 | テスト |
|---|---|---|---|---|
| C1 | {{CONSTRAINT}} | {{VALIDATION_OR_DB_OR_FLOW}} | {{LOCATION}} | {{TEST_ID}} |
| C2 | {{CONSTRAINT}} | {{VALIDATION_OR_DB_OR_FLOW}} | {{LOCATION}} | {{TEST_ID}} |

### 状態遷移（必要な場合のみ）
- 図: Mermaid/表など
- 不変条件: {{INVARIANTS}}
```

## 記載ルール

- 要件モデルからの変更点（追加/削除/修正）を明記する。
- 制約はIDを付けて一貫参照する（例: C1, C2）。
- 「担保手段」は実装/DB/フロー/テストのどれで守るかを明示する。
- 迷ったら「制約→状態変数→行動→エンティティ」の順で詰める。
