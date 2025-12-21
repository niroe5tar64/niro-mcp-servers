# CLAUDE.md

このファイルは、Claude Codeがこのリポジトリのコードを扱う際のガイダンスを提供します。

## 概要

このプロジェクトは、AI Agentと社内システム（Confluence、JIRAなど）を接続するMCPサーバーのモノレポです。TypeScriptとBunランタイムを使用しています。

## コマンド

### 開発（DevContainer内）
```bash
bun install              # 依存関係のインストール
bun test                 # 全テストの実行
bun run build            # 全パッケージのビルド
bun run check            # Biomeでのリントとフォーマット（自動修正）
```

### 単一のテストファイルを実行
```bash
bun test path/to/file.test.ts
```

### MCPサーバー開発
```bash
cd packages/confluence-content
bun run dev              # ホットリロードで起動
bun test                 # パッケージのテストを実行
```

### Docker/Makefileコマンド
```bash
make dev-up              # DevContainerを起動
make dev-shell           # DevContainer内でシェルを開く
make mcp-up              # 全MCPサーバーを起動
make test                # コンテナ内でテストを実行
```

## アーキテクチャ

### パッケージ構成
- `packages/confluence-content/` - Confluenceコンテンツ用MCPサーバー（ページの取得、Markdownへの変換）
- `packages/shared/confluence-cleaner/` - 共有ライブラリ：ConfluenceマクロサポートつきHTML-to-Markdownコンバーター
- `packages/shared/mcp-server-core/` - 共有ライブラリ：MCPサーバー用トランスポート層（stdio/HTTP）

### MCPサーバーパターン
各MCPサーバーは以下の構造に従います：
1. `src/index.ts` - エントリーポイント、`TRANSPORT_MODE`環境変数に基づいてトランスポートを選択
2. `src/server.ts` - MCPサーバーのセットアップ、`@modelcontextprotocol/sdk`経由でツールを登録
3. `src/tools/*.ts` - ツールの実装（ハンドラー + スキーマ定義）
4. `src/lib/*.ts` - ビジネスロジックとAPIクライアント

### トランスポートモード
- **stdio**（デフォルト）：AI Agentのローカル統合用
- **http**：リモートアクセス/テスト用（`TRANSPORT_MODE=http`を設定）

### ワークスペース依存関係
パッケージは内部依存関係に`workspace:*`を使用します：
- `@niro-mcp/confluence-cleaner`
- `@niro-mcp/mcp-server-core`

## DevContainer環境

このプロジェクトは、DevContainer内でClaude Codeを実行するように設計されています。`.devcontainer/bin/claude`のラッパーは自動的に`--dangerously-skip-permissions`を追加し、安全性は`.claude/settings.local.json`のPreToolUseフックによって提供されます。

破壊的なgitコマンド（`git reset --hard`、`git push --force`など）はフックシステムによってブロックされます。
