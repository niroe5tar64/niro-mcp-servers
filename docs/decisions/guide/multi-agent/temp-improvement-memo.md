全体像の把握

目的

アーキテクチャ意思決定の記録・追跡システム + 複数AI Agentによる構造化された議論プロセスの構築

構成要素

docs/decisions/
├── README.md                    # 全体運用ガイド
├── adr/                         # （未作成）確定したADR
├── logs/                        # 議論ログの実体
│   └── 2025-12-22-multi-agent-discussion/
│       └── summary.md           # 実際の議論記録
└── guide/                       # 運用ガイド集約
    ├── README.md                # 共通ルール
    └── multi-agent/             # 複数Agent議論のガイド
        ├── README.md            # 概要
        ├── workflow.md          # 7ステップの進行手順
        ├── roles.md             # 5つのロール定義
        ├── logging.md           # ログ命名規約
        └── summary.template.md  # 要約テンプレート

本質的にやりたいこと

1. 意思決定の透明性確保: 「なぜその決定に至ったか」を後から追跡可能にする
2. 多視点からの検証: 単一視点の盲点を防ぐため、異なる専門性（PM、アーキ、運用、セキュリティ）で議論
3. 再現性のある議論プロセス: 毎回ゼロから考えず、定型化されたワークフローで効率的に議論

---
改善提案

🔴 構造的な問題

1. READMEテンプレートとsummary.templateの乖離

docs/decisions/README.md の議論ログテンプレート（45-65行）:
# YYYY-MM-DD topic
Summary (5-10 行で結論と論点を要約)
Participants: A, B
Tags: product, data, ux

summary.template.md:
---
date: 2025-12-22
topic: multi-agent POC
participants: [...]
tags: [...]
---

問題: どちらが正なのか不明確。フロントマターに統一したなら README も更新すべき。

2. ADRテンプレートの形式不統一

ADRテンプレートは本文中に Status:, Date:, Tags: を記述する形式だが、議論ログはYAMLフロントマター。

提案: ADRもフロントマターに統一
---
status: Proposed | Accepted | Rejected | Superseded
date: 2025-12-22
superseded_by: null  # or ADR ID
tags: [arch, product]
---

# Title

## Context
...

🟡 運用上の曖昧さ

3. 議論ログ → ADR への昇格基準が曖昧

README 72行目:
議論がまとまったら ADR に昇格し、ログから参照リンクを貼る

「まとまったら」の判断基準がない。

提案: 明確な昇格条件を定義
- ✅ 決定（Decision）セクションに具体的なアクションがある
- ✅ 複数ファイル/複数パッケージに影響する
- ✅ 6ヶ月以上参照される可能性がある

4. logs/ と multi-agent ガイドの役割が紛らわしい

- logs/2025-12-22-multi-agent-discussion/ は実際の議論ログ
- guide/multi-agent/ はガイド・テンプレート集

名前が似ていて混乱しやすい。

提案:
- multi-agent-discussion/ → _templates/multi-agent/ または guides/multi-agent/
- アンダースコア prefix で「メタ情報」と明示

5. ロール拡張のガイドラインがない

現在5ロール（facilitator, pm-ux, architect, ops-cost, risk-security）が定義されているが:
- 新ロール追加時の基準は？
- ロール間の責務境界が曖昧な場合は？
- 小規模議論で全ロール不要な場合の省略基準は？

提案: roles.md に追記
## ロール選定ガイド

### 必須ロール
- facilitator: 常に必要

### 推奨ロール（2つ以上選択）
- 技術変更 → architect + ops-cost
- ユーザー影響 → pm-ux + risk-security
- コスト影響 → ops-cost + architect

### ロール追加時の基準
- 既存ロールでカバーできない専門性がある
- 出力フォーマットを定義できる
- 他ロールと明確に責務が分離できる

🟢 細かい改善

6. summary.template.md の日付が固定値

date: 2025-12-22
topic: multi-agent POC

提案: プレースホルダーに変更
date: YYYY-MM-DD
topic: <議論トピック>

7. タグの例が散在

- README: arch, product, data, infra, security, ops, ux, process
- summary.template: arch, process, product
- 実際のログ: arch, product, process

提案: READMEのタグセットを正とし、テンプレートからは参照のみにする

8. 「Open / TODO」と「Log policy」セクションの位置

summary.template.md で Log policy が本文に混在している。これはテンプレートの説明であり、実際の議論ログには不要。

提案: テンプレートファイルを分離
- summary.template.md → 実際にコピーして使うテンプレート
- summary.template.guide.md または README 内にテンプレートの使い方を記載

---
優先度まとめ

| 対応 | 優先度 | 項目                                           | 理由                                   |
|------|--------|------------------------------------------------|----------------------------------------|
| ⏳   | 🔴 高  | READMEテンプレートの更新                       | 現状使われていない古い形式が残っている |
| ✅   | 🔴 高  | summary.template.md の日付をプレースホルダーに | 実運用で毎回編集忘れが起きる           |
| ⏳   | 🟡 中  | ADRテンプレートのフロントマター化              | 一貫性のため                           |
| ⏳   | 🟡 中  | ロール選定ガイドの追加                         | 運用の再現性向上                       |
| ⏳   | 🟢 低  | ディレクトリ名の見直し                         | 混乱防止だが既存パスの変更コストあり   |

🔴の2点を今すぐ修正しますか？
