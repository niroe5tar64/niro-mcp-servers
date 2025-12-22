# ログ運用（命名と配置）

## ディレクトリ構造

- `docs/decisions/logs/YYYY-MM-DD-topic/`
  - `summary.md`: 要約ログ（決定/保留/宿題、理由と代替案、次アクションを含める）
  - `NN-role-raw.md`: 生ログ。`NN` は議論順の番号、`role` は識別子（例: `01-facilitator-raw.md`）

## 命名

- ディレクトリ: `YYYY-MM-DD-topic`（スペースはハイフン、短めのトピック名）
- 要約: `summary.md`
- 生ログ: `NN-role-raw.md`（`01-` から始め、並列取得なら同じ番号＋異なるロール）

## フロントマター（要約）

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

## 運用メモ

- 並列生成を行う場合は、同じ番号でロール違いの生ログを並べる（例: `02-architect-raw.md`, `02-risk-security-raw.md`）。
- 要約には必ず「決定/保留/宿題」「採用理由」「代替案」「次アクション」を含める。
- 生ログ不要な場合は `summary.md` のみでよいが、判断根拠が必要そうなときは要点だけでも `NN-role-raw.md` に残す。
