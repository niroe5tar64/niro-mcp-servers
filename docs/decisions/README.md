# docs/decisions 運用ガイド

- 目的: プロダクト全体に関する重要な意思決定と議論ログを一箇所に残し、後から経緯と背景を追えるようにする。
- スコープ: アーキテクチャ、技術選定、運用方針、プロダクトの方向性など、影響範囲が大きいトピック。

## ディレクトリ構成

- `docs/decisions/README.md`: この運用ガイド。
- `docs/decisions/adr/`: 確定した決定事項を ADR 形式で保存。
- `docs/decisions/logs/`: 壁打ち・議論の簡易ログと必要に応じて詳細ログ。
- `docs/decisions/guide/`: 議論ログの運用ガイド（共通事項と各方式のルール）。

## ファイル命名

- ADR: `YYYY-MM-DD-topic.md` (例: `2024-05-18-choose-db.md`)
- 議論ログ（通常）: `YYYY-MM-DD-topic.md`
- 議論ログ（複数 Agent）: ディレクトリ `YYYY-MM-DD-topic/` を作り、要約は `summary.md` に置く。
- 生ログ（通常）: 要約と同じ階層に `YYYY-MM-DD-topic-raw.md`
- 生ログ（複数 Agent）: 要約と同じディレクトリに `01-role-raw.md` のように番号 + ロール名 + `-raw.md` で置く。

## ADR テンプレ

```markdown
---
status: Proposed | Accepted | Rejected | Superseded
date: YYYY-MM-DD
superseded_by: null # ADRファイル名（例: 2025-12-22-xxx.md）
tags: [arch, product, data, security, ops]
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

**注記**:
- `status` は `Proposed` (初期提案), `Accepted` (確定), `Rejected` (却下), `Superseded` (新しいADRで上書き) から選択
- `superseded_by` は `Superseded` の場合のみ新しいADRファイル名を記入
- タグはコンマ区切りではなく配列形式で記述
- YAMLフロントマターにより、メタデータを構造化・検索可能にする

## 議論ログテンプレ

- 通常ログ: `docs/decisions/guide/standard/summary.template.md`
- 複数エージェント: `docs/decisions/guide/multi-agent/summary.template.md`
- メモ: 複数 Agent 議論では `logs/YYYY-MM-DD-topic/summary.md` を使い、生ログは同階層に `01-role-raw.md` 形式で配置する。


## 運用ルール

- いつ書くか: 「方針が変わる/大きく決まる」「採用/不採用を決めた」「次の検討材料を整理した」タイミングで ADR またはログを追加。
- ADR とログの関係: 議論がまとまったら ADR に昇格し、ログから参照リンクを貼る。既存 ADR を更新する場合は「Superseded by」を明記。
- タグ: 検索性向上のため `Tags:` を付ける。迷ったら 2-3 個まで。
- コミットメッセージ: `[decisions] add adr ...` / `[decisions] add log ...` のようにプレフィックスを揃える。
- 見つけやすさ: 新しい ADR/ログを追加したら、この README 冒頭に「最近の追加」の小セクションを追記してもよい。

### ADR昇格基準

議論ログから ADR に昇格するかの判断基準。以下のいずれかを満たす場合は ADR 化を検討:

1. **具体的な決定がある**: Decision セクションに実装可能なアクションが記載されている
2. **影響範囲が広い**: 複数ファイル、複数パッケージ、または複数チームに影響する
3. **長期参照が必要**: 6ヶ月以上経っても参照される可能性がある（設計原則、技術選定など）

逆に、以下の場合は議論ログのままでよい:
- 一時的な検討や壁打ちの記録
- 決定が小規模で影響範囲が限定的
- 短期間で陳腐化する情報

## レビュー・運用フローの例

1) 議論後すぐに `logs/` にサマリ＋メモを追加（生ログは任意）。  
2) 方向性が固まったら 1-2 日内に ADR を作成し、PR で軽くレビュー。  
3) リリースやマイルストン前に ADR を棚卸しし、古いものは Supersede/Reject を更新。  
4) 定期的にタグ一覧を見直し、重複タグは整理。

## 当面の暫定ルール

- タグ: `docs/decisions/guide/tags.md` を参照。2-3 個まで。
- レビュー
  - ログ: レビューなしで即コミット可。必要なら後追いコメント。
  - ADR: PR を出し、1 名の LGTM。急ぎはセルフマージ可だが後で 1 コメントもらう。
  - Supersede/Reject: 変更対象 ADR にリンクを貼る。影響が大きい場合は 1 名レビュー。
