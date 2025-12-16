# 開発ロードマップ

**niro-mcp-servers** - Confluence → Markdown 変換 MCP サーバープロジェクト

最終更新: 2025-12-16

---

## 📊 プロジェクト概要

Confluence の HTML コンテンツを LLM 向けにクリーンな Markdown に変換する MCP サーバーを構築する。
トークン削減（約50%）により、Claude のコンテキスト消費を最小化し、効率的なドキュメント処理を実現する。

---

## 🎯 現在の位置

```
✅ フェーズ1: コアライブラリ (完了)
✅ フェーズ2: MCP サーバー (完了)
✅ フェーズ3: Docker 動作確認 (完了)
👉 フェーズ4: Cursor 統合 (次のステップ)
🔜 フェーズ5: 本番デプロイ・運用
```

---

## 📋 開発フェーズ

### フェーズ1: コアライブラリ ✅ (完了)

**パッケージ:** `@niro-mcp/confluence-cleaner`

#### 完了項目
- ✅ HTML → Markdown 変換ロジック
  - Turndown Service を使用した基本変換
  - GFM (GitHub Flavored Markdown) サポート
- ✅ Confluence メタデータ除去
  - class, style, data-* 属性の削除
  - cheerio による安全な HTML パース
- ✅ Confluence マクロ展開
  - info, warning, note, tip, code マクロ対応
  - `<ac:structured-macro>` 形式のサポート
  - 言語指定付きコードブロック
- ✅ テーブル変換
  - Markdown テーブル形式への変換
  - HTML テーブル保持オプション
- ✅ トークン推定機能
  - **改善完了**: CJK（日本語・中国語・韓国語）文字対応
  - CJK: 2.5文字/トークン、英語: 4文字/トークン
  - 空白・改行除外による精度向上
  - ゼロ除算対策（NaN 返却）
- ✅ 包括的なテスト
  - 全テストケース合格
  - エッジケース対応（空文字列、不正HTML、大容量データ）

#### 最終コミット
- `8622d90` - feat: トークン推定精度を改善しCJK文字に対応

---

### フェーズ2: MCP サーバー ✅ (完了)

**パッケージ:** `@niro-mcp/confluence-md`

#### 完了項目
- ✅ MCP サーバー基盤実装
  - `src/index.ts` - エントリーポイント（stdio/HTTP 切替）
  - `src/server.ts` - MCP サーバー設定
  - `src/tools/confluence-converter.ts` - ツール実装
  - `src/transports/stdio.ts` - Claude Desktop 用トランスポート
  - `src/transports/http.ts` - リモートアクセス用トランスポート
- ✅ ツール定義
  - `convert_confluence_to_markdown` ツール
  - 入力スキーマ定義（html, removeMetadata, expandMacros, convertTables）
  - エラーハンドリング
- ✅ 必須パラメータバリデーション
  - `html` パラメータの型チェック
  - 適切なエラーメッセージ返却
- ✅ テスト実装
  - 統合テスト（MCP プロトコル）
  - ユニットテスト（ツールロジック）
  - **全32テスト合格**

#### 最終コミット
- `5ecd579` - fix: 必須パラメータのバリデーションを追加
- `866b6dc` - docs: プロジェクト全体のロードマップを追加

---

### フェーズ3: Docker 動作確認 ✅ (完了)

#### 完了項目
- ✅ Docker設定の確認
  - Dockerfile のレビュー（マルチステージビルド、セキュリティ設定）
  - docker-compose.yml のレビュー（stdio通信、セキュリティオプション）
- ✅ Docker イメージのビルド成功
- ✅ コンテナ起動テスト成功
  - MCPサーバーがstdioモードで正常起動
  - `Confluence-MD MCP Server running on stdio` 確認
- ✅ docker-compose.yml の最適化
  - 古い `version` 属性を削除

#### 最終確認
- ✅ コンテナが正常に起動
- ✅ エラーログなし（警告は解消済み）
- ✅ MCPサーバーがstdio通信で応答

---

### フェーズ4: Cursor 統合 🔜

> **重要**: CursorはMCPプロトコルをネイティブサポート済み（2025年1月時点）
> - ✅ stdio/sse トランスポート対応
> - ✅ Composer Agent統合（自動ツール使用）
> - ✅ 最大40個のツールをサポート

#### 予定タスク
- [ ] Cursor MCP 設定ファイルの作成
  - `~/.cursor/mcp.json` または `.cursor/mcp.json` への追加
  - Docker Compose コマンドの設定
- [ ] Cursor からの接続テスト
  - Cursor Settings > Features > MCP でサーバー確認
  - ツール認識確認（`convert_confluence_to_markdown` が表示されるか）
- [ ] Composer Agent での動作確認
  - 実際の HTML 変換テスト
  - 自動ツール使用の確認
- [ ] エラーケースの確認
  - 不正な入力データ
  - タイムアウト処理
  - コンテナ起動失敗時の挙動

#### 成功基準
- Cursor Composer で "convert_confluence_to_markdown" ツールが利用可能
- Confluence HTML を貼り付けて Markdown 変換が成功
- トークン削減率が約50%達成
- Composer Agent が自動的にツールを使用

---

### フェーズ5: 本番デプロイ・運用 🔜

#### 予定タスク
- [ ] 本番環境での動作確認
- [ ] パフォーマンスチューニング
  - 大容量 HTML の処理性能
  - メモリ使用量の最適化
- [ ] ドキュメント整備
  - ユーザーガイド作成
  - トラブルシューティング
- [ ] 監視・ログ設定
  - エラーログの集約
  - 使用統計の収集（オプション）

---

## 🔥 現在の最優先タスク

1. **Cursor 統合** (フェーズ4)
   - [ ] Cursor MCP 設定ファイルの作成（`~/.cursor/mcp.json`）
   - [ ] MCPサーバー登録（Docker Compose経由）
   - [ ] Cursor Settings > Features > MCP でサーバー確認
   - [ ] ツール認識確認（`convert_confluence_to_markdown`）
   - [ ] Composer Agent での動作テスト
   - [ ] 実際のHTML変換テスト（エンドツーエンド）

2. **本番デプロイ・運用** (フェーズ5)
   - 本番環境での動作確認
   - パフォーマンスチューニング
   - ドキュメント整備

---

## 🚀 将来の拡張計画

### 追加機能候補
- [ ] Confluence API 統合
  - ページ ID からの直接取得
  - 添付ファイルの処理
- [ ] キャッシュ機能
  - 変換結果のキャッシュ
  - トークン削減率の統計
- [ ] 複数ページの一括変換
  - スペース全体のエクスポート
  - 階層構造の保持

### 追加 MCP サーバー候補
- [ ] JIRA MCP サーバー
  - チケット情報の取得・整形
- [ ] Slack MCP サーバー
  - スレッド情報の Markdown 化

---

## 📚 参考リンク

- [MCP 公式ドキュメント](https://modelcontextprotocol.io/)
- [Claude Desktop 設定ガイド](https://docs.anthropic.com/claude/docs)
- [プロジェクト README](./README.md)
- [Confluence-MD パッケージ](./packages/confluence-md/README.md)

---

## 📝 更新履歴

| 日付 | 内容 | コミット |
|------|------|----------|
| 2025-12-16 | Docker動作確認完了、フェーズ3完了 | (予定) |
| 2025-12-16 | 必須パラメータバリデーション追加、フェーズ2完了 | `5ecd579` |
| 2025-12-16 | プロジェクトロードマップ追加 | `866b6dc` |
| 2025-12-16 | トークン推定精度を改善（CJK対応） | `8622d90` |
