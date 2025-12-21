---
paths: packages/confluence-*/**
---

# Confluence パッケージ固有ルール

## 対象パッケージ

- `packages/confluence-content/` - MCPサーバー本体
- `packages/shared/confluence-cleaner/` - HTML→Markdown変換ライブラリ

## Confluence API

- Confluence Cloud REST API v2を使用
- 認証：Basic認証（APIトークン）
- レート制限に注意（大量リクエスト時は適切な間隔を空ける）

## HTML→Markdown変換

- `@niro-mcp/confluence-cleaner`を使用
- Confluenceマクロは専用ハンドラーで処理
- 未対応マクロはプレーンテキストとして出力

## ページ取得時の注意

- `body.storage`形式でHTMLを取得
- 添付ファイル、コメントは別途APIコール
- ページIDはConfluence URLから抽出可能
