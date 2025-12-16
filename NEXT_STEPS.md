# 次のステップ

**作成日時**: 2025-12-16
**最終更新**: 2025-12-16 (フェーズ4完了、フェーズ5準備中)

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

**フェーズ4: Cursor 統合（完了）**
- ✅ `.cursor/mcp.json` ファイル作成（コミット: `30828e4`）
- ✅ プロジェクトパスの置き換え（Cursorで実施）
- ✅ Cursor再起動と接続確認（Cursorで実施）
- ✅ 実際のHTML変換テスト（Cursorで実施） - **完了: 2025-12-16**
  - テスト結果: トークン削減率74.6%（期待値50%を上回る）
  - Confluenceマクロ展開、テーブル変換が正常に動作

### 👉 現在地: フェーズ5 - 本番デプロイ・運用準備

**重要な発見**:
- ✅ CursorはMCPプロトコルをネイティブサポート（2025年1月時点）
- ✅ stdio/sse トランスポート対応
- ✅ Composer Agent統合（自動ツール使用）
- ✅ 最大40個のツールをサポート

**Claude Codeで完了した準備作業**:
- ✅ `.cursor/mcp.json` ファイル作成
- ⚠️ パスはプレースホルダー（`<PROJECT_ABSOLUTE_PATH>`）のまま
- 👉 **次はCursorでの作業が必要です**

---

## 🎯 次にやること: Cursor 統合

### 1. Cursor MCP 設定ファイルの場所を確認

**グローバル設定（すべてのプロジェクトで利用可能）**:
```bash
~/.cursor/mcp.json
```

**プロジェクト固有設定（このプロジェクトのみ）**:
```bash
<project-root>/.cursor/mcp.json
```

**推奨**: プロジェクト固有設定（`.cursor/mcp.json`）を使用

---

### 2. 設定ファイルに MCP サーバーを追加

プロジェクトルートに `.cursor/mcp.json` を作成し、以下を追加：

```json
{
  "mcpServers": {
    "confluence-md": {
      "command": "docker",
      "cwd": "${workspaceFolder}",
      "args": [
        "compose",
        "-f",
        "docker-compose.yml",
        "run",
        "--rm",
        "confluence-md"
      ]
    }
  }
}
```

**重要な注意点**:
- `${workspaceFolder}`変数を使用することで、プロジェクトルートからの相対パスで指定できます
- これにより、プロジェクトの絶対パスに依存せず、設定の移植性が向上します
- `cwd`オプションで作業ディレクトリを指定し、`docker-compose.yml`を相対パスで指定しています
- 既に他のMCPサーバーが設定されている場合は、`mcpServers` オブジェクト内に追加してください

---

### 3. Cursor を再起動

設定ファイルを保存したら、Cursor を完全に終了して再起動します。

---

### 4. MCP サーバーが認識されているか確認

#### 方法1: Cursor Settings から確認

1. Cursor を開く
2. `Cursor Settings` > `Features` > `MCP` に移動
3. `confluence-md` サーバーが表示されているか確認
4. ステータスが「Connected」になっているか確認

#### 方法2: Available Tools を確認

1. Composer を開く（`Cmd+I` / `Ctrl+I`）
2. Available Tools に `convert_confluence_to_markdown` が表示されているか確認

---

### 5. Composer Agent で実際のHTML変換をテスト

Cursor Composer で以下のように依頼してテストします：

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
  <table>
    <tr>
      <th>項目</th>
      <th>値</th>
    </tr>
    <tr>
      <td>テスト1</td>
      <td>100</td>
    </tr>
  </table>
</div>
</html>
```

**期待される結果**:
- Composer Agent が `convert_confluence_to_markdown` ツールを自動的に使用
- クリーンなMarkdownが返される
- トークン推定値が表示される（元: ○○トークン → 変換後: △△トークン）
- 約50%のトークン削減が確認できる

**Composer Agent の動作**:
- ツール名や説明から関連性を判断し、自動的に使用
- 明示的にツール使用を指示する場合: 「convert_confluence_to_markdown ツールを使って変換してください」

---

## 📋 問題が発生した場合

### Cursor がツールを認識しない

1. **設定ファイルの確認**
   - `.cursor/mcp.json` のパスが正しいか
   - JSON構文が正しいか（カンマ、括弧など）
   - 絶対パスを使用しているか

2. **Cursor を完全に再起動**
   - すべてのウィンドウを閉じる
   - プロセスを完全に終了
   - 再度起動

3. **ログを確認**
   - Cursor Developer Tools を開く（`Cmd+Option+I` / `Ctrl+Shift+I`）
   - Console でエラーメッセージを確認

4. **手動でDockerコンテナをテスト**
   ```bash
   cd /Users/eitarofutakuchi/source_code/ops-tools/niro-mcp-servers
   docker compose run --rm confluence-md
   ```
   - 正常に起動するか確認
   - エラーが出ないか確認

### Docker コンテナが起動しない

```bash
# イメージを再ビルド
docker compose build --no-cache confluence-md

