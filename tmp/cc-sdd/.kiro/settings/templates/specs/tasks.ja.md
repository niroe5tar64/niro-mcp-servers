# 実装計画

## タスク形式テンプレート

作業分解に合うパターンを使う:

### 大タスクのみ
- [ ] {{NUMBER}}. {{TASK_DESCRIPTION}}{{PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}} *(詳細が必要な場合のみ記載。タスクが単独で完結するなら箇条書きを省略する。)*
  - _要件: {{REQUIREMENT_IDS}}_

### 大タスク + サブタスク構成
- [ ] {{MAJOR_NUMBER}}. {{MAJOR_TASK_SUMMARY}}
- [ ] {{MAJOR_NUMBER}}.{{SUB_NUMBER}} {{SUB_TASK_DESCRIPTION}}{{SUB_PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}}
  - {{DETAIL_ITEM_2}}
  - _要件: {{REQUIREMENT_IDS}}_ *(ID のみ。説明や括弧は追加しない。)*

> **並列マーカー**: 並列実行できるタスクにのみ ` (P)` を付ける。`--sequential` モードではマーカーを付けない。
>
> **任意のテストカバレッジ**: 受け入れ基準に紐づく後回し可能なテスト作業には `- [ ]*` を付け、詳細項目で参照する要件を説明する。
