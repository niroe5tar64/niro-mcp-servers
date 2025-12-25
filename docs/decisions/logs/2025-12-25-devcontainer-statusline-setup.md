---
date: 2025-12-25
topic: DevContainer内でのClaude Code statusline自動セットアップ
participants:
  - user
  - claude
tags:
  - devcontainer
  - tooling
---

# Summary
- DevContainer内でClaude Codeのstatuslineが動作しない問題を解決
- `jq`のインストール、スクリプト配置、設定ファイル生成を自動化
- DevContainer起動時に必要なセットアップが完了するように構成

## Decision
- Dockerfile.devに`jq`パッケージを追加
- statusline-command.shを`.devcontainer/`配下に配置
- `postCreateCommand`でstatuslineの自動セットアップを実行

## Notes

### 問題の原因
1. **`jq`がインストールされていない**: statusline-command.shはJSONパースに`jq`を使用
2. **`~/.claude/settings.json`が存在しない**: statuslineの設定ファイルがない
3. **`~/.claude/statusline-command.sh`が配置されていない**: スクリプトファイルが正しい場所にない

### 実施した変更

#### 1. Dockerfile.dev
```dockerfile
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim-tiny \
    less \
    procps \
    sudo \
    tree \
    ca-certificates \
    npm \
    locales \
    jq \  # 追加
    && rm -rf /var/lib/apt/lists/*
```

#### 2. スクリプト配置
- `tmp/statusline-setup/statusline-command.sh` → `.devcontainer/statusline-command.sh`に移動
- プロジェクトリポジトリ内で管理

#### 3. devcontainer.json
```json
{
  "postCreateCommand": "bun install && cp /workspace/.devcontainer/statusline-command.sh ~/.claude/statusline-command.sh && chmod +x ~/.claude/statusline-command.sh && echo '{\"statusLine\":{\"type\":\"command\",\"command\":\"/home/bun/.claude/statusline-command.sh\"}}' > ~/.claude/settings.json"
}
```

### statuslineの表示内容
```
Claude 3.5 Sonnet │ workspace ✓ main │ 23% ctx
```

- **モデル名**: 現在使用中のClaude AIモデル（紫）
- **ディレクトリ名**: 作業ディレクトリの短縮表示（青）
- **Gitブランチ**: 現在のブランチ名
- **Git状態**: ✓=クリーン（緑）、±=未コミット変更あり（黄）
- **コンテキスト使用率**: トークン使用率（緑/黄/赤）

### 反映方法
DevContainerの再ビルドが必要：
```bash
make dev-up
```

または、VS Codeの場合：
1. コマンドパレット（Cmd/Ctrl + Shift + P）
2. "Dev Containers: Rebuild Container"を実行

### ~/.claudeディレクトリの永続化

Docker named volume（`niro-mcp-claude-data`）を使用して`~/.claude`を永続化。
これによりDevContainerのリビルド後もClaude Codeのプラグインが保持される。

```json
{
  "mounts": [
    "source=niro-mcp-claude-data,target=/home/bun/.claude,type=volume"
  ]
}
```

- ホストの`~/.claude`とは分離される
- チーム共通の設定は`.claude/settings.local.json`で管理
- volumeを削除するとプラグインの再インストールが必要

## Related Files
- `.devcontainer/devcontainer.json`: DevContainer設定
- `.devcontainer/statusline-command.sh`: statusline表示スクリプト
- `.claude/settings.local.json`: プロジェクト共通のClaude Code設定
- `Dockerfile.dev`: DevContainerのDockerfile
