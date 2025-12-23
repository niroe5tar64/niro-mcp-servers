---
description: 複数ロールの議論を開始し、所定フォーマットの要約とログ保存提案を出力する
allowed-tools: Bash(sed:*), Bash(cat:*), Bash(rg:*)
argument-hint: [テーマ(任意)]
---

# Multi-Agent Meeting

## 目的
- `/multi-agent-meeting` で議論を起動し、7ステップのワークフローに沿って進行する。
- 最終的に `summary.template.md` 形式の要約と、ログ保存先の提案を出す。

## 入力
1) テーマ（必須）
2) ゴール（必須）
3) 参加ロール（選択式、デフォルトあり）
4) ターン上限（任意、デフォルト5）

## 参照ドキュメント
- `docs/decisions/guide/multi-agent/roles.md`
- `docs/decisions/guide/multi-agent/workflow.md`
- `docs/decisions/guide/multi-agent/summary.template.md`
- `docs/decisions/guide/multi-agent/logging.md`

## デフォルト
- 参加ロール: `facilitator + architect + ops-cost`
- ターン上限: `5`

## 実行手順

### Step 0: 入力の収集
- `$ARGUMENTS` があればテーマ候補として使う。
- 不足する項目は質問して埋める。
- 参加ロールは `roles.md` の識別子から選ばせる（複数可）。
- 参加ロールが未指定ならデフォルトを採用する。
- ターン上限が未指定ならデフォルトを採用する。

### Step 1: 議論の開始宣言
- 目的/終了条件、参加ロール、ターン上限を明示する。
- 共通ルール（箇条書き3点以内、根拠を添える、推測は明示）を共有する。

### Step 2: ワークフロー準拠で進行
- `workflow.md` の7ステップに従って議論を進行する。
- 並列取得が必要なステップは、対象ロールごとに意見を集める。
- `facilitator` が各ターンで要約（決定/保留/宿題）と次の質問を提示する。

### Step 3: 終了時の要約出力
- `summary.template.md` に準拠して要約を生成する。
- 要約には「決定/保留/宿題」「理由」「代替案」「次アクション」を含める。

### Step 4: ログ保存の提案
- `logging.md` の命名規約に従い、保存先候補を提示する。
- 例: `docs/decisions/logs/YYYY-MM-DD-topic/summary.md`

## 期待する出力
- 議論の最終要約（テンプレ準拠）
- ログ保存先の提案
