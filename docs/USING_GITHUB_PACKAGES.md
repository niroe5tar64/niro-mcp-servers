# GitHub Packagesからのパッケージ利用ガイド

このガイドでは、`@niro-mcp/confluence-cleaner`を他のリポジトリから利用する方法を説明します。

## 前提条件

GitHub Personal Access Token (PAT) を作成する必要があります。

### PATの作成手順

1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" をクリック
3. 以下の権限を付与:
   - `read:packages` (必須)
   - `write:packages` (パッケージ公開する場合のみ)
4. トークンをコピーして安全に保管

## セットアップ手順

### 1. プロジェクトに`.npmrc`を作成

プロジェクトルートに`.npmrc`ファイルを作成します：

```ini
@niro-mcp:registry=https://npm.pkg.github.com
```

**重要:** `.npmrc`に認証トークンを直接書かないでください（Gitにコミットされる可能性があるため）。

### 2. 認証設定

#### 方法A: グローバル設定（推奨）

ホームディレクトリの`~/.npmrc`に認証情報を追加：

```bash
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc
```

#### 方法B: 環境変数

`.env`ファイル（`.gitignore`に追加済み）に設定：

```bash
NPM_TOKEN=YOUR_GITHUB_TOKEN
```

プロジェクトの`.npmrc`に以下を追加：

```ini
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

#### 方法C: bunfig.toml（Bunの場合）

`bunfig.toml`を作成：

```toml
[install.scopes]
"@niro-mcp" = { token = "YOUR_GITHUB_TOKEN", url = "https://npm.pkg.github.com" }
```

### 3. パッケージをインストール

```bash
bun add @niro-mcp/confluence-cleaner
# or
npm install @niro-mcp/confluence-cleaner
```

## 使用例

```typescript
import { cleanConfluenceHtml, calculateTokenReduction } from '@niro-mcp/confluence-cleaner';

const html = '<div class="expand-container">...</div>';
const markdown = cleanConfluenceHtml(html);

console.log(markdown);
```

## バージョン指定

特定のバージョンをインストール：

```bash
bun add @niro-mcp/confluence-cleaner@0.1.0
```

最新のマイナーバージョンを追跡：

```json
{
  "dependencies": {
    "@niro-mcp/confluence-cleaner": "^0.1.0"
  }
}
```

## トラブルシューティング

### 認証エラー

```
error: No matching package found for @niro-mcp/confluence-cleaner
```

**解決方法:**
1. GitHub PATの権限を確認（`read:packages`が必要）
2. `.npmrc`の設定を確認
3. トークンが有効期限切れでないか確認

### パッケージが見つからない

```
error: Package "@niro-mcp/confluence-cleaner" not found
```

**解決方法:**
1. パッケージが公開されているか確認: https://github.com/niroe5tar64/niro-mcp-servers/packages
2. `.npmrc`のレジストリ設定を確認
3. アクセス権限があるか確認（privateパッケージの場合）

## CI/CD環境での利用

GitHub Actionsで利用する場合：

```yaml
- name: Setup .npmrc
  run: |
    echo "@niro-mcp:registry=https://npm.pkg.github.com" > .npmrc
    echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" >> .npmrc

- name: Install dependencies
  run: bun install
```

`GITHUB_TOKEN`は自動的に提供されるため、追加設定は不要です。

## セキュリティのベストプラクティス

1. **トークンをGitにコミットしない**
   - `.npmrc`に直接トークンを書かない
   - 環境変数または`~/.npmrc`を使用

2. **最小権限の原則**
   - 必要な権限のみ付与（読み取りのみなら`read:packages`のみ）

3. **トークンの定期更新**
   - セキュリティのため、定期的にトークンを更新

4. **`.gitignore`の確認**
   - `.env`, `bunfig.toml`（トークン含む場合）がgitignoreされているか確認

## 参考リンク

- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [Working with npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
