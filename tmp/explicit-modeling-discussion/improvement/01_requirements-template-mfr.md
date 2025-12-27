# 変更案の具体化: requirementsテンプレ

目的: 要件の段階で「問題モデル」を明示化し、受け入れ基準と制約の抜け漏れを減らす。

## 追加位置

- 「はじめに」の直後、もしくは「要件」セクションの直前。

## セクション案（ドラフト）

```
## 問題モデル（MFR）

### エンティティ
- {{ENTITY_1}}: {{DESCRIPTION}}
- {{ENTITY_2}}: {{DESCRIPTION}}

### 状態変数
- {{STATE_VAR_1}}: {{APPLIES_TO}}, {{TYPE_OR_RANGE}}
- {{STATE_VAR_2}}: {{APPLIES_TO}}, {{TYPE_OR_RANGE}}

### 行動（前提/効果）
- {{ACTION_1}}
  - 前提: {{PRECONDITIONS}}
  - 効果: {{EFFECTS}}
- {{ACTION_2}}
  - 前提: {{PRECONDITIONS}}
  - 効果: {{EFFECTS}}

### 制約
- C1: {{CONSTRAINT}}
- C2: {{CONSTRAINT}}
```

## 記載ルール

- 受け入れ基準をモデル要素に分解できる粒度で書く。
- 前提/効果は制約に影響する部分だけに絞る。
- 迷ったら「制約→状態変数→行動→エンティティ」の順で埋める。
