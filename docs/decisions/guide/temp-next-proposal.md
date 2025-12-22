# 未反映項目の修正案（次の改善）

このファイルは修正作業用の一時ファイルです。作業完了後に削除してください。

---

## 改善1: ADRテンプレートのフロントマター化

### 対象ファイル
`docs/decisions/README.md`

### 目的
議論ログと ADR の形式を合わせ、メタ情報をフロントマターに統一する。

### 修正案（ADRテンプレ）
```markdown
---
status: Proposed | Accepted | Rejected | Superseded
date: YYYY-MM-DD
superseded_by: <id or null>
tags: [] # guide/tags.md から選択
---

# Title

## Context
- 背景・課題・制約を書く

## Decision
- 採用する方針を短く箇条書き

## Consequences
- 効果と副作用、追加コストを書く

## Alternatives
- 検討したが採用しなかった案と理由

## Next Steps
- チケットや担当があれば書く
```

---

## 改善2: ロール選定ガイドの追加

### 対象ファイル
`docs/decisions/guide/multi-agent/roles.md`

### 目的
議論規模や論点に応じたロール選定の指針を追加する。

### 追記案
```markdown
## ロール選定ガイド

### 必須
- `facilitator`: 常に必要

### 推奨（2つ以上選択）
- 技術変更が主: `architect` + `ops-cost`
- ユーザー影響が大きい: `pm-ux` + `risk-security`
- コスト影響が大きい: `ops-cost` + `architect`

### ロール追加の基準
- 既存ロールでカバーできない専門性がある
- 出力フォーマットを明確に定義できる
- 他ロールとの責務境界が明確である
```

---

## 改善3: Log policy の扱い整理

### 対象ファイル
1. `docs/decisions/guide/standard/summary.template.md`
2. `docs/decisions/guide/multi-agent/summary.template.md`
3. `docs/decisions/guide/README.md` もしくは各ガイド

### 目的
テンプレ本文に運用説明が混ざるのを避ける。

### 修正案
- テンプレから `## Log policy` セクションを削除
- 代わりに `guide/README.md` に「生ログ命名・配置」ルールを明記

---

## 作業チェックリスト

- [ ] README の ADRテンプレをフロントマターに変更
- [ ] roles.md にロール選定ガイドを追加
- [ ] テンプレから Log policy を削除
- [ ] guide/README.md（または各ガイド）に Log policy を集約
- [ ] このファイル (`temp-next-proposal.md`) を削除
- [ ] コミット
