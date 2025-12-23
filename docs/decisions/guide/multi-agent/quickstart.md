# クイックスタート（5分で始める）

目的: 初めてのメンバーが `/discussion-forum` を使って最初の議論を開始できるようにする。

## 事前準備
- テーマとゴールを 1 行ずつ用意する
- 参加ロールを 1 つ選ぶ（例: `architect` か `pm-ux`）

## 最小構成で始める（facilitator + 1ロール）

1) コマンドを実行
```
/discussion-forum <テーマ>
```

2) 質問に回答
- テーマ: 例) `confluence-content のキャッシュ方針`
- ゴール: 例) `TTL と責務分離の方針を決める`
- 参加ロール: `facilitator, architect`（最小構成）
- ターン上限: 5（デフォルト）

3) 進行
- `workflow.md` の 7 ステップに沿って進行する
- `facilitator` が各ターンで要約（決定/保留/宿題）を返す

4) 終了時に要約とログ保存先が提示される
- 要約は `summary.template.md` 形式
- 保存先は `logging.md` の命名規約に準拠

## コマンド実行例
```
/discussion-forum confluence-content のキャッシュ方針
```

## FAQ
Q: ロールを増やしたい  
A: `roles.md` の識別子から追加する（例: `ops-cost`, `risk-security`）。

Q: ターン数を変えたい  
A: 起動時に指定する（例: `ターン上限 3`）。

Q: ログはどこに置く？  
A: `docs/decisions/logs/YYYY-MM-DD-topic/summary.md` に保存する。

## トラブルシューティング
- テーマやゴールが未指定: 質問に回答して補完する
- 収束しない: 論点を 2-3 個に絞り、並列取得は必要時だけにする
- 要約が曖昧: 決定/保留/宿題の基準を明示する
