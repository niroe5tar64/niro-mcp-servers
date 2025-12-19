# Confluence HTMLビュー形式取得機能 実装計画書

## 📋 概要

### 背景
現在、`confluence-searcher` MCPサーバーを使用してConfluenceページのコンテンツを取得していますが、取得できるのは**ストレージ形式（XML）**のみです。マクロがどのようにHTMLとしてレンダリングされるかを確認するには、**HTMLビュー形式（レンダリング済みHTML）**を取得する必要があります。

### 目的
- Confluenceページのレンダリング済みHTMLを取得する機能を提供
- マクロが展開された状態のHTMLを確認可能にする
- 既存の`confluence-md`パッケージとの連携を可能にする

### 問題点
- `confluence-searcher`は外部所有物のため改修できない
- ストレージ形式（XML）からは、マクロの最終的なHTML表現を推測できない
- マクロ情報を保持したMarkdownにしても、最終的なHTML表現が不明では実用的でない

---

## 🎯 要件定義

### 機能要件

#### FR1: ConfluenceページのHTMLビュー形式取得
- **入力**: ページID（`pageId`）
- **出力**: レンダリング済みHTML（`body.view.value`）
- **API**: `GET /rest/api/content/{pageId}?expand=body.view`

#### FR2: ページ情報の取得
- ページID、タイトル、スペース情報を含む
- 既存の`confluence-searcher`と同様の情報構造

#### FR3: エラーハンドリング
- ページが存在しない場合のエラー処理
- API認証エラーの処理
- ネットワークエラーの処理

### 非機能要件

#### NFR1: セキュリティ
- 社内ネットワーク経由でのみConfluence APIにアクセス
- 認証情報の安全な管理（環境変数）
- Read-onlyアクセス（ページ取得のみ）

#### NFR2: パフォーマンス
- APIレスポンス時間の最適化
- タイムアウト設定（推奨: 30秒）

#### NFR3: 互換性
- 既存の`confluence-md`パッケージとの連携
- MCPプロトコル準拠

---

## 🏗️ 実装方針

### アーキテクチャ選択肢

#### 選択肢A: 新規パッケージ `confluence-content` を作成（推奨）
**メリット:**
- 機能の独立性が高い
- 既存パッケージへの影響なし
- 将来的な拡張が容易
- パッケージ名が機能を明確に表現（コンテンツ取得全般に対応）
- Confluence APIの`/rest/api/content`エンドポイントと一致

**デメリット:**
- 新しいパッケージの管理が必要
- 設定ファイルの追加が必要

#### 選択肢B: 既存パッケージ `confluence-md` に統合
**メリット:**
- 設定がシンプル
- 関連機能が一箇所に集約

**デメリット:**
- パッケージの責務が増える
- 依存関係の複雑化

### 推奨案: 選択肢A（新規パッケージ作成）

**理由:**
- 単一責任の原則に従う
- `confluence-md`は「変換」に特化、`confluence-content`は「取得」に特化
- 将来的に他の機能（ページ一覧取得、検索、添付ファイルなど）を追加しやすい
- パッケージ名が機能を明確に表現している
- Confluence APIのエンドポイント命名と一致している

---

## 🔧 技術的詳細

### パッケージ構成

```
packages/
└── confluence-content/
    ├── package.json
    ├── tsconfig.json
    ├── README.md
    ├── src/
    │   ├── index.ts              # エントリーポイント
    │   ├── server.ts             # MCPサーバー設定
    │   ├── tools/
    │   │   └── get-page-view.ts  # HTMLビュー取得ツール
    │   ├── transports/
    │   │   ├── stdio.ts          # stdioトランスポート
    │   │   └── http.ts           # HTTPトランスポート
    │   └── lib/
    │       └── confluence-api.ts # Confluence API クライアント
    └── tests/
        └── get-page-view.test.ts
```

### 依存関係

```json
{
  "name": "@niro-mcp/confluence-content",
  "version": "0.1.0",
  "private": true,
  "description": "Confluence Content Fetcher MCP Server",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "bun": "latest"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.0.0"
  }
}
```

### Confluence API クライアント実装

#### API エンドポイント
```
GET /rest/api/content/{pageId}?expand=body.view
```

#### 認証
- Basic認証またはAPIトークン
- 環境変数から取得: `CONFLUENCE_BASE_URL`, `CONFLUENCE_USERNAME`, `CONFLUENCE_PASSWORD`（または`CONFLUENCE_API_TOKEN`）

