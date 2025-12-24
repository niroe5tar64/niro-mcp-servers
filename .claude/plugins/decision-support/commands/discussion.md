---
description: 1対1の壁打ちで思考を整理し、意思決定を支援する
argument-hint: [テーマ(任意)]
---

# Discussion

## 目的
- `/discussion` で1対1の壁打ちを開始し、思考の整理と意思決定を支援する。
- 最終的に `summary.template.md` 形式の要約とログ保存先の提案を出す。

## 入力
1) テーマ（必須）
2) ゴール/決めたいこと（必須）
3) 制約・前提条件（任意）

## 実行手順

### Step 0: ドキュメント読み込み
以下のファイルを Read ツールで読み込み、内容に従って進行する：
- `.claude/plugins/decision-support/docs/discussion/workflow.md`
- `.claude/plugins/decision-support/docs/shared/summary.template.md`
- `.claude/plugins/decision-support/docs/shared/logging.md`

### Step 1: 入力の収集
- `$ARGUMENTS` があればテーマ候補として使う。
- テーマとゴールは必須。欠けている場合は質問して補完する。
- 制約・前提条件があれば確認する。

### Step 2: ワークフロー準拠で進行
- `workflow.md` の5ステップに従って議論を進行する。
- ユーザーとの対話を通じて思考を整理する。

### Step 3: 終了時の要約出力
- `summary.template.md` に準拠して要約を生成する。
- 要約には「決定/保留/宿題」「理由」「代替案」「次アクション」を含める。

### Step 4: ログ保存の提案
- `logging.md` の命名規約に従い、保存先候補を提示する。
- 例: `docs/decisions/logs/YYYY-MM-DD-topic/summary.md`

## 期待する出力
- 議論の最終要約（テンプレ準拠）
- ログ保存先の提案