# 手動でテスト
docker compose run --rm confluence-md
```

### ツールが動作しない

1. **MCPサーバーのログを確認**
   ```bash
   docker compose logs confluence-md
   ```

2. **テストを再実行**
   ```bash
   cd packages/confluence-md
   bun test
   ```

3. **Dockerイメージを再ビルド**
   ```bash
   docker compose build --no-cache confluence-md
   ```

---

## 🚀 フェーズ4完了後

**次はフェーズ5: 本番デプロイ・運用**

### デプロイ方法の選択肢

> **注意**: 現在の構成（ローカルDockerコンテナ）で十分な場合は、デプロイは不要です。
> MCPサーバーは通常、CursorやClaude Desktopと同じマシン上で実行されることが前提です。

もしもデプロイする場合、以下の選択肢があります：

#### 1. ローカルDockerコンテナ（推奨・現在の構成）✅

**特徴**:
- 各開発者のマシンで実行
- セキュリティが高い（データが外部に送信されない）
- ネットワーク遅延がない
- 設定が簡単

**用途**: 個人利用、小規模チーム

**設定**: 既に `.cursor/mcp.json` で設定済み

---

#### 2. Dockerイメージの共有（チーム内共有）

**特徴**:
- コンテナレジストリ（Docker Hub、GitHub Container Registry、社内レジストリ）にイメージを公開
- チームメンバーが同じイメージを使用可能
- バージョン管理が容易

**手順**:

```bash
# 1. Dockerイメージをビルド
docker compose build confluence-md

# 2. イメージにタグを付ける
docker tag niro-mcp-servers-confluence-md:latest \
  your-registry/niro-mcp-confluence-md:v1.0.0

# 3. レジストリにプッシュ
docker push your-registry/niro-mcp-confluence-md:v1.0.0
```

**`.cursor/mcp.json` の設定例**:
```json
{
  "mcpServers": {
    "confluence-md": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "your-registry/niro-mcp-confluence-md:v1.0.0"
      ]
    }
  }
}
```

**用途**: チーム内で統一されたバージョンを使用したい場合

---

#### 3. リモートサーバーへのデプロイ（HTTPモード）

**特徴**:
- クラウド（AWS、GCP、Azure）や社内サーバーにデプロイ
- HTTP経由でリモートからアクセス可能
- 複数のクライアントから共有利用可能

**注意点**:
- CursorはHTTPモードのMCPサーバーを直接サポートしていない可能性があります
- Claude Desktopや他のMCPクライアントでHTTPモードを使用する場合に有効
- セキュリティ設定（認証、HTTPS）が必要

**手順**:

1. **Docker Compose設定（HTTPモード）**:
```yaml
# docker-compose.prod.yml
services:
  confluence-md:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "50301:50301"
    environment:
      - TRANSPORT_MODE=http
      - PORT=50301
      - HOST=0.0.0.0
    # セキュリティ設定を追加
    # - 認証トークン
    # - HTTPS/TLS
    # - レート制限