#### レスポンス構造
```typescript
interface ConfluencePageView {
  id: string;
  title: string;
  space: {
    key: string;
    name: string;
  };
  body: {
    view: {
      value: string; // レンダリング済みHTML
      representation: "view";
    };
  };
  _links: {
    webui: string;
    self: string;
  };
}
```

### MCPツール定義

#### ツール名
`get_confluence_page_view`

#### 入力スキーマ
```typescript
{
  type: "object",
  properties: {
    pageId: {
      type: "string",
      description: "Confluence page ID"
    }
  },
  required: ["pageId"]
}
```

#### 出力
```typescript
{
  content: [
    {
      type: "text",
      text: JSON.stringify({
        pageInfo: {
          id: string;
          title: string;
          spaceKey: string;
          spaceName: string;
          _links: {...}
        },
        html: string; // レンダリング済みHTML
      }, null, 2)
    }
  ]
}
```

---

## 📝 実装手順

### フェーズ1: プロジェクトセットアップ

1. **パッケージディレクトリの作成**
   ```bash
   mkdir -p packages/confluence-content/src/{tools,transports,lib}
   mkdir -p packages/confluence-content/tests
   ```

2. **package.json の作成**
   - パッケージ名: `@niro-mcp/confluence-content`
   - 依存関係の定義
   - スクリプト定義（dev, build, test）

3. **tsconfig.json の作成**
   - 既存の`confluence-md`を参考に設定

4. **README.md の作成**
   - パッケージの説明
   - セットアップ手順
   - 使用方法

### フェーズ2: Confluence API クライアント実装

1. **`src/lib/confluence-api.ts` の実装**
   - API クライアントクラス
   - 認証処理
   - エラーハンドリング
   - タイムアウト設定

2. **環境変数の定義**
   - `CONFLUENCE_BASE_URL`
   - `CONFLUENCE_USERNAME`
   - `CONFLUENCE_PASSWORD` または `CONFLUENCE_API_TOKEN`

### フェーズ3: MCPツール実装

1. **`src/tools/get-page-view.ts` の実装**
   - ツール定義
   - ツールハンドラー
   - 入力バリデーション
   - エラーハンドリング

2. **レスポンス形式の定義**
   - 既存の`confluence-searcher`と互換性のある形式

### フェーズ4: MCPサーバー実装

1. **`src/server.ts` の実装**
   - MCPサーバーの作成
   - ツールの登録
   - エラーハンドリング

2. **`src/index.ts` の実装**
   - エントリーポイント
   - トランスポート選択（stdio/HTTP）

3. **`src/transports/stdio.ts` の実装**
   - stdioトランスポート（Claude Desktop用）

4. **`src/transports/http.ts` の実装**
   - HTTPトランスポート（リモートアクセス用、オプション）

### フェーズ5: テスト実装

1. **ユニットテスト**
   - API クライアントのテスト
   - ツールハンドラーのテスト
   - エラーケースのテスト

2. **統合テスト**
   - MCPプロトコルのテスト
   - エンドツーエンドテスト

### フェーズ6: Docker設定

1. **Dockerfile の作成**
   - 既存の`confluence-md`を参考に作成

2. **docker-compose.yml の更新**
   - 新しいサービス`confluence-content`の追加
   - 環境変数の設定

### フェーズ7: ドキュメント整備

1. **README.md の更新**
   - 使用方法
   - 設定手順
   - トラブルシューティング

2. **ルートREADME.md の更新**
   - 新しいパッケージの追加

3. **ROADMAP.md の更新**
   - 実装完了の記録

---

## 🧪 テスト計画

### テストケース

#### TC1: 正常系 - ページHTMLビュー取得
- **入力**: 有効なページID
- **期待結果**: レンダリング済みHTMLが返される
- **検証項目**:
  - レスポンスに`html`フィールドが含まれる
  - HTMLが適切にレンダリングされている（マクロが展開されている）
  - ページ情報が正しく含まれる

#### TC2: 異常系 - 存在しないページID
- **入力**: 存在しないページID
- **期待結果**: 適切なエラーメッセージが返される
- **検証項目**:
  - エラーメッセージが明確
  - HTTPステータスコードが404

#### TC3: 異常系 - 認証エラー
- **入力**: 無効な認証情報
- **期待結果**: 認証エラーメッセージが返される
- **検証項目**:
  - エラーメッセージが明確
  - HTTPステータスコードが401

