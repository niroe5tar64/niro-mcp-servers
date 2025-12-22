# 未反映項目の修正案

このファイルは修正作業用の一時ファイルです。作業完了後に削除してください。

---

## 修正1: ADR昇格基準の明確化

### 対象ファイル
`docs/decisions/README.md`

### 修正箇所
62-68行目付近の「運用ルール」セクション

### 修正前
```markdown
## 運用ルール

- いつ書くか: 「方針が変わる/大きく決まる」「採用/不採用を決めた」「次の検討材料を整理した」タイミングで ADR またはログを追加。
- ADR とログの関係: 議論がまとまったら ADR に昇格し、ログから参照リンクを貼る。既存 ADR を更新する場合は「Superseded by」を明記。
```

### 修正後
```markdown
## 運用ルール

- いつ書くか: 「方針が変わる/大きく決まる」「採用/不採用を決めた」「次の検討材料を整理した」タイミングで ADR またはログを追加。
- ADR とログの関係: 議論がまとまったら ADR に昇格し、ログから参照リンクを貼る。既存 ADR を更新する場合は「Superseded by」を明記。

### ADR昇格基準

議論ログから ADR に昇格するかの判断基準。以下のいずれかを満たす場合は ADR 化を検討：

1. **具体的な決定がある**: Decision セクションに実装可能なアクションが記載されている
2. **影響範囲が広い**: 複数ファイル、複数パッケージ、または複数チームに影響する
3. **長期参照が必要**: 6ヶ月以上経っても参照される可能性がある（設計原則、技術選定など）

逆に、以下の場合は議論ログのままでよい：
- 一時的な検討や壁打ちの記録
- 決定が小規模で影響範囲が限定的
- 短期間で陳腐化する情報
```

---

## 修正2: タグの一貫性（テンプレート側）

### 対象ファイル
1. `docs/decisions/guide/multi-agent/summary.template.md`
2. `docs/decisions/guide/standard/summary.template.md`

### 修正方針
テンプレートのタグ例を削除し、`guide/tags.md` を参照するコメントを追加する。

---

### 修正2-A: multi-agent/summary.template.md

#### 修正前
```yaml
---
date: YYYY-MM-DD
topic: <topic>
participants:
  - facilitator
  - pm-ux
  - architect
  - ops-cost
  - risk-security
tags:
  - arch
  - process
  - product
---
```

#### 修正後
```yaml
---
date: YYYY-MM-DD
topic: <topic>
participants:
  - facilitator
  - pm-ux
  - architect
  - ops-cost
  - risk-security
tags: [] # guide/tags.md から選択
---
```

---

### 修正2-B: standard/summary.template.md

#### 修正前
```yaml
---
date: YYYY-MM-DD
topic: <topic>
participants:
  - name-1
tags:
  - product
---
```

#### 修正後
```yaml
---
date: YYYY-MM-DD
topic: <topic>
participants:
  - <name>
tags: [] # guide/tags.md から選択
---
```

---

## 修正3: タグ定義を独立ファイルに切り出し

### 新規作成ファイル
`docs/decisions/guide/tags.md`

### 内容
```markdown
# タグ定義

ADR・議論ログで使用するタグの一覧と意味。

## タグセット（暫定）

| タグ | 意味 |
|------|------|
| arch | システム/アプリのアーキテクチャ構成、設計原則、モジュール分割 |
| product | プロダクト方針、機能スコープ、ロードマップ |
| data | データモデリング、スキーマ設計、移行/品質/ガバナンス |
| infra | インフラ構成、クラウドサービス選定、ネットワーク/可用性設計 |
| security | 認証・認可、秘密管理、脆弱性対応、監査対応などセキュリティ方針 |
| ops | 運用・監視・SLO/SLA、デプロイ戦略、障害対応、運用プロセス |
| ux | 情報設計、UI/UX 方針、ユーザーフロー、アクセシビリティ |
| process | チームの開発プロセス、レビュールール、リリース手順、コミュニケーション運用 |

## 運用ルール

- 1つの ADR/ログに付けるタグは 2-3 個まで
- 迷ったら最も関連の強いものを1つ選ぶ
- 新しいタグが必要な場合は、このファイルに追加してからコミット

## タグ追加時の基準

1. **既存タグでカバーできないか確認**: 上記8タグで表現できないか検討
2. **汎用性があるか**: 今後も繰り返し使われる見込みがあるか
3. **他タグとの境界が明確か**: 責務が重複しないか
```

