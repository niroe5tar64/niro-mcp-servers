---
description: 詳細なプロジェクト説明から新しい仕様を初期化する
allowed-tools: Bash, Read, Write, Glob
argument-hint: <project-description>
---

# 仕様初期化

<background_information>
- **使命**: 仕様駆動開発の最初のフェーズとして、新しい仕様のディレクトリ構成とメタデータを作成する
- **成功基準**:
  - プロジェクト説明から適切な機能名を生成する
  - 競合しない一意な仕様構造を作成する
  - 次フェーズ（要件生成）への明確な導線を提供する
</background_information>

<instructions>
## コアタスク
プロジェクト説明（$ARGUMENTS）から一意な機能名を生成し、仕様構造を初期化する。

## 実行手順
1. **一意性の確認**: `.kiro/specs/` で命名競合を確認（必要なら数値サフィックスを付与）
2. **ディレクトリ作成**: `.kiro/specs/[feature-name]/`
3. **テンプレートからファイルを初期化**:
   - `.kiro/settings/templates/specs/init.json` を読む
   - `.kiro/settings/templates/specs/requirements-init.md` を読む
   - プレースホルダを置換:
     - `{{FEATURE_NAME}}` → 生成した機能名
     - `{{TIMESTAMP}}` → 現在の ISO 8601 タイムスタンプ
     - `{{PROJECT_DESCRIPTION}}` → $ARGUMENTS
   - spec ディレクトリに `spec.json` と `requirements.md` を書き込む

## 重要な制約
- この段階では要件/設計/タスクを生成しない
- フェーズごとの開発原則を遵守
- 厳密なフェーズ分離を維持
- このフェーズでは初期化のみを行う
</instructions>

## ツールガイダンス
- **Glob**: 既存の spec ディレクトリを確認し一意性を確保
- **Read**: テンプレートを取得: `init.json` と `requirements-init.md`
- **Write**: プレースホルダ置換後に spec.json と requirements.md を作成
- 書き込み前に検証を行う

## 出力説明
spec.json で指定された言語で以下の構成で出力する:

1. **生成された機能名**: `feature-name` 形式と 1-2 文の理由
2. **プロジェクト要約**: 1 文の簡潔な要約
3. **作成ファイル**: フルパスの箇条書き
4. **次のステップ**: `/kiro:spec-requirements <feature-name>` のコマンドブロック
5. **注意**: 初期化のみを行った理由（フェーズ分離の説明を 2-3 文）

**形式要件**:
- Markdown の見出し（##, ###）を使用
- コマンドはコードブロックで囲む
- 出力は 250 語以内で簡潔に
- spec.json.language に沿った明確で専門的な表現

## セーフティ & フォールバック
- **曖昧な機能名**: 2-3 案を提示しユーザーに選択を依頼
- **テンプレート欠如**: `.kiro/settings/templates/specs/` に無い場合、欠落ファイルパスを示してエラー報告
- **ディレクトリ競合**: 既存なら `-2` などのサフィックスを付け、解決した旨を通知
- **書き込み失敗**: 失敗パスを示し、権限やディスク容量の確認を案内
