# CLAUDE.md

このファイルは、Claude Codeがこのリポジトリのコードを扱う際のガイダンスを提供します。

## 概要

このプロジェクトは、AI Agentと社内システム（Confluence、JIRAなど）を接続するMCPサーバーのモノレポです。TypeScriptとBunランタイムを使用しています。

## コマンド

```bash
bun install              # 依存関係のインストール
bun test                 # 全テストの実行
bun run build            # 全パッケージのビルド
bun run check            # Biomeでのリントとフォーマット（自動修正）
```

```bash
make dev-up              # DevContainerを起動
make dev-shell           # DevContainer内でシェルを開く
make mcp-up              # 全MCPサーバーを起動
```

## パッケージ構成

- `packages/confluence-content/` - Confluenceコンテンツ用MCPサーバー
- `packages/shared/confluence-cleaner/` - HTML→Markdownコンバーター
- `packages/shared/mcp-server-core/` - MCPサーバー用トランスポート層

詳細な開発ガイドラインは `.claude/rules/` を参照。

## DevContainer環境

このプロジェクトはDevContainer内でClaude Codeを実行するように設計されています。

- `.devcontainer/bin/claude`が自動的に`--dangerously-skip-permissions`を追加
- 安全性は`.claude/settings.local.json`のPreToolUseフックで確保
- 破壊的なgitコマンド（`git reset --hard`、`git push --force`など）はブロック
