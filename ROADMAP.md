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
👉 フェーズ3: Docker 動作確認 (次のステップ)
🔜 フェーズ4: Claude Desktop 統合
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

### フェーズ3: Docker 動作確認 🔜

> **注**: Dockerfile と docker-compose.yml は既に完璧な状態で実装済み
> - ✅ マルチステージビルド
> - ✅ セキュリティ設定（read-only filesystem, 非rootユーザー）
> - ✅ stdio通信対応
> - ✅ 開発用ボリュームマウント

#### 実施タスク
- [ ] 既存のDocker設定を確認
  - Dockerfile のレビュー
  - docker-compose.yml のレビュー
- [ ] Docker イメージのビルド
  ```bash
  docker compose build confluence-md
  ```
- [ ] コンテナ起動テスト
  ```bash
  docker compose run --rm confluence-md
  ```
- [ ] 動作確認
  - コンテナが正常に起動するか
  - エラーログがないか
  - MCPサーバーが応答するか

---

### フェーズ4: Claude Desktop 統合 🔜

#### 予定タスク
- [ ] Claude Desktop 設定ファイルの作成
  - `claude_desktop_config.json` への追加
  - Docker Compose コマンドの設定
- [ ] Claude Desktop からの接続テスト
  - ツール認識確認（`convert_confluence_to_markdown` が表示されるか）
  - 実際の HTML 変換テスト
- [ ] エラーケースの確認
  - 不正な入力データ
  - タイムアウト処理
  - コンテナ起動失敗時の挙動

#### 成功基準
- Claude Desktop で "convert_confluence_to_markdown" ツールが利用可能
- Confluence HTML を貼り付けて Markdown 変換が成功
- トークン削減率が約50%達成

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

1. **Docker 動作確認** (フェーズ3)
   - ✅ 既存のDocker設定確認（Dockerfile, docker-compose.yml は実装済み）
   - [ ] Docker イメージのビルド
   - [ ] コンテナ起動テスト
   - [ ] 動作確認（起動・エラーログ・MCP応答）

2. **Claude Desktop 統合** (フェーズ4)
   - Claude Desktop 設定ファイルへの追加
   - 実際の接続・変換テスト
   - エンドツーエンド動作確認

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
| 2025-12-16 | 必須パラメータバリデーション追加、フェーズ2完了 | `5ecd579` |
| 2025-12-16 | プロジェクトロードマップ追加 | `866b6dc` |
| 2025-12-16 | トークン推定精度を改善（CJK対応） | `8622d90` |
