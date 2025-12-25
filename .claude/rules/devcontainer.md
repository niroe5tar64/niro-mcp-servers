---
paths:
  - .devcontainer/**
  - Dockerfile.dev
  - docker-compose.dev.yml
---

# DevContainer環境ガイドライン

## 概要

このプロジェクトはDevContainer内でClaude Codeを実行するように設計されています。
チーム全体で統一された開発環境を提供しつつ、個人のカスタマイズも可能なハイブリッド構成を採用しています。

## 設定管理の方針（ハイブリッド構成）

Claude Codeの設定は2つの場所で管理されます：

### チーム共有設定

- **場所**: `/workspace/.claude/settings.json`
- **管理方法**: Git（リポジトリにコミット）
- **用途**: プラグイン、MCPサーバーなど、チーム全体で共有すべき設定
- **環境変数**: `CLAUDE_SETTINGS_PATH=/workspace/.claude/settings.json`

### 個人設定

- **場所**: `~/.claude/`
- **管理方法**: Docker volume（`niro-mcp-claude-data`）
- **用途**: statuslineスクリプト、個人的なカスタマイズ
- **永続化**: DevContainer再構築後も保持される

## プラグイン管理

### チーム共有プラグインの追加

チーム全体で使用するプラグインは`.claude/settings.json`に追加：

```json
{
  "enabledPlugins": {
    "decision-support@niro-agent-plugins": true,
    "git-ops@niro-agent-plugins": true
  }
}
```

**メリット**:
- Git管理されるため、バージョン管理可能
- チームメンバー全員が同じプラグインを自動的に使用
- DevContainer起動時に自動適用

### 個人プラグインの追加

個人的に試したいプラグインは`~/.claude/settings.json`に追加するか、
Claude Code内で`/plugin`コマンドを使用。

## statusline設定

statuslineスクリプトは`postCreateCommand`で自動セットアップされます：

```bash
cp /workspace/.devcontainer/statusline-command.sh ~/.claude/statusline-command.sh
chmod +x ~/.claude/statusline-command.sh
```

**表示内容**:
```
[Sonnet 4.5] ✓ main │ 27% (55k) │ $1.42
```

- **モデル名**: 現在使用中のClaude AIモデル（シアン、括弧は白）
- **Git状態**: ✓=クリーン（緑）、±=未コミット変更あり（黄）
- **Gitブランチ**: 現在のブランチ名（白）
- **コンテキスト使用率**: パーセンテージと絶対値（緑/黄/赤）
  - 50%未満: 緑
  - 50-80%: 黄
  - 80%以上: 赤
- **セッションコスト**: API利用時の参考コスト（白）
  - 定額プランでも表示される

## 環境構築

### 初回起動

```bash
make dev-up
```

DevContainer起動時に以下が自動実行されます：
1. `bun install`: 依存関係のインストール
2. statuslineスクリプトのコピーと実行権限付与
3. 環境変数の設定

### 再構築が必要な場合

Dockerfile.devや依存関係を変更した場合：

```bash
# Docker Composeの場合
make dev-up

# VS Codeの場合
# コマンドパレット → "Dev Containers: Rebuild Container"
```

## トラブルシューティング

### プラグインが認識されない

1. `.claude/settings.json`の設定を確認
2. DevContainerを再起動
3. Claude Codeセッションを再起動

### statuslineが表示されない

1. `jq`がインストールされているか確認: `which jq`
2. スクリプトが存在するか確認: `ls -la ~/.claude/statusline-command.sh`
3. スクリプトの実行権限を確認: `chmod +x ~/.claude/statusline-command.sh`

### volumeをリセットしたい場合

```bash
docker volume rm niro-mcp-claude-data
make dev-up
```

**注意**: プラグインの再インストールが必要になります。

## 設計の利点

1. **チーム統一性**: 全員が同じプラグイン・設定を使用
2. **個人の自由度**: 個人設定もvolume永続化で保持
3. **環境の分離**: ホストの`~/.claude`を汚染しない
4. **再現性**: DevContainerをビルドすれば即座に開発可能

## 関連ファイル

- `.devcontainer/devcontainer.json`: DevContainer設定
- `.devcontainer/statusline-command.sh`: statusline表示スクリプト
- `.claude/settings.json`: チーム共有のClaude Code設定
- `Dockerfile.dev`: DevContainerのDockerfile
