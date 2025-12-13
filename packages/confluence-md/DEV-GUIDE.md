# Confluence-MD MCP Server - 開発ガイド

## 概要

Confluence-MD MCP Serverは、ConfluenceのHTML形式のコンテンツをLLMに最適化されたMarkdownに変換するMCPサーバーです。

## 通信方式

このサーバーは2つの通信方式をサポートしています：

### 1. stdio通信（デフォルト）
- Claude Desktopとの統合に使用
- 標準入出力でMCPプロトコルメッセージを送受信
- 本番環境での推奨方式

### 2. HTTP/SSE通信（開発用）
- DevContainer内からのテスト・デバッグに最適
- HTTPエンドポイント経由でMCPプロトコルメッセージを送受信
- curlやPostmanで簡単にテスト可能

## 環境変数

| 変数名 | 説明 | デフォルト値 | 例 |
|--------|------|------------|-----|
| `TRANSPORT_MODE` | 通信方式 (`stdio` または `http`) | `stdio` | `http` |
| `PORT` | HTTPサーバーのポート（HTTPモード時） | `3001` | `3001` |
| `HOST` | HTTPサーバーのホスト（HTTPモード時） | `0.0.0.0` | `0.0.0.0` |

## 開発環境のセットアップ

### 1. DevContainerを起動

VS Codeで「Reopen in Container」を選択してDevContainerを起動します。

### 2. MCPサーバーを起動（HTTPモード）

```bash
# Docker Composeでプロファイル付きで起動
docker compose --profile mcp-servers up confluence-md

# または、バックグラウンドで起動
docker compose --profile mcp-servers up confluence-md -d

# ログを確認
docker logs -f niro-mcp-confluence-md
```

起動すると以下のように表示されます：

```
Confluence-MD MCP Server running on http://0.0.0.0:3001
Health check: http://0.0.0.0:3001/health
MCP endpoint: http://0.0.0.0:3001/mcp
```

### 3. 動作確認

#### Health Check
```bash
curl http://confluence-md:3001/health
```

#### Tools List（MCPプロトコル）
```bash
curl -X POST http://confluence-md:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

#### テストスクリプトを使用
```bash
# DevContainer内から実行
cd packages/confluence-md
./test-http.sh confluence-md:3001
```

## APIエンドポイント

### Health Check
```
GET /health
```

レスポンス:
```json
{
  "status": "ok",
  "server": "confluence-md"
}
```

### MCP Protocol
```
POST /mcp
GET /mcp (SSEストリーム用)
DELETE /mcp (セッション終了)
```

MCPプロトコルのメッセージをJSON-RPC 2.0形式で送受信します。

#### 例: ツール一覧取得
```bash
curl -X POST http://confluence-md:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

#### 例: Confluence HTMLをMarkdownに変換
```bash
curl -X POST http://confluence-md:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "convert_confluence_to_markdown",
      "arguments": {
        "html": "<h1>Test</h1><p>Hello <strong>World</strong></p>",
        "removeMetadata": true,
        "expandMacros": true,
        "convertTables": true
      }
    },
    "id": 2
  }'
```

## 開発ワークフロー

### 1. コード修正
`src/index.ts` やその他のファイルを修正します。

### 2. ホットリロード
`bun run dev` で起動している場合、ファイル変更時に自動的に再起動されます。

### 3. テスト
```bash
# DevContainer内から
./test-http.sh confluence-md:3001

# または手動でcurl
curl -X POST http://confluence-md:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

### 4. デバッグ
```bash
# ログをリアルタイムで確認
docker logs -f niro-mcp-confluence-md

# コンテナ内に入る
docker exec -it niro-mcp-confluence-md bash
```

## 本番環境（Claude Desktop統合）

本番環境ではstdio通信を使用します：

```json
// Claude Desktop設定 (~/.config/claude/claude_desktop_config.json)
{
  "mcpServers": {
    "confluence-md": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "niro-mcp-confluence-md"
      ]
    }
  }
}
```

または、環境変数を使って明示的にstdioモードを指定：

```bash
TRANSPORT_MODE=stdio bun run start
```

## トラブルシューティング

### MCPサーバーに接続できない

1. サーバーが起動しているか確認:
```bash
docker ps | grep confluence-md
```

2. ポートが公開されているか確認:
```bash
docker port niro-mcp-confluence-md
```

3. ネットワークを確認:
```bash
docker network inspect niro-mcp-network
```

### JSONエラーが返ってくる

- リクエストボディが正しいJSON形式か確認
- Content-Typeヘッダーが `application/json` になっているか確認
- MCPプロトコルのスキーマに準拠しているか確認

### ホットリロードが動作しない

- `bun run dev` で起動しているか確認（`bun run start` ではホットリロードされません）
- ボリュームマウントが正しく設定されているか確認

## 参考資料

- [MCP (Model Context Protocol)](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Bun Documentation](https://bun.sh/docs)
