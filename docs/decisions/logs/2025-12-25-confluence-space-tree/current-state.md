---
date: 2025-12-25
topic: packages/confluence-content 現状分析
---

# 現状分析

## ディレクトリ構造

```
packages/confluence-content/
├── src/
│   ├── index.ts      # エントリーポイント（トランスポート選択）
│   ├── server.ts     # MCPサーバー設定、ツール登録
│   ├── tools/
│   │   └── get-page-markdown.ts   # ツール実装
│   └── lib/
│       └── confluence-api.ts      # APIクライアント
└── package.json
```

## 現在のツール

### `get_confluence_page_markdown`

- **入力**: `pageId`（必須）
- **出力**: ページ情報 + Markdown本文
- **処理**: レンダリング済みHTML → confluence-cleanerでMarkdown変換

```typescript
// 出力形式
{
  pageInfo: {
    id: string;
    title: string;
    spaceKey: string;
    spaceName: string;
    _links: { webui: string; self: string };
  };
  markdown: string;
}
```

## Confluence APIクライアント

### 認証方式
- Basic認証（ユーザー名 + パスワード）
- Bearer認証（APIトークン、優先）

### 使用API
- `GET /rest/api/content/{pageId}?expand=body.view,space`
- レンダリング済みHTML（`body.view.value`）を取得

### 環境変数
```
CONFLUENCE_BASE_URL      # 必須
CONFLUENCE_USERNAME      # 必須
CONFLUENCE_PASSWORD      # オプション
CONFLUENCE_API_TOKEN     # オプション（優先）
CONFLUENCE_TIMEOUT       # オプション（デフォルト30秒）
```

## Markdown変換パイプライン（confluence-cleaner）

```
入力HTML
  ↓
【前処理】
  ├─ PlantUML SVG → Mermaidコードブロック
  ├─ Expandマクロ → ▶ Title 形式
  ├─ 画像ラッパー除去
  ├─ Page Treeマクロ削除
  └─ レイアウトコンテナ除去
  ↓
【メイン処理】
  └─ Turndown + GFMプラグイン
  ↓
【後処理】
  ├─ テーブル内Markdown正規化
  ├─ HTMLエンティティデコード
  └─ 過剰エスケープ解除
  ↓
出力Markdown
```

## 主な制限（今回の課題）

- **単一ツールのみ**: `get_confluence_page_markdown` だけ
- **ページIDが必須**: 探す手段がない
- **単一ページのみ**: まとめて取得できない
- **添付/コメント非対応**: ページ本文のみ
