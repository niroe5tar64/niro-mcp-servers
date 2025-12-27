# 変更案の具体化: tasksテンプレ

目的: 実装タスクが問題モデルから逸脱しないよう、各タスクにモデル参照を付ける。

## 追加位置

- 各タスク行の直下に「モデル参照」欄を追加する。
- 既存の要件ID記載欄と並べると追跡しやすい。

## セクション案（ドラフト）

### 大タスクのみ

```
- [ ] {{NUMBER}}. {{TASK_DESCRIPTION}}{{PARALLEL_MARK}}
  - モデル参照: Entities={{ENTITIES}}; States={{STATE_VARS}}; Actions={{ACTIONS}}; Constraints={{CONSTRAINTS}}
  - {{DETAIL_ITEM_1}}
  - _要件: {{REQUIREMENT_IDS}}_
```

### 大タスク + サブタスク構成

```
- [ ] {{MAJOR_NUMBER}}. {{MAJOR_TASK_SUMMARY}}
- [ ] {{MAJOR_NUMBER}}.{{SUB_NUMBER}} {{SUB_TASK_DESCRIPTION}}{{SUB_PARALLEL_MARK}}
  - モデル参照: Entities={{ENTITIES}}; States={{STATE_VARS}}; Actions={{ACTIONS}}; Constraints={{CONSTRAINTS}}
  - {{DETAIL_ITEM_1}}
  - {{DETAIL_ITEM_2}}
  - _要件: {{REQUIREMENT_IDS}}_
```

## 記載ルール

- 参照はIDで書く（例: Entities=E1,E2 / States=S1,S2 / Actions=A1 / Constraints=C1,C3）。
- モデル要素が未定義の場合は明示的に TODO を置く。
- 要件IDが複数ある場合は、最も関連が強いモデル要素に寄せる。
