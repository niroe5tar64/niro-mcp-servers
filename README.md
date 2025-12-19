# niro-mcp-servers

業務効率化のための MCP (Model Context Protocol) サーバー群のモノレポプロジェクト。

## 概要

MCP (Model Context Protocol) は、AI エージェント（Claude Desktop など）がローカルツールやサービスと連携するためのプロトコルです。このプロジェクトでは、社内システム（Confluence、JIRA など）と AI エージェントを安全に接続するための各種サーバーを開発します。

## 技術スタック

- **言語**: TypeScript
- **ランタイム**: Bun
- **パッケージマネージャー**: Bun (モノレポ対応)
- **コンテナ**: Docker（開発・本番環境）
- **MCP SDK**: @modelcontextprotocol/sdk

## プロジェクト構成

```
niro-mcp-servers/
├── packages/
│   ├── shared/                      # 共有ロジック
│   │   └── confluence-cleaner/     # Confluence HTML クリーナー
│   ├── confluence-md/               # Confluence → Markdown 変換 MCP サーバー
│   └── confluence-content/          # Confluence コンテンツ取得 MCP サーバー
├── package.json                     # モノレポルート設定
├── bunfig.toml                      # Bun 設定
├── docker-compose.yml               # Docker Compose 設定
└── Dockerfile                       # マルチステージビルド
```

## MCP サーバー一覧

### Confluence-MD

Confluence の HTML コンテンツをクリーンな Markdown に変換する MCP サーバー。

**主な機能**:
- HTML ノイズを除去し、LLM が理解しやすい Markdown に変換
- トークン削減: 約 50%
- Confluence マクロ（info、warning、code など）の展開

詳細は [packages/confluence-md/README.md](packages/confluence-md/README.md) を参照。

### Confluence-Content

Confluence ページのコンテンツを HTML ビュー形式（レンダリング済みHTML）で取得する MCP サーバー。

**主な機能**:
- ページのレンダリング済みHTMLを取得
- マクロが展開された状態のHTMLを取得可能
- ページ情報（ID、タイトル、スペース情報）の取得

詳細は [packages/confluence-content/README.md](packages/confluence-content/README.md) を参照。

## セットアップ

### 1. 依存関係のインストール

```bash
bun install
```

### 2. Docker イメージのビルド

```bash
docker compose build
```

### 3. Claude Desktop への設定

`claude_desktop_config.json` に以下を追加：

```json
{
  "mcpServers": {
    "confluence-md": {
      "command": "docker",
      "args": [
        "compose",
        "-f",
        "/path/to/niro-mcp-servers/docker-compose.yml",
        "run",
        "--rm",
        "confluence-md"
      ]
    },
    "confluence-content": {
      "command": "docker",
      "args": [
        "compose",
        "-f",
        "/path/to/niro-mcp-servers/docker-compose.yml",
        "run",
        "--rm",
        "confluence-content"
      ],
      "env": {
        "CONFLUENCE_BASE_URL": "https://confluence.example.com",
        "CONFLUENCE_USERNAME": "your-username",
        "CONFLUENCE_PASSWORD": "your-password"
      }
    }
  }
}
```

## 開発

### モノレポコマンド

```bash
# すべてのパッケージをビルド
bun run build

# すべてのパッケージをテスト
bun test

# クリーンアップ
bun run clean
```

### 個別パッケージの開発

```bash
# confluence-md サーバーを開発モードで起動
cd packages/confluence-md
bun run dev

# confluence-content サーバーを開発モードで起動
cd packages/confluence-content
bun run dev

# テスト実行
bun test
```

### Docker での開発

```bash
# サービスを起動
docker compose up confluence-md
docker compose up confluence-content

# ログを確認
docker compose logs -f confluence-md
docker compose logs -f confluence-content

# サービスを停止
docker compose down
```

## セキュリティ方針

すべての MCP サーバーは、以下のセキュリティ要件に準拠します：

- ✅ ローカル環境（Docker コンテナ内）での実行
- ✅ 社内ネットワーク経由でのみ社内システムにアクセス
- ✅ 外部サービスへのデータ送信禁止
- ✅ Claude Desktop から stdio 経由で通信
- ✅ Read-only ファイルシステム
- ✅ 非 root ユーザーでの実行

## ライセンス

Private - 社内利用のみ
