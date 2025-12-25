# get_space_tree 実装手順

## Phase 0: API仕様の確認
1. Confluence v2のエンドポイントとクエリを確認:
   - スペース取得（キー指定）
   - スペース配下ページ一覧
   - ページ子一覧
   - ページネーションのcursor形式
   - description/excerptの取得方法（expandパラメータ等）
2. この環境のCONFLUENCE_BASE_URLに/wikiが含まれるか確認。

## Phase 1: APIクライアント拡張
1. `packages/confluence-content/src/lib/confluence-api.ts`にv2用型を追加:
   - SpaceSummary（id, key, name）
   - PageSummary（id, title, parentId, description?, excerpt?）
   - PagedResponse（results, _links）
2. _links.nextからcursorを抽出する共通ヘルパーを追加。
3. 新規メソッドを追加:
   - getSpaceByKey(spaceKey)
   - listSpacePages(spaceId, cursor?)
   - getPageInfo(pageId)
   - listPageChildren(pageId, cursor?)
4. ページネーションの全件取得ヘルパーを用意:
   - listAllSpacePages(spaceId)
   - listAllPageChildrenRecursive(pageId)
5. 既存のConfluenceApiErrorの流儀に合わせてエラー処理。

## Phase 2: ツリー構築ヘルパー
1. ツリー構築用の純粋関数を新規ファイルで実装:
   - 入力: PageSummary[]（id, title, parentId, description?, excerpt?）
   - 出力: PageNode[]（id, title, description?, excerpt?, children）
2. pageId指定時のサブツリー切り出しもここで対応。
3. ソートは原則API順。要件があればタイトル順などに変更。

## Phase 3: ツール実装
1. `packages/confluence-content/src/tools/get-space-tree.ts`を追加:
   - tool名: get_space_tree
   - 入力: spaceKey（必須）, pageId（任意）
   - 出力: spaceKey/spaceName/rootPageId/rootPageTitle/pages をJSON文字列で返却
2. ハンドラ手順:
   - 入力バリデーション
   - spaceKeyでスペース解決
   - pageIdなし: スペース全ページ取得 → ツリー化
   - pageIdあり: 起点ページ取得 → スペース一致確認 → 子取得 → ツリー化
3. サイズや件数のログを出力（本文はログしない）。
4. 既存ツールと同様のエラーメッセージに整形。

## Phase 4: サーバー登録
1. `packages/confluence-content/src/server.ts`を更新:
   - tools/listにget_space_treeを追加
   - tools/callでget_space_treeを分岐

## Phase 5: テスト
1. `packages/confluence-content/src/tools/get-space-tree.test.ts`を追加:
   - スキーマ/説明のテスト
   - バリデーションテスト
   - エラー変換テスト
2. ツリー構築ヘルパーの単体テスト追加。
3. bun:testのmockでAPI呼び出しをモック化。

## Phase 6: ドキュメント
1. `packages/confluence-content/README.md`にツール説明と入出力例を追記。
2. 必要ならトップレベルのREADMEも更新。

## Phase 7: 検証
1. `bun test`（対象パッケージ）を実行。
2. `bun run check`でフォーマット/リントを適用。
3. ローカル起動でtools/listに含まれることを確認。

## 受け入れ条件
- get_space_treeが本文なしのツリー構造を返す。
- spaceKeyのみでスペース全体のツリーを返す。
- pageId指定時はサブツリーとrootPage情報を返す。
- エラーが分かりやすいメッセージで返る。
- 単体テストがバリデーションとツリー構築をカバー。
