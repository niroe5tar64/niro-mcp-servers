# 次のステップ

**作成日時**: 2025-12-16
**最終更新**: 2025-12-16

---

## 📍 現在の状況

### ✅ 完了済み

**フェーズ1: コアライブラリ**
- `@niro-mcp/confluence-cleaner` パッケージ完成
- HTML → Markdown 変換、トークン推定（CJK対応）
- 全テスト合格

**フェーズ2: MCP サーバー**
- `@niro-mcp/confluence-md` パッケージ完成
- MCPサーバー実装（stdio/HTTP対応）
- 必須パラメータバリデーション追加
- **全32テスト合格** ✅

**フェーズ3: Docker 動作確認**
- ✅ Docker設定レビュー完了
- ✅ Dockerイメージビルド成功
- ✅ コンテナ起動テスト成功
- ✅ MCPサーバーstdioモード動作確認
- ✅ docker-compose.yml 最適化（version属性削除）

### 👉 現在地: フェーズ4 - Claude Desktop 統合

---

## 🎯 次にやること: Claude Desktop 統合

### 1. Claude Desktop 設定ファイルの場所を確認

**macOS**:
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows**:
```
%APPDATA%\Claude\claude_desktop_config.json
```

---

### 2. 設定ファイルに MCP サーバーを追加

既存の `claude_desktop_config.json` を開き、以下を追加：

```json
{
  "mcpServers": {
    "confluence-md": {
      "command": "docker",
      "args": [
        "compose",
        "-f",
        "/Users/eitarofutakuchi/source_code/ops-tools/niro-mcp-servers/docker-compose.yml",
        "run",
        "--rm",
        "confluence-md"
      ]
    }
  }
}
```

**重要**:
- `/Users/eitarofutakuchi/source_code/ops-tools/niro-mcp-servers` の部分は実際のプロジェクトパスに置き換えてください
- 既に他のMCPサーバーが設定されている場合は、`mcpServers` オブジェクト内に追加してください

---

### 3. Claude Desktop を再起動

設定ファイルを保存したら、Claude Desktop を完全に終了して再起動します。

---

### 4. ツールが認識されているか確認

Claude Desktop を開き、以下を確認：

1. **ツールアイコン確認**
   - チャット画面にツールアイコン（🔧）が表示されるか
   - `confluence-md` サーバーが接続されているか

2. **ツール一覧確認**
   - 利用可能なツールに `convert_confluence_to_markdown` が表示されるか

---

### 5. 実際のHTML変換をテスト

Claude Desktop で以下のように依頼してテストします：

```
以下のConfluence HTMLをMarkdownに変換してください：

<html>
<div class="confluence-content">
  <h1>テストページ</h1>
  <p>これはテストです。</p>
  <ac:structured-macro ac:name="info">
    <ac:rich-text-body>
      <p>重要な情報</p>
    </ac:rich-text-body>
  </ac:structured-macro>
</div>
</html>
```

**期待される結果**:
- MCPサーバーが `convert_confluence_to_markdown` ツールを使用
- クリーンなMarkdownが返される
- トークン推定値が表示される

---

## 📋 問題が発生した場合

### Claude Desktop がツールを認識しない
1. 設定ファイルのパスが正しいか確認
2. JSON構文が正しいか確認（カンマ、括弧など）
3. Claude Desktop を完全に再起動
4. ログを確認:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`

### Docker コンテナが起動しない
```bash
# 手動でテスト
cd /Users/eitarofutakuchi/source_code/ops-tools/niro-mcp-servers
docker compose run --rm confluence-md
```

### ツールが動作しない
- MCPサーバーのログを確認
- Dockerコンテナのログを確認: `docker compose logs confluence-md`
- パッケージのテストを再実行: `cd packages/confluence-md && bun test`

---

## 🚀 フェーズ4完了後

**次はフェーズ5: 本番デプロイ・運用**

1. パフォーマンスチューニング
   - 大容量HTMLの処理性能測定
   - メモリ使用量の最適化

2. ドキュメント整備
   - ユーザーガイド作成
   - トラブルシューティング

3. 本番環境での長期運用テスト

---

## 📚 参考ドキュメント

- **全体計画**: `ROADMAP.md`
- **プロジェクト概要**: `README.md`
- **パッケージ詳細**: `packages/confluence-md/README.md`
- **MCP公式ドキュメント**: https://modelcontextprotocol.io/
- **Claude Desktop設定ガイド**: https://docs.anthropic.com/claude/docs

---

## 💬 新しいセッションでの指示例

```
NEXT_STEPS.md を読んで、フェーズ4のClaude Desktop統合を進めてください。
```

または

```
ROADMAP.md と NEXT_STEPS.md を読んで、現在の状況と次のステップを教えてください。
```
