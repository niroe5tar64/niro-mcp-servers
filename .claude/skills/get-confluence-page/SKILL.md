---
name: get-confluence-page
description: MCPツール `get_confluence_page_markdown` でConfluenceページをMarkdownとして取得する。ページIDやURLから内容を読みたい、引用したい、要約したい、検証したい時に使う。MCPサーバー `confluence-content` と環境変数 `CONFLUENCE_BASE_URL`, `CONFLUENCE_USERNAME`, `CONFLUENCE_API_TOKEN` が必要。
---

# Confluenceページ取得

## ワークフロー

1. ConfluenceページIDを取得する。URLが与えられた場合は数値のページIDを抽出する。IDが不明・曖昧なら確認する。
2. MCPツール `get_confluence_page_markdown` をページID付きで呼び出す。
3. 依頼内容に合わせて結果を提示する（全文Markdown、要点の抜粋、要約）。出典となるページへの参照を保持する。

## MCPツール

ツール名: `get_confluence_page_markdown`

### 入力

- `pageId` (string, required): ConfluenceページID

### 出力（形状）

```json
{
  "pageInfo": {
    "id": "123456",
    "title": "Page Title",
    "spaceKey": "DEV",
    "spaceName": "Development",
    "_links": {
      "webui": "/wiki/spaces/DEV/pages/123456",
      "self": "https://example.atlassian.net/wiki/rest/api/content/123456"
    }
  },
  "markdown": "# Page Title\n\nPage body in Markdown..."
}
```

## エラーハンドリング

- 404 Not Found: ページが見つからない旨を伝え、有効なページIDやURLを求める。
- 401/403 Unauthorized: アクセス権限がない旨を伝え、認証情報や権限を確認してもらう。
- Timeout / network errors: しばらく待って再試行するか、接続状況を確認してもらう。

## 注意事項

- ページ内容を捏造しない。ツールが失敗した場合はページIDの再確認か失敗内容を伝える。
- リンクが必要な場合は `pageInfo._links.webui` からURLを組み立てる。
