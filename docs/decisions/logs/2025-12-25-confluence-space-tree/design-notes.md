---
date: 2025-12-25
topic: get_space_tree 設計メモ
status: draft
---

# get_space_tree 設計メモ

## 概要

スペース配下のページを階層構造で取得するツール。
本文は含めず、ツリー構造のみを返す。

## 入力

```typescript
{
  spaceKey: string;   // 必須: スペースキー（例: "DEV", "DESIGN"）
  pageId?: string;    // オプション: 起点となるページID
}
```

### パラメータの動作

| spaceKey | pageId | 動作 |
|----------|--------|------|
| 指定 | 未指定 | スペース全体のツリーを取得 |
| 指定 | 指定 | 指定ページ配下の子ページのみ取得 |

**pageId指定時の利点**:
- スペース全体だと不要なページまで取得してしまう問題を回避
- 特定のセクション（例: 「設計書」フォルダ配下）に絞り込める
- APIコール数・レスポンスサイズを削減

### 将来の拡張オプション（今回は未実装）
- `maxDepth`: 取得する階層の深さ制限
- `includeArchived`: アーカイブ済みページを含めるか

## 出力

```typescript
{
  spaceKey: string;
  spaceName: string;
  rootPageId?: string;   // pageId指定時のみ: 起点ページのID
  rootPageTitle?: string; // pageId指定時のみ: 起点ページのタイトル
  pages: PageNode[];      // pageId未指定: スペースのルートページ群
                          // pageId指定: 起点ページの子ページ群
}

interface PageNode {
  id: string;
  title: string;
  description?: string;  // ページに設定された説明（メタ情報）
  excerpt?: string;      // ページ本文の抜粋（自動生成、先頭数百文字程度）
  children: PageNode[];
}
```

## 使用するConfluence API

### 候補1: Content API + ancestors/descendants
```
GET /rest/api/content?spaceKey={spaceKey}&expand=ancestors
```
- ページ一覧を取得し、ancestors情報から階層を再構築

### 候補2: Content Tree API（v2）
```
GET /wiki/api/v2/spaces/{spaceId}/pages
GET /wiki/api/v2/pages/{pageId}/children
```
- スペースのルートページ一覧 → 各ページの子を再帰取得

### 候補3: CQL検索
```
GET /rest/api/content/search?cql=space={spaceKey}
```
- 全ページを検索し、ancestor情報から階層を構築

**推奨**: 候補2（Content Tree API v2）が最もシンプル。
ただし、ページ数が多い場合はページネーション対応が必要。

## ページネーション対応

Confluence APIはデフォルトで25件/リクエスト。
ページ数が多い場合は複数リクエストが必要。

```typescript
// ページネーション処理（疑似コード）
async function getAllPages(spaceKey: string): Promise<Page[]> {
  const pages: Page[] = [];
  let cursor: string | null = null;

  do {
    const response = await api.getPages(spaceKey, { cursor });
    pages.push(...response.results);
    cursor = response._links.next ? extractCursor(response._links.next) : null;
  } while (cursor);

  return pages;
}
```

## 階層構築アルゴリズム

```typescript
function buildTree(pages: Page[]): PageNode[] {
  const pageMap = new Map<string, PageNode>();
  const rootPages: PageNode[] = [];

  // 1. 全ページをMapに登録
  for (const page of pages) {
    pageMap.set(page.id, { id: page.id, title: page.title, children: [] });
  }

  // 2. 親子関係を構築
  for (const page of pages) {
    const node = pageMap.get(page.id)!;
    if (page.parentId && pageMap.has(page.parentId)) {
      pageMap.get(page.parentId)!.children.push(node);
    } else {
      rootPages.push(node);
    }
  }

  return rootPages;
}
```

## 考慮事項

### パフォーマンス
- ページ数が数百〜数千の場合、全件取得に時間がかかる
- 初回はキャッシュなしで実装、必要に応じてキャッシュ追加

### エラーハンドリング
- スペースが存在しない場合: 404エラー
- アクセス権限がない場合: 403エラー
- タイムアウト: 既存のタイムアウト設定を流用

### 出力サイズ
- ID・タイトル・階層のみ: ページ数1000件で数十KB程度
- description・excerpt追加時: 1ページあたり+500〜1000文字程度増加
- ページ数が多い場合は `pageId` 指定で範囲を絞ることで対応
- LLMのコンテキスト上限には収まる想定（必要に応じて絞り込み）

## 利用フロー

### パターン1: スペース全体から探す
```
1. ユーザー: 「DEVスペースの設計書を探して」
2. LLM: get_space_tree(spaceKey: "DEV")
3. LLM: ツリー構造からタイトルを見て目的のページを特定
4. LLM: get_confluence_page_markdown(pageId: "12345")
5. LLM: 本文を読んで回答
```

### パターン2: 特定セクション配下から探す
```
1. ユーザー: 「設計書フォルダ配下のAPI仕様を探して」
2. LLM: get_space_tree(spaceKey: "DEV", pageId: "99999")  ← 設計書フォルダのID
3. LLM: 子ページのツリーから目的のページを特定
4. LLM: get_confluence_page_markdown(pageId: "12345")
5. LLM: 本文を読んで回答
```

### パターン3: 段階的な絞り込み
```
1. LLM: get_space_tree(spaceKey: "DEV")  ← まずスペース全体
2. LLM: 「設計書」フォルダ（ID: 99999）を発見
3. LLM: get_space_tree(spaceKey: "DEV", pageId: "99999")  ← 配下を詳細取得
4. LLM: 目的のページを特定して本文取得
```

## TODO

- [ ] Confluence API v2の詳細仕様を確認
- [ ] ページネーション実装
- [ ] 階層構築ロジック実装
- [ ] エラーハンドリング
- [ ] テスト作成
