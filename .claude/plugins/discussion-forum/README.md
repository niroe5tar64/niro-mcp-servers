# Discussion Forum Plugin

複数ロールによるAI議論（Multi-Agent Discussion）を起動するClaude Code Plugin。

## 使い方

```
/discussion-forum [テーマ]
```

## 機能

- 複数のAIロール（facilitator, architect, ops-cost等）が順次意見を出し合う
- 7ステップのワークフローに沿って議論を進行
- 最終的に構造化された要約を出力

## 構成

```
discussion-forum/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   └── discussion-forum.md    # Slash Command
├── docs/
│   ├── workflow.md            # 7ステップのワークフロー
│   ├── roles.md               # ロール定義
│   ├── logging.md             # ログ保存ルール
│   ├── summary.template.md    # 要約テンプレート
│   ├── evaluation.md          # 効果・課題の分析
│   └── prior-art.md           # 先行事例
└── README.md
```

## デフォルト設定

- 参加ロール: `facilitator + architect + ops-cost`
- ターン上限: 3（延長可能、最大10）

## ドキュメント

詳細は `docs/` 内のファイルを参照：

| ファイル | 内容 |
|----------|------|
| `workflow.md` | 議論の7ステップ |
| `roles.md` | 各ロールの責務と出力形式 |
| `evaluation.md` | この手法の効果と課題 |
| `prior-art.md` | 学術研究・商用事例 |