```

2. **デプロイ先の例**:
   - **AWS ECS/Fargate**: コンテナオーケストレーション
   - **AWS EC2**: シンプルなVMデプロイ
   - **Google Cloud Run**: サーバーレスコンテナ
   - **Azure Container Instances**: マネージドコンテナ
   - **社内Kubernetes**: オンプレミス/ハイブリッド

3. **HTTPモードでの接続**（Claude Desktopの場合）:
```json
{
  "mcpServers": {
    "confluence-md": {
      "url": "https://your-server.com:50301/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
    }
  }
}
```

**用途**: 
- 複数のクライアントから共有利用したい場合
- 中央集約的な管理が必要な場合
- 開発環境と本番環境を分離したい場合

---

#### 4. Kubernetes/ECS などのコンテナオーケストレーション

**特徴**:
- スケーラブルな運用
- 自動復旧、ロードバランシング
- 複数インスタンスでの運用

**注意点**:
- MCPサーバーは通常ステートレスなので、スケーリングのメリットは限定的
- セッション管理が必要（HTTPモードの場合）

**用途**: 大規模運用、高可用性が必要な場合

---

### 推奨アプローチ

**現時点では、ローカルDockerコンテナ（選択肢1）を推奨します**:

✅ **理由**:
- MCPサーバーはCursor/Claude Desktopと同じマシンで実行するのが標準
- セキュリティが高い（データが外部に送信されない）
- 設定が簡単
- ネットワーク遅延がない
- 追加のインフラコストが不要

**デプロイが必要になるケース**:
- チーム全体で統一されたバージョンを使用したい → **選択肢2（Dockerイメージ共有）**
- リモートからアクセスする必要がある → **選択肢3（HTTPモード）**
- 大規模運用が必要 → **選択肢4（Kubernetes/ECS）**

---

### その他のフェーズ5タスク

1. **パフォーマンスチューニング**
   - 大容量HTMLの処理性能測定
   - メモリ使用量の最適化
   - 並列処理の検討

2. **ドキュメント整備**
   - ユーザーガイド作成
   - トラブルシューティングガイド
   - API ドキュメント

3. **本番環境での長期運用テスト**
   - 実際のConfluenceページでのテスト
   - エッジケースの収集
   - フィードバックの収集

---

## 📚 参考ドキュメント

### プロジェクト
- **全体計画**: `ROADMAP.md`
- **プロジェクト概要**: `README.md`
- **パッケージ詳細**: `packages/confluence-md/README.md`

### Cursor MCP 統合
- **Cursor MCP ドキュメント**: https://docs.cursor.com/context/model-context-protocol
- **Cursor Settings**: Cursor Settings > Features > MCP
- **MCP 公式ドキュメント**: https://modelcontextprotocol.io/

### 参考記事
- [Use Model Context Protocol (MCP) in Cursor IDE](https://steveshao.com/posts/2025/note-use-mcp-for-cursor/)
- [How to Add a New MCP Server to Cursor | Snyk](https://snyk.io/articles/how-to-add-a-new-mcp-server-to-cursor/)

---

## 🔧 設定例: .cursor/mcp.json

プロジェクトルートに作成してください：

```json
{
  "mcpServers": {
    "confluence-md": {
      "command": "docker",
      "cwd": "${workspaceFolder}",
      "args": [
        "compose",
        "-f",
        "docker-compose.yml",
        "run",
        "--rm",
        "confluence-md"
      ]
    }
  }
}
```

**汎用性の高い設定**:
- `${workspaceFolder}`変数を使用することで、プロジェクトの絶対パスに依存しません
- `cwd`オプションで作業ディレクトリを指定し、相対パスで`docker-compose.yml`を指定しています
- この設定は、プロジェクトを別の場所に移動してもそのまま動作します

---

## 💬 新しいセッションでの指示例

このファイルを読んで作業を再開する場合：

```
ROADMAP.md と NEXT_STEPS.md を読んで、フェーズ4のCursor統合を進めてください。
```

または

```
NEXT_STEPS.md の手順に従って、Cursor MCP設定ファイルを作成してください。
```

---

## ✅ Cursorでやること（社用PCに切り替えて実施）

### 前提
- `.cursor/mcp.json` ファイルは既に作成済み（コミット: `30828e4`）
- ✅ パスは `${workspaceFolder}` 変数を使用した汎用的な設定に更新済み
- ✅ プロジェクトの絶対パスに依存しない設定になっています

### 手順

1. **設定ファイルの確認（既に完了）**
   - `.cursor/mcp.json` は `${workspaceFolder}` 変数を使用した汎用的な設定になっています
   - プロジェクトを別の場所に移動してもそのまま動作します

2. **Cursor を再起動**
   - 設定を反映させるため、Cursorを完全に終了して再起動

3. **MCP サーバー接続を確認**
   - Cursor Settings > Features > MCP に移動
   - `confluence-md` サーバーが表示され、ステータスが「Connected」になっているか確認
   - Composer（Cmd+I）で Available Tools に `convert_confluence_to_markdown` が表示されるか確認

4. **実際のHTML変換をテスト**
   - 上記の「5. Composer Agent で実際のHTML変換をテスト」の手順に従ってテスト実行
   - トークン削減率（約50%）が達成されているか確認

5. **結果を記録**
   - 成功した場合: NEXT_STEPS.md と ROADMAP.md を更新してフェーズ4完了としてマーク
   - 問題が発生した場合: 「📋 問題が発生した場合」のセクションを参照して対応
