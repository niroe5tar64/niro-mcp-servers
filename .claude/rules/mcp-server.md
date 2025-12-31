# MCPサーバー開発ガイドライン

## サーバー構造パターン

各MCPサーバーは以下の構造に従う：

```
packages/<server-name>/
├── src/
│   ├── index.ts      # エントリーポイント（トランスポート選択）
│   ├── server.ts     # MCPサーバーセットアップ、ツール登録
│   ├── tools/        # ツール実装（ハンドラー + スキーマ）
│   │   └── *.ts
│   └── lib/          # ビジネスロジック、APIクライアント
│       └── *.ts
└── package.json
```

## トランスポートモード

- **stdio**（デフォルト）：AI Agentのローカル統合用
- **http**：リモートアクセス/テスト用

環境変数 `TRANSPORT_MODE` で切り替える。

## ツール実装規約

- ツール名はスネークケース（例：`get_confluence_page_markdown`）
- スキーマ定義はZodを使用
- ハンドラーとスキーマは同一ファイルに配置
- エラーは適切なMCPエラーコードで返す

## 共有ライブラリ

内部依存は `workspace:*` プロトコルで参照：

```json
{
  "dependencies": {
    "@niro-mcp/confluence-cleaner": "workspace:*",
    "@niro-mcp/mcp-server-core": "workspace:*"
  }
}
```
