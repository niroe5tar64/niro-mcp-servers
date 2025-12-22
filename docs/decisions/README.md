# docs/decisions 運用ガイド

- 目的: プロダクト全体に関する重要な意思決定と議論ログを一箇所に残し、後から経緯と背景を追えるようにする。
- スコープ: アーキテクチャ、技術選定、運用方針、プロダクトの方向性など、影響範囲が大きいトピック。

## ディレクトリ構成

- `docs/decisions/README.md`: この運用ガイド。
- `docs/decisions/adr/`: 確定した決定事項を ADR 形式で保存。
- `docs/decisions/logs/`: 壁打ち・議論の簡易ログと必要に応じて詳細ログ。

## ファイル命名

- ADR: `YYYY-MM-DD-topic.md` (例: `2024-05-18-choose-db.md`)
- 議論ログ: `YYYY-MM-DD-topic.md`
- ログの生ログ付き版: `YYYY-MM-DD-topic-raw.md` (要約 + raw 貼り付け)

## ADR テンプレ

```
# Title
Status: Proposed | Accepted | Rejected | Superseded by <id>
Date: YYYY-MM-DD
Tags: arch, product, data, security, ops (カンマ区切り)

Context
- 背景・課題・制約を書く

Decision
- 採用する方針を短く箇条書き

Consequences
- 効果と副作用、追加コストを書く

Alternatives
- 検討したが採用しなかった案と理由

Next Steps
- チケットや担当があれば書く
```

## 議論ログテンプレ

````
# YYYY-MM-DD topic
Summary (5-10 行で結論と論点を要約)
- ...

Participants: A, B (optional)
Tags: product, data, ux (必要なら)

Decision (あれば)
- ...

Notes
- 箇条書きで議事録的にメモ

Raw (必要な場合のみ)
```text
ここに生ログを貼る
```
````

## 運用ルール

- いつ書くか: 「方針が変わる/大きく決まる」「採用/不採用を決めた」「次の検討材料を整理した」タイミングで ADR またはログを追加。
- ADR とログの関係: 議論がまとまったら ADR に昇格し、ログから参照リンクを貼る。既存 ADR を更新する場合は「Superseded by」を明記。
- タグ: 検索性向上のため `Tags:` を付ける。迷ったら 2-3 個まで。
- コミットメッセージ: `[decisions] add adr ...` / `[decisions] add log ...` のようにプレフィックスを揃える。
- 見つけやすさ: 新しい ADR/ログを追加したら、この README 冒頭に「最近の追加」の小セクションを追記してもよい。

## レビュー・運用フローの例

1) 議論後すぐに `logs/` にサマリ＋メモを追加（生ログは任意）。  
2) 方向性が固まったら 1-2 日内に ADR を作成し、PR で軽くレビュー。  
3) リリースやマイルストン前に ADR を棚卸しし、古いものは Supersede/Reject を更新。  
4) 定期的にタグ一覧を見直し、重複タグは整理。

## 当面の暫定ルール

- タグセット（暫定）: arch, product, data, infra, security, ops, ux, process
- レビュー
  - ログ: レビューなしで即コミット可。必要なら後追いコメント。
  - ADR: PR を出し、1 名の LGTM。急ぎはセルフマージ可だが後で 1 コメントもらう。
  - Supersede/Reject: 変更対象 ADR にリンクを貼る。影響が大きい場合は 1 名レビュー。

## タグの意味（暫定）

- arch: システム/アプリのアーキテクチャ構成、設計原則、モジュール分割
- product: プロダクト方針、機能スコープ、ロードマップ
- data: データモデリング、スキーマ設計、移行/品質/ガバナンス
- infra: インフラ構成、クラウドサービス選定、ネットワーク/可用性設計
- security: 認証・認可、秘密管理、脆弱性対応、監査対応などセキュリティ方針
- ops: 運用・監視・SLO/SLA、デプロイ戦略、障害対応、運用プロセス
- ux: 情報設計、UI/UX 方針、ユーザーフロー、アクセシビリティ
- process: チームの開発プロセス、レビュールール、リリース手順、コミュニケーション運用
