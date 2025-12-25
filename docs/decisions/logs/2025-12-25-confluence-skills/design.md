---
date: 2025-12-25
topic: get-confluence-page SKILL.md 設計書
status: draft
---

# get-confluence-page SKILL.md 設計書

## 概要

`get_confluence_page_markdown` MCPツールをAgent Skillとしてラップする。

## 配置場所

```
.claude/skills/get-confluence-page/
└── SKILL.md
```

**理由**: プロジェクトスキル（`.claude/skills/`）として配置し、チームで共有可能にする。

## SKILL.md構造

### Frontmatter（YAML）

| フィールド | 値 | 説明 |
|------------|-----|------|
| name | `get-confluence-page` | 小文字英数字とハイフン、64文字以内 |
| description | 下記参照 | 機能と使用タイミング、1024文字以内 |
| compatibility | MCPサーバー要件 | 環境要件を明示 |

### Description（案）

```
ConfluenceページをMarkdown形式で取得する。Confluenceのドキュメント内容を確認したい時、ページの情報を読み取りたい時に使用。MCPサーバー confluence-content が必要。
```

### Body（Markdown）

- 使用方法の説明
- MCPツール呼び出しの指示
- 入出力の例
- エラーハンドリング

## SKILL.md 全文案

```markdown
---
name: get-confluence-page
description: ConfluenceページをMarkdown形式で取得する。Confluenceのドキュメント内容を確認したい時、ページの情報を読み取りたい時に使用。MCPサーバー confluence-content が必要。
compatibility: |
  Requires: MCP server 'confluence-content'
  Environment variables: CONFLUENCE_BASE_URL, CONFLUENCE_USERNAME, CONFLUENCE_API_TOKEN
---

# Get Confluence Page

ConfluenceページをMarkdown形式で取得するスキル。

## 使用方法

1. ユーザーからページIDを取得する（または会話から特定する）
2. MCPツール `get_confluence_page_markdown` を呼び出す
3. 結果をユーザーに提示する

## MCPツール呼び出し

ツール名: `get_confluence_page_markdown`

### 入力

| パラメータ | 型 | 必須 | 説明 |
|------------|-----|------|------|
| pageId | string | Yes | ConfluenceページのID |

### 出力

```json
{
  "pageInfo": {
    "id": "123456",
    "title": "ページタイトル",
    "spaceKey": "DEV",
    "spaceName": "Development",
    "_links": {
      "webui": "/wiki/spaces/DEV/pages/123456",
      "self": "https://example.atlassian.net/wiki/rest/api/content/123456"
    }
  },
  "markdown": "# ページタイトル\n\nページ本文のMarkdown..."
}
```

## 例

### 例1: ページIDが分かっている場合

ユーザー: 「ページID 123456 の内容を見せて」

→ `get_confluence_page_markdown(pageId: "123456")` を呼び出す

### 例2: ページIDが分からない場合

ユーザー: 「DEVスペースの設計書を見せて」

→ まず `get_space_tree` でツリーを取得し、該当ページのIDを特定してから呼び出す
（注: get_space_tree は将来実装予定）

## エラーハンドリング

| エラー | 対応 |
|--------|------|
| 404 Not Found | 「指定されたページが見つかりません。ページIDを確認してください。」 |
| 401/403 Unauthorized | 「アクセス権限がありません。認証情報を確認してください。」 |
| Timeout | 「タイムアウトしました。しばらく待ってから再試行してください。」 |

## 関連スキル

- `get-space-tree`: スペース配下のページツリーを取得（将来実装予定）
```

## 動作確認手順

### Claude Code

1. `.claude/skills/get-confluence-page/SKILL.md` を配置
2. Claude Codeを起動
3. 「Confluenceのページ123456を見せて」と依頼
4. スキルが自動的に選択され、MCPツールが呼び出されることを確認

### Cursor

1. 同様に `.claude/skills/get-confluence-page/SKILL.md` を配置
2. MCPサーバー `confluence-content` が接続されていることを確認
3. 同様のプロンプトで動作確認

## 未確定事項

- [ ] descriptionの文言調整（Agentが適切に選択するか検証が必要）
- [ ] compatibilityの書き方がAgent製品間で互換性があるか確認
- [ ] 将来の `get-space-tree` スキルとの連携方法

## 参考

- [Agent Skills Specification](https://agentskills.io/specification)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