---

### 修正3-A: README.md からタグセクションを削除

#### 対象ファイル
`docs/decisions/README.md`

#### 削除するセクション（85-94行）
```markdown
## タグの意味（暫定）

- arch: システム/アプリのアーキテクチャ構成、設計原則、モジュール分割
- product: プロダクト方針、機能スコープ、ロードマップ
- data: データモデリング、スキーマ設計、移行/品質/ガバナンス
- infra: インフラ構成、クラウドサービス選定、ネットワーク/可用性設計
- security: 認証・認可、秘密管理、脆弱性対応、監査対応などセキュリティ方針
- ops: 運用・監視・SLO/SLA、デプロイ戦略、障害対応、運用プロセス
- ux: 情報設計、UI/UX 方針、ユーザーフロー、アクセシビリティ
- process: チームの開発プロセス、レビュールール、リリース手順、コミュニケーション運用
```

#### 修正後（「当面の暫定ルール」セクションを修正）
```markdown
## 当面の暫定ルール

- タグ: `docs/decisions/guide/tags.md` を参照。2-3 個まで。
- レビュー
  - ログ: レビューなしで即コミット可。必要なら後追いコメント。
  - ADR: PR を出し、1 名の LGTM。急ぎはセルフマージ可だが後で 1 コメントもらう。
  - Supersede/Reject: 変更対象 ADR にリンクを貼る。影響が大きい場合は 1 名レビュー。
```

---

### 修正3-B: guide/README.md にタグファイルへの参照を追加

#### 対象ファイル
`docs/decisions/guide/README.md`

#### 修正前
```markdown
# 議論ログ運用ガイド（共通）

- 目的: 議論ログの運用ルールとテンプレートを集約し、方式ごとの差分を明確にする。
- 使い方: 方式別ガイドを参照し、テンプレを `summary.md` にコピーして運用する。

## 方式別ガイド

- `docs/decisions/guide/standard/`: 通常の壁打ちログ用ガイド。
- `docs/decisions/guide/multi-agent/`: 複数エージェント議論用ガイド。

## 共通ルール

- ログ配置: `docs/decisions/logs/YYYY-MM-DD-topic/summary.md`
- 生ログが必要なら同ディレクトリに `NN-role-raw.md` で配置（例: `01-facilitator-raw.md`）。
```

#### 修正後
```markdown
# 議論ログ運用ガイド（共通）

- 目的: 議論ログの運用ルールとテンプレートを集約し、方式ごとの差分を明確にする。
- 使い方: 方式別ガイドを参照し、テンプレを `summary.md` にコピーして運用する。

## 方式別ガイド

- `standard/`: 通常の壁打ちログ用ガイド
- `multi-agent/`: 複数エージェント議論用ガイド

## 共通リソース

- `tags.md`: タグセットと意味の定義

## 共通ルール

- ログ配置: `docs/decisions/logs/YYYY-MM-DD-topic/summary.md`
- 生ログが必要なら同ディレクトリに `NN-role-raw.md` で配置（例: `01-facilitator-raw.md`）
- タグは `tags.md` から選択（2-3個まで）
```

---

## 作業チェックリスト

- [ ] `guide/tags.md` を新規作成
- [ ] `guide/README.md` にタグファイルへの参照を追加
- [ ] README.md に ADR昇格基準を追加
- [ ] README.md からタグセクションを削除し、参照に置き換え
- [ ] `multi-agent/summary.template.md` のタグを修正
- [ ] `standard/summary.template.md` のタグを修正
- [ ] `bun run check` でフォーマット確認
- [ ] このファイル (`temp-fix-proposal.md`) を削除
- [ ] コミット

## コミットメッセージ案

```
docs: ADR昇格基準を明確化し、タグ定義を独立ファイルに切り出し

- README.md に ADR昇格の具体的な判断基準を追加
- guide/tags.md を新規作成し、タグセットと運用ルールを集約
- README.md からタグセクションを削除し、参照に変更
- summary.template.md のタグ例を削除し、tags.md への参照に変更
```
