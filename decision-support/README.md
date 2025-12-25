# decision-support プラグイン

意思決定を支援するためのClaude Codeプラグイン。

## 提供コマンド

### `/discussion` - 1対1の壁打ち

思考を整理し、意思決定を支援する1対1の対話セッション。

**ワークフロー（5ステップ）**

1. 問題の明確化
2. 選択肢の洗い出し
3. 評価と比較
4. 意思決定
5. クロージング

**用途**

- シンプルな意思決定
- 思考の整理
- 選択肢の比較検討

### `/discussion-forum` - 複数ロール議論

複数の専門家ロールによる多角的な議論セッション。

**ワークフロー（7ステップ）**

1. 文脈説明
2. 初期意見収集
3. 反論・補足
4. トレードオフ確認
5. 推奨案作成
6. 合意チェック
7. クロージング

**参加ロール（デフォルト）**

- `facilitator` - 進行役
- `architect` - アーキテクト
- `ops-cost` - 運用・コスト

**用途**

- 複雑なアーキテクチャ選定
- トレードオフの明確化
- 多角的なレビュー

## ディレクトリ構成

```
.claude/plugins/decision-support/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── discussion.md
│   └── discussion-forum.md
├── docs/
│   ├── shared/           # 共通リソース
│   │   ├── logging.md
│   │   └── summary.template.md
│   ├── discussion/       # /discussion 用
│   │   └── workflow.md
│   └── forum/            # /discussion-forum 用
│       ├── workflow.md
│       ├── roles.md
│       ├── evaluation.md
│       └── prior-art.md
└── README.md
```

## 使い方

1. コマンドを実行: `/discussion テーマ` または `/discussion-forum テーマ`
2. テーマとゴールを入力（未指定の場合は質問される）
3. ワークフローに沿って議論を進行
4. 最終的に要約とログ保存先の提案を受け取る

## 関連ドキュメント

議論結果の要約に使用するタグ定義は `docs/decisions/guide/tags.md` を参照。
