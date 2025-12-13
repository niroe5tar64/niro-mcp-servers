# Dev Container Setup Guide

このガイドでは、Docker環境でClaude Codeを安全に使用するためのDev Container環境のセットアップ方法を説明します。

## 概要

この設定により以下が実現されます：

- ✅ **安全な開発環境**: Claude CodeがDocker Container内で動作するため、ホストマシンへの影響を最小限に
- ✅ **Dangerous Skip モード有効化**: コンテナ内で隔離されているため、制限なくClaude Codeを使用可能
- ✅ **一貫した開発環境**: チーム全体で同じ環境を共有
- ✅ **簡単なセットアップ**: VS CodeのDev Container機能で自動構築

## 前提条件

- Docker Desktop (または Docker Engine + Docker Compose)
- Visual Studio Code
- VS Code拡張機能: [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## セットアップ手順

### 1. VS CodeでDev Containerを開く

#### 方法A: VS Code Command Palette
1. VS Codeでこのプロジェクトを開く
2. `Cmd/Ctrl + Shift + P` でコマンドパレットを開く
3. "Dev Containers: Reopen in Container" を選択
4. 初回は数分かかりますが、自動的にコンテナがビルド・起動されます

#### 方法B: ターミナルから
```bash
# Dev Containerをビルド
make dev-build

# Dev Containerを起動
make dev-up

# VS CodeでDev Containerに接続
# Command Palette > "Dev Containers: Attach to Running Container"
# > "niro-mcp-devcontainer" を選択
```

### 2. Claude Codeの設定確認

Dev Container内で以下の設定が自動的に適用されます：

**.claude/settings.local.json**
```json
{
  "sandbox": {
    "enabled": false,
    "allowUnsandboxedCommands": true
  },
  "permissions": {
    "allow": [
      "Bash",
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep"
    ]
  }
}
```

### 3. 動作確認

Dev Container内で以下のコマンドを実行して、環境が正しく構築されているか確認：

```bash
# Bunのバージョン確認
bun --version

# 依存関係のインストール（自動的に実行されますが、手動でも可能）
bun install

# ビルド
bun run build

# テスト
bun test
```

## 便利なコマンド (Makefile)

プロジェクトルートに用意されているMakefileで、以下のコマンドが使用できます：

```bash
# ヘルプ表示
make help

# 開発環境
make dev-build       # Dev Containerをビルド
make dev-up          # Dev Containerを起動
make dev-down        # Dev Containerを停止
make dev-restart     # Dev Containerを再起動
make dev-shell       # Dev Containerのシェルを開く
make dev-logs        # Dev Containerのログを表示

# MCP サーバー
make mcp-up          # 全MCPサーバーを起動
make mcp-down        # 全MCPサーバーを停止

# 開発タスク
make install         # 依存関係をインストール
make test            # テストを実行
make build           # ビルドを実行

# クリーンアップ
make clean           # コンテナとボリュームを削除
```

## ディレクトリ構成

```
.
├── .devcontainer/
│   └── devcontainer.json          # Dev Container設定
├── .claude/
│   └── settings.local.json        # Claude Code設定（Dangerous Skip有効）
├── Dockerfile.dev                  # 開発環境用Dockerfile
├── docker-compose.dev.yml          # Dev Container用Docker Compose
├── docker-compose.yml              # 本番用Docker Compose
├── Dockerfile                      # 本番用Dockerfile
├── Makefile                        # 便利なコマンド集
└── DEV_CONTAINER.md                # このファイル
```

## セキュリティについて

### なぜDangerous Skip モードが安全なのか？

1. **隔離されたコンテナ環境**
   - Claude CodeはDocker Container内でのみ動作
   - ホストマシンのファイルシステムには直接アクセス不可

2. **制限されたリソース**
   - CPUとメモリの使用量を制限可能
   - docker-compose.dev.yml で調整可能

3. **ネットワーク隔離**
   - 専用のDockerネットワーク (niro-mcp-network) を使用
   - 必要なポートのみをホストに公開

### セキュリティ設定のカスタマイズ

より厳格なセキュリティが必要な場合は、docker-compose.dev.yml を調整：

```yaml
devcontainer:
  # ... 他の設定 ...

  # セキュリティオプション
  cap_drop:
    - ALL  # すべてのケイパビリティを削除
  cap_add:
    - CHOWN  # 必要な最小限のケイパビリティのみ追加
    - DAC_OVERRIDE

  # 読み取り専用ファイルシステム（必要に応じて）
  read_only: true
  tmpfs:
    - /tmp:rw,noexec,nosuid,size=1g
```

## トラブルシューティング

### コンテナが起動しない

```bash
# コンテナとボリュームを完全に削除して再構築
make clean
make dev-build
make dev-up
```

### Git認証が機能しない

.devcontainer/devcontainer.json でGit設定がマウントされていますが、問題がある場合：

```bash
# Dev Container内で
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Bun installが遅い

初回は時間がかかりますが、Bunのキャッシュがボリュームに永続化されるため、2回目以降は高速です。

## 本番環境との併用

Dev Containerは開発専用です。本番環境のテストには通常のDocker Composeを使用：

```bash
# 本番環境のビルドとテスト
docker-compose up --build

# 特定のMCPサーバーのみ起動
docker-compose up confluence-md
```

## 参考リンク

- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Documentation](https://docs.docker.com/)
- [Bun Documentation](https://bun.sh/docs)
