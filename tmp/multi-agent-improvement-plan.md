# Multi-Agent会議機能 整備手順書

## 概要

複数Agent会議をチームで簡単に利用できるようにするための整備計画。

---

## Phase 1: Skill/Command定義（最優先）

### 目的
`/discussion-forum` コマンドで議論を開始できるようにする

### 作成ファイル
```
.claude/commands/discussion-forum.md
```

### 実装内容
1. コマンド起動時の入力収集
   - テーマ（必須）
   - ゴール（必須）
   - 参加ロール（選択式、デフォルトあり）
   - ターン上限（オプション、デフォルト5）

2. 議論開始プロンプトの自動生成
   - roles.md からロール定義を読み込み
   - workflow.md の7ステップに従って進行

3. 終了時の出力
   - summary.template.md 形式で要約を生成
   - logging.md の命名規約に従ってログ保存を提案

### 完了条件
- [x] `/discussion-forum` で議論が開始できる
- [x] 入力なしでもデフォルト値で動作する
- [x] 終了時に要約が出力される

---

## Phase 2: クイックスタートガイド

### 目的
初めてのチームメンバーが5分で使い始められるようにする

### 作成ファイル
```
docs/decisions/guide/multi-agent/quickstart.md
```

### 実装内容
1. 最小構成での使い方（facilitator + 1ロール）
2. コマンド実行例
3. よくある質問（FAQ）
4. トラブルシューティング

### 完了条件
- [x] ドキュメントを読んで5分以内に最初の議論を開始できる
- [x] Skill定義と整合性が取れている

---

## Phase 3: 実行例・サンプル

### 目的
期待される出力をイメージできるようにする

### 作成ファイル
```
docs/decisions/guide/multi-agent/examples/
├── README.md              # サンプル一覧
├── architecture-review.md # アーキテクチャレビューの例
└── feature-discussion.md  # 機能検討の例
```

### 実装内容
1. 実際の議論ログ（または模擬ログ）
2. 各ステップでの出力例
3. 良い議論と悪い議論の比較（オプション）

### 完了条件
- [ ] 2つ以上のサンプルがある
- [ ] 各サンプルで7ステップ全てが含まれる

---

## Phase 4: フィードバックテンプレート

### 目的
改善サイクルを回すためのデータ収集

### 作成ファイル
```
docs/decisions/guide/multi-agent/feedback.template.md
```

### 実装内容
1. 議論のメタデータ（日時、テーマ、参加ロール）
2. 効果の評価（5段階）
3. 定性フィードバック
   - 良かった点
   - 改善点
   - 次回への提案

### 完了条件
- [ ] テンプレートが存在する
- [ ] 記入に5分以上かからない

---

## 実行順序

```
Phase 1 → Phase 2 → Phase 3 → Phase 4
   ↓
  動作確認（チーム内で1-2回試用）
   ↓
  フィードバック収集
   ↓
  改善
```

---

## 次のアクション

Phase 1 を開始する場合は、以下を決定：

1. コマンド名: `/discussion-forum` に確定
2. デフォルトロール: `facilitator + architect + ops-cost` に確定
3. デフォルトターン上限: 5ターンに確定

---

## 参照ドキュメント

- `docs/decisions/guide/multi-agent/workflow.md` - 7ステップのワークフロー
- `docs/decisions/guide/multi-agent/roles.md` - ロール定義
- `docs/decisions/guide/multi-agent/logging.md` - ログ命名規約
- `docs/decisions/guide/multi-agent/summary.template.md` - 要約テンプレート
- `docs/decisions/guide/multi-agent/evaluation.md` - 効果・課題・価値の整理
- `docs/decisions/guide/multi-agent/prior-art.md` - 先行事例
