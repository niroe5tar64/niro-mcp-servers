# Confluence-Content MCP Server

ConfluenceページのコンテンツをMarkdown形式で取得するMCPサーバー。

## 機能

- **Markdown変換**: Confluenceページのレンダリング済みHTMLをクリーンなMarkdownに変換
- **トークン削減**: 約50%のトークン削減を実現
- **マクロ展開**: Confluenceマクロ（info、warning、codeなど）を適切に変換
- **ページ情報**: ページのメタデータ（ID、タイトル、スペース情報）を取得
- **エラーハンドリング**: APIエラーに対する包括的なエラーハンドリング
- **MCPプロトコル**: Model Context Protocolに完全準拠

## インストール

Claude Desktopの設定に以下を追加：

```json
{
  "mcpServers": {
    "confluence-content": {
      "command": "docker",
      "args": [
        "compose",
        "-f",
        "/path/to/niro-mcp-servers/docker-compose.yml",
        "run",
        "--rm",
        "-i",
        "confluence-content"
      ]
    }
  }
}
```

## 使用方法

サーバーは1つのツールを提供します：

### get_confluence_page_markdown

ConfluenceページのコンテンツをMarkdown形式で取得します。HTMLビュー形式を取得し、クリーンなMarkdownに変換して返します。

**パラメータ:**
- `pageId` (必須): ConfluenceページID

**使用例:**

```typescript
{
  "pageId": "2447941326"
}
```

**レスポンス:**

```json
{
  "pageInfo": {
    "id": "2447941326",
    "title": "ページタイトル",
    "spaceKey": "SPACE",
    "spaceName": "スペース名",
    "_links": {
      "webui": "/pages/viewpage.action?pageId=2447941326",
      "self": "https://confluence.example.com/rest/api/content/2447941326"
    }
  },
  "markdown": "# ページタイトル\n\nクリーンなMarkdownコンテンツ..."
}
```

## 環境変数

### 必須変数

- `CONFLUENCE_BASE_URL` (必須): ConfluenceインスタンスのベースURL
  - 例: `https://confluence.example.com`
  - 注意: 末尾のスラッシュは含めないでください

- `CONFLUENCE_USERNAME` (必須): 認証用のユーザー名
  - 例: `your-username@example.com`

### 認証（いずれか一方を選択）

- `CONFLUENCE_PASSWORD` (オプション): パスワード認証
  - パスワード認証を使用する場合に設定

- `CONFLUENCE_API_TOKEN` (オプション): APIトークン認証
  - パスワードの代替（セキュリティ上推奨）
  - 作成方法: https://id.atlassian.com/manage-profile/security/api-tokens
  - `CONFLUENCE_PASSWORD`または`CONFLUENCE_API_TOKEN`のいずれか一方を使用（両方は不可）

### オプション変数

- `CONFLUENCE_TIMEOUT` (オプション): リクエストタイムアウト（ミリ秒）
  - デフォルト: `30000` (30秒)

## 環境変数の設定方法

### 方法1: .envファイルを使用（Docker Compose推奨）

1. `packages/confluence-content/.env`ファイルを作成：

```bash
# packages/confluence-content/.env
CONFLUENCE_BASE_URL=https://confluence.example.com
CONFLUENCE_USERNAME=your-username@example.com
CONFLUENCE_API_TOKEN=your-api-token
CONFLUENCE_TIMEOUT=30000
```

2. `docker-compose.yml`で`env_file`を指定（既に設定済み）

### 方法2: シェルでexport（ローカル開発用）

```bash
export CONFLUENCE_BASE_URL=https://confluence.example.com
export CONFLUENCE_USERNAME=your-username@example.com
export CONFLUENCE_API_TOKEN=your-api-token
```

### 方法3: Claude Desktop設定ファイルに直接記述

`claude_desktop_config.json`に環境変数を直接追加：

```json
{
  "mcpServers": {
    "confluence-content": {
      "command": "docker",
      "args": [
        "compose",
        "-f",
        "/path/to/niro-mcp-servers/docker-compose.yml",
        "run",
        "--rm",
        "-i",
        "confluence-content"
      ],
      "env": {
        "CONFLUENCE_BASE_URL": "https://confluence.example.com",
        "CONFLUENCE_USERNAME": "your-username@example.com",
        "CONFLUENCE_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

**セキュリティ注意**: 本番環境では、設定ファイルに直接認証情報を記述するのではなく、Docker secretsやシークレット管理システムの使用を検討してください。

## 開発

```bash
# 開発サーバーを起動
bun run dev

# ビルド
bun run build

# テスト実行
bun test

# クリーンアップ
bun run clean
```

## セキュリティ

- Dockerコンテナ内でRead-onlyファイルシステムで実行
- 外部ネットワークアクセスなし（Confluenceインスタンスへのアクセスのみ）
- Claude Desktopとの通信はstdioのみ
- データの永続化なし
- 認証情報は環境変数で管理
