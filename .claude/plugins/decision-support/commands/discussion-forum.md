---
description: 複数ロールの議論を起動し、要約テンプレとログ保存先提案を出力する
argument-hint: [テーマ(任意)]
---

# Discussion Forum

## 目的
- `/discussion-forum` で議論を起動し、7ステップのワークフローに沿って進行する。
- 最終的に `summary.template.md` 形式の要約とログ保存先の提案を出す。

## 入力
1) テーマ（必須）
2) ゴール（必須）
3) 参加ロール（選択式、デフォルトあり）
4) ターン上限（任意、デフォルト3）

## デフォルト
- 参加ロール: `facilitator + architect + ops-cost`
- ターン上限: `3`

## 終了条件

### ターンの定義
- facilitator が要約（決定/保留/宿題）を出すまでを1ターンとする

### 通常終了
以下のいずれかで終了：
- ターン上限に到達
- facilitator が「収束した」と判断
- ユーザーが「終了」「クロージングへ」と指示

### 延長
- ユーザーが「続けて」と指示した場合、+1ターン延長

### 強制終了
- 10ターン到達で強制的にクロージングへ移行

## 実行手順

### Step 0: ドキュメント読み込み
以下のファイルを Read ツールで読み込み、内容に従って進行する：
- `.claude/plugins/decision-support/docs/forum/roles.md`
- `.claude/plugins/decision-support/docs/forum/workflow.md`
- `.claude/plugins/decision-support/docs/shared/summary.template.md`
- `.claude/plugins/decision-support/docs/shared/logging.md`

### Step 1: 入力の収集
- `$ARGUMENTS` があればテーマ候補として使う。
- テーマとゴールは必須。欠けている場合は質問して補完する。
- 参加ロールは `roles.md` の識別子から選ばせる（複数可）。
- 参加ロールが未指定ならデフォルトを採用する。
- ターン上限が未指定ならデフォルトを採用する。

### Step 2: 議論の開始宣言
- 目的/終了条件、参加ロール、ターン上限を明示する。
- 共通ルール（箇条書き3点以内、根拠を添える、推測は明示）を共有する。

### Step 3: ワークフロー準拠で進行
- `workflow.md` の7ステップに従って議論を進行する。
- 各ロールから順次意見を収集する。
- `facilitator` が各ターンで要約（決定/保留/宿題）と次の質問を提示する。

### Step 4: 終了時の要約出力
- `summary.template.md` に準拠して要約を生成する。
- 要約には「決定/保留/宿題」「理由」「代替案」「次アクション」を含める。

### Step 5: ログ保存の提案
- `logging.md` の命名規約に従い、保存先候補を提示する。
- 例: `docs/decisions/logs/YYYY-MM-DD-topic/summary.md`

## 期待する出力
- 議論の最終要約（テンプレ準拠）
- ログ保存先の提案
