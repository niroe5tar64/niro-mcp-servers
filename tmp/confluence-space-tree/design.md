# get_space_tree 設計書

## 目的
- Confluenceスペース配下のページツリーを本文なしで取得する。
- LLMがページIDを特定し、後続でget_confluence_page_markdownを呼べるようにする。

## 非対象
- 全文検索やCQL検索。
- Markdown変換や本文取得。
- 添付ファイル、コメント、書き込み操作。
- キャッシュや増分同期（将来対応）。

## 入力
- spaceKey（string, 必須）
- pageId（string, 任意）: 指定時はそのページ配下のみを返す。

注: summaryはspaceKeyのみ記載。v1でpageIdを含めるか要確認。

## 出力
```
{
  spaceKey: string,
  spaceName: string,
  rootPageId?: string,
  rootPageTitle?: string,
  pages: PageNode[]
}

PageNode = {
  id: string,
  title: string,
  children: PageNode[]
}
```

## 使用API
Confluence Cloud REST API v2を使用。

前提: CONFLUENCE_BASE_URLに/wikiが含まれている場合、v2は次の形式。
- {baseUrl}/api/v2
- 既存v1は {baseUrl}/rest/api

### スペース取得
```
GET {baseUrl}/api/v2/spaces?keys={spaceKey}
```
期待: results[0]にid/key/name。クエリ名は要確認。

### スペース全体のページ一覧
```
GET {baseUrl}/api/v2/spaces/{spaceId}/pages?limit=...&cursor=...
```
期待: results[]にid/title/parentId。レスポンス項目は要確認。

### ページ情報（pageId指定時の起点確認）
```
GET {baseUrl}/api/v2/pages/{pageId}
```
期待: id/title/spaceId。

### 子ページ一覧（pageId指定時）
```
GET {baseUrl}/api/v2/pages/{pageId}/children?limit=...&cursor=...
```
期待: results[]にid/title/parentId。

## ページネーション
- limit（例: 100）で呼び出し回数を減らす。
- _links.nextがある場合、URLからcursorを抽出して継続取得。
- 無限ループ防止のガードを置く。

## ツリー構築
1. Map(id -> PageNode)を作成。
2. parentIdがある場合は親にぶら下げる。
3. parentIdがない、または親が不明なものをルートとして扱う。
4. pageId指定時は、その配下のみを返す。

## エラーハンドリング
- スペースが存在しない -> ツールエラー（404相当）。
- ページが存在しない -> ツールエラー（pageId付き）。
- pageIdがspaceKeyと不一致 -> ツールエラー。
- 認証（401/403）やタイムアウト（408）は既存ツールと同様の文面。

## ログ
- spaceKey、ページ数、ルート数、レスポンスサイズを出力。
- 具体的なツリー内容はログに出さない。

## テスト
- 親子の順序がバラバラな入力でのツリー構築テスト。
- ページネーションのcursor抽出テスト。
- 入力バリデーション（spaceKey必須、pageId形式）。
- エラー変換（401/403/404/timeout）。

## 未確定事項
- v1でpageIdを含めるか。
- v2エンドポイントとクエリパラメータの確定。
- ソート順（API順かタイトル順か）。
- アーカイブページの扱い。