#### TC4: 異常系 - ネットワークエラー
- **入力**: 到達不可能なConfluence URL
- **期待結果**: ネットワークエラーメッセージが返される
- **検証項目**:
  - タイムアウト設定が機能する
  - エラーメッセージが明確

#### TC5: 統合テスト - MCPプロトコル
- **入力**: MCPクライアントからのリクエスト
- **期待結果**: 正しいMCPレスポンス形式で返される
- **検証項目**:
  - レスポンス形式がMCPプロトコルに準拠
  - ツールが正しく登録されている

---

## 🔄 既存パッケージとの連携

### `confluence-md` との連携

#### 使用例
```typescript
// 1. HTMLビュー形式を取得
const viewResult = await getConfluencePageView({ pageId: "2447941326" });
const html = viewResult.html;

// 2. Markdownに変換
const markdown = await convertConfluenceToMarkdown({ 
  html,
  expandMacros: true,
  removeMetadata: true,
  convertTables: true
});
```

#### ワークフロー
1. `confluence-content`でHTMLビュー形式を取得
2. `confluence-md`でMarkdownに変換
3. LLMで処理

---

## 🚀 将来の拡張計画

### 機能拡張候補

#### 1. 複数ページの一括取得
- ページIDの配列を受け取り、複数ページのHTMLビューを取得
- バッチ処理の最適化

#### 2. ページ検索機能
- スペース内のページ検索
- タイトル、コンテンツでの検索

#### 3. 添付ファイル情報の取得
- ページに添付されているファイルの一覧取得
- ファイルダウンロード機能（オプション）

#### 4. ページ履歴の取得
- ページのバージョン履歴
- 特定バージョンのHTMLビュー取得

#### 5. キャッシュ機能
- 取得したHTMLビューのキャッシュ
- キャッシュ有効期限の設定

---

## 📊 実装工数見積もり

| フェーズ | タスク | 工数（時間） |
|---------|-------|------------|
| フェーズ1 | プロジェクトセットアップ | 2h |
| フェーズ2 | Confluence API クライアント | 4h |
| フェーズ3 | MCPツール実装 | 3h |
| フェーズ4 | MCPサーバー実装 | 3h |
| フェーズ5 | テスト実装 | 4h |
| フェーズ6 | Docker設定 | 2h |
| フェーズ7 | ドキュメント整備 | 2h |
| **合計** | | **20h** |

---

## ⚠️ リスクと対策

### リスク1: Confluence API のバージョン互換性
**リスク**: ConfluenceのバージョンによってAPIの仕様が異なる可能性
**対策**: 
- 複数バージョンでのテスト
- APIバージョン指定のサポート
- エラーメッセージでバージョン情報を提供

### リスク2: 認証情報の管理
**リスク**: 認証情報の漏洩や管理ミス
**対策**:
- 環境変数での管理
- Docker secretsの使用（本番環境）
- 認証情報のログ出力禁止

### リスク3: 大容量HTMLの処理
**リスク**: 大きなページのHTMLがメモリを圧迫
**対策**:
- ストリーミング処理の検討
- タイムアウト設定
- メモリ使用量の監視

### リスク4: レート制限
**リスク**: Confluence APIのレート制限に達する
**対策**:
- リトライロジックの実装
- レート制限エラーの適切な処理
- キャッシュ機能の実装（将来）

---

## 📚 参考資料

### Confluence REST API ドキュメント
- [Confluence REST API - Get Content](https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-content/#api-ws-rest-api-content-id-get)
- [Confluence REST API - Expand Parameters](https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-content/#api-ws-rest-api-content-id-get)

### 既存実装の参考
- `packages/confluence-md/` - MCPサーバーの実装パターン
- `packages/shared/confluence-cleaner/` - Confluence処理のロジック

---

## ✅ 承認・確認事項

### 実装前の確認
- [ ] Confluence API へのアクセス権限の確認
- [ ] 認証情報の取得方法の確認
- [ ] テスト環境の準備

### 実装後の確認
- [ ] 正常系の動作確認
- [ ] 異常系の動作確認
- [ ] 既存パッケージとの連携確認
- [ ] ドキュメントの確認

---

## 📝 更新履歴

| 日付 | バージョン | 変更内容 | 作成者 |
|------|-----------|---------|--------|
| 2025-01-XX | 1.0.0 | 初版作成 | - |

---

## 🎯 次のステップ

1. **計画書のレビュー・承認**
2. **実装開始**（フェーズ1から順次実施）
3. **テスト環境での動作確認**
4. **本番環境へのデプロイ**

