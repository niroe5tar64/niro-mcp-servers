# AI-DLC と仕様駆動開発

Kiro スタイル仕様駆動開発の AI-DLC（AI Development Life Cycle）実装

## プロジェクトコンテキスト

### パス
- ステアリング: `.kiro/steering/`
- 仕様: `.kiro/specs/`

### ステアリング vs 仕様

**ステアリング** (`.kiro/steering/`) - プロジェクト全体のルールとコンテキストで AI をガイド
**仕様** (`.kiro/specs/`) - 個別機能の開発プロセスを形式化

### アクティブな仕様
- アクティブな仕様は `.kiro/specs/` を確認
- 進捗確認は `/kiro:spec-status [feature-name]` を使用

## 開発ガイドライン
- 英語で思考し、日本語で応答を生成する。プロジェクトファイル（requirements.md、design.md、tasks.md、research.md、検証レポートなど）に書き込まれるすべての Markdown コンテンツは、この仕様に設定されたターゲット言語で書く必要がある（spec.json.language を参照）。

## 最小ワークフロー
- Phase 0（オプション）: `/kiro:steering`, `/kiro:steering-custom`
- Phase 1（仕様策定）:
  - `/kiro:spec-init "description"`
  - `/kiro:spec-requirements {feature}`
  - `/kiro:validate-gap {feature}`（オプション: 既存コードベース向け）
  - `/kiro:spec-design {feature} [-y]`
  - `/kiro:validate-design {feature}`（オプション: 設計レビュー）
  - `/kiro:spec-tasks {feature} [-y]`
- Phase 2（実装）: `/kiro:spec-impl {feature} [tasks]`
  - `/kiro:validate-impl {feature}`（オプション: 実装後）
- 進捗確認: `/kiro:spec-status {feature}`（いつでも使用可能）

## 開発ルール
- 3 フェーズ承認ワークフロー: 要件 → 設計 → タスク → 実装
- 各フェーズで人間によるレビューが必要。意図的にファストトラックする場合のみ `-y` を使用
- ステアリングを最新に保ち、`/kiro:spec-status` で整合性を検証
- ユーザーの指示に正確に従い、そのスコープ内で自律的に行動する: 必要なコンテキストを収集し、要求された作業をこの実行で最後まで完了させる。質問は必須情報が欠けている場合や指示が致命的に曖昧な場合のみ行う。

## ステアリング設定
- `.kiro/steering/` 全体をプロジェクトメモリとして読み込む
- デフォルトファイル: `product.md`, `tech.md`, `structure.md`
- カスタムファイルをサポート（`/kiro:steering-custom` で管理）
