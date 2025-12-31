# 共有DevContainer移行計画

## 調査結果

### 現在の構成

**ファイル構成:**
- `.devcontainer/devcontainer.json` - DevContainer設定（docker-composeベース）
- `Dockerfile.dev` - カスタムDockerfile（Bun + Claude Code + Codex）
- `docker-compose.dev.yml` - 開発環境用Docker Compose
- `.devcontainer/bin/` - ラッパースクリプト（claude, codex）
- `.devcontainer/statusline-command.sh` - カスタムステータスライン

**技術スタック:**
- Bun（パッケージマネージャー＆ランタイム）
- TypeScript
- Biome（linter/formatter）
- MCP サーバー開発（モノレポ構成）

### 共有DevContainer構成

**特徴:**
- TypeScriptで型安全に設定管理
- base.ts + プリセット（node/fullstack/python/writing）+ project-config.ts
- `bun run build:client [preset]` でdevcontainer.jsonを自動生成
- post-create.shで環境セットアップ
- claude/codexラッパースクリプトを提供
- statusline-command.shを提供

**このプロジェクトに適した構成:**
- **bunプリセット** を使用
- 理由: Bun + Biomeを使用、将来的な拡張性を確保
- base.tsに既に以下が含まれている:
  - Node.js LTS（featuresでインストール）
  - Bun（post-create.shでインストール）
  - Biome、Bun拡張機能
  - Git、GitHub CLI
  - AI開発ツール（Claude Code、Copilot）
- bunプリセット: 現時点ではbase.tsを継承、将来的にBun固有の設定を追加可能

---

## 移行方針

### アプローチ

1. **Dockerfileベース方式に変更**
   - 現在: docker-composeベース（`dockerComposeFile` + `service`）
   - 移行後: Featuresベース（`image` + `features`）
   - 理由: 共有DevContainerのベースイメージとフィーチャーを活用しつつ、シンプルな構成にする

2. **共有設定の活用**
   - 共通設定: base.ts（AI ツール、Git、基本エディタ設定、Bun、Biome）
   - プリセット: bun.ts（Bun開発用、現時点ではbase.tsを継承、将来的な拡張性確保）
   - プロジェクト固有: project-config.ts（ポート、環境変数、initializeCommand）

3. **段階的な移行**
   - Phase 1: project-config.ts作成
   - Phase 2: devcontainer.json生成
   - Phase 3: 不要ファイル削除
   - Phase 4: テスト＆確認

---

## 実行計画

### Phase 1: プロジェクト固有設定の作成

**ファイル: `.devcontainer/project-config.ts`**

```typescript
import type { DevContainerConfig } from './shared/src/types';

export const projectConfig: DevContainerConfig = {
  name: 'Niro MCP Servers Dev Environment',

  // プロジェクト固有のポートフォワード
  forwardPorts: [50301],

  // プロジェクト固有の拡張機能
  // 注: base.tsに既に以下が含まれている
  // - oven.bun-vscode
  // - biomejs.biome
  // - mhutchie.git-graph
  // - bierner.markdown-mermaid
  // - anthropic.claude-code
  // - GitHub.copilot
  customizations: {
    vscode: {
      extensions: [
        // プロジェクト固有の拡張機能があればここに追加
      ],
      settings: {
        // Biomeの設定はbase.tsで既に設定済み
        // プロジェクト固有の設定があればここに追加
      },
    },
  },

  // プロジェクト固有の環境変数
  // 注: CLAUDE_SETTINGS_PATH はbase.tsで既に設定済み
  containerEnv: {
    // プロジェクト固有の環境変数があればここに追加
  },

  // initializeCommand（.envテンプレートのコピー）
  initializeCommand: 'test -f packages/confluence-content/.env || cp packages/confluence-content/.env.template packages/confluence-content/.env',

  // postCreateCommand（bun installを追加）
  // 注: post-create.shが既に実行されているため、その後にbun installを実行
  postCreateCommand: 'bash .devcontainer/post-create.sh && bun install',

  // Claude データ永続化（volumeマウント）
  // 注: base.tsで既に .claude, .codex はbindマウント設定済み
  // ここでvolumeマウントを追加すると上書きされる可能性があるため、
  // base.tsの設定をそのまま使用する場合はコメントアウト
  // mounts: [
  //   'source=niro-mcp-claude-data,target=/home/dev-user/.claude,type=volume',
  // ],
};

export default projectConfig;
```

**実行:**
```bash
# ファイル作成
# （上記内容で .devcontainer/project-config.ts を作成）
```

**注意:**
- base.tsで既に `.claude` と `.codex` はホストマシンとbindマウントされています
- volumeマウントに変更したい場合は、project-config.tsで `mounts` を明示的に指定してください
- ただし、共有DevContainerの推奨設定（bindマウント）を使用することを推奨します

---

### Phase 2: DevContainer設定の生成

**実行:**
```bash
# 共有DevContainerディレクトリに移動
cd .devcontainer/shared

# 依存関係インストール（初回のみ）
bun install

# Client DevContainer を生成（bunプリセット）
bun run build:client bun

# プロジェクトルートに戻る
cd ../..
```

**生成されるファイル:**
- `.devcontainer/devcontainer.json` - 完全な設定ファイル（上書き）
- `.devcontainer/bin/` - ラッパースクリプト（上書き）
- `.devcontainer/post-create.sh` - セットアップスクリプト（新規）
- `.devcontainer/statusline-command.sh` - ステータスライン（上書き）

**devcontainer.jsonの主な変更点:**
- `dockerComposeFile` + `service` → `image` + `features` に変更
- base.ts + bun.ts + project-config.ts がマージされた設定
- `postCreateCommand` が `bash .devcontainer/post-create.sh && bun install` を実行

---

### Phase 3: 不要ファイルの削除

**削除対象:**

1. **Dockerfile.dev** - 共有DevContainerのbase + featuresで置き換え
2. **docker-compose.dev.yml** - Featuresベース方式に変更

**実行:**
```bash
# 削除前にバックアップ
mkdir -p .backup/devcontainer
cp Dockerfile.dev .backup/devcontainer/
cp docker-compose.dev.yml .backup/devcontainer/
cp .devcontainer/devcontainer.json .backup/devcontainer/devcontainer.json.old

# 削除
rm Dockerfile.dev
rm docker-compose.dev.yml
```

**保持するファイル:**
- `Dockerfile` (本番用) - MCP サーバーのコンテナイメージビルドに必要
- `docker-compose.yml` (本番用) - MCP サーバーの実行に必要
- `.devcontainer/bin/` - 共有DevContainerが生成したもので上書き
- `.devcontainer/post-create.sh` - 共有DevContainerが生成（新規）
- `.devcontainer/statusline-command.sh` - 共有DevContainerが生成したもので上書き

---

### Phase 4: テスト＆確認

**手順:**

1. **DevContainerの再ビルド**
   ```bash
   # VS Code: Cmd+Shift+P → "Dev Containers: Rebuild Container"
   ```

2. **動作確認**
   - [ ] DevContainerが正常に起動する
   - [ ] `claude` コマンドが動作する（ラッパー経由）
   - [ ] `codex` コマンドが動作する（ラッパー経由）
   - [ ] `bun install` が正常に動作する
   - [ ] statusline が正常に表示される
   - [ ] Git操作が正常に動作する（.gitconfig/.sshマウント）
   - [ ] ポート50301がフォワードされる
   - [ ] Biome（linter/formatter）が動作する
   - [ ] VS Code拡張機能がインストールされる

3. **設定の確認**
   ```bash
   # PATH確認
   echo $PATH
   # ~/.local/bin が最優先になっているか

   # Claude/Codex確認
   which claude
   which codex

   # ラッパースクリプト確認
   cat ~/.local/bin/claude
   cat ~/.local/bin/codex
   ```

4. **プラグイン確認**
   ```bash
   # Claude Code設定
   cat ~/.claude/settings.json
   # または
   cat /workspaces/niro-mcp-servers/.claude/settings.json
   ```

---

## 移行後の構成

### ファイル構成（変更後）

```
.devcontainer/
├── shared/                      # Git submodule
│   ├── src/
│   │   ├── base.ts             # 共通設定
│   │   ├── presets/
│   │   │   └── bun.ts          # Bunプリセット
│   │   └── types.ts
│   ├── scripts/
│   │   └── build/build.ts      # ビルドスクリプト
│   └── .devcontainer/
│       ├── bin/                # ラッパースクリプト（ソース）
│       ├── post-create.sh      # セットアップスクリプト（ソース）
│       └── statusline-command.sh  # ステータスライン（ソース）
├── devcontainer.json           # 自動生成（編集禁止）
├── project-config.ts           # プロジェクト固有設定（編集可）
├── bin/                        # 自動生成（claude, codexラッパー）
├── post-create.sh              # 自動生成（セットアップスクリプト）
└── statusline-command.sh       # 自動生成（共有DevContainerからコピー）
```

### 設定のマージ順序

```
base.ts (共通設定: AI ツール、Git、Bun、Biome、基本エディタ設定)
  ↓ マージ
bun.ts (Bunプリセット: 現時点ではbase.tsを継承、将来的な拡張性確保)
  ↓ マージ
project-config.ts (プロジェクト固有: ポート、環境変数、initializeCommand)
  ↓ 生成
devcontainer.json (最終設定)
```

### 設定の変更方法

**共通設定の変更:**
```bash
# サブモジュールを最新化
cd .devcontainer/shared
git pull origin main

# devcontainer.json を再生成
bun run build:client bun
cd ../..

# DevContainer を再ビルド
# VS Code: Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

**プロジェクト固有設定の変更:**
```bash
# .devcontainer/project-config.ts を編集

# devcontainer.json を再生成
cd .devcontainer/shared
bun run build:client bun
cd ../..

# DevContainer を再ビルド
```

---

## 利点

1. **型安全な設定管理**: TypeScriptで設定ミスを防止
2. **DRY原則**: 共通設定を再利用、重複排除
3. **保守性向上**: ビルドスクリプトで自動生成、手動編集不要
4. **チーム統一**: 他プロジェクトとも同じベース設定を共有
5. **アップデート容易**: サブモジュールの更新で最新設定を取得
6. **将来的な拡張性**: Bunプリセットで将来的にBun固有の設定を追加可能
7. **再利用性**: 他のBunプロジェクトでもBunプリセットを使用可能

---

## 注意事項

1. **Dockerfileについて**
   - `Dockerfile` (本番用) は削除しない
   - MCP サーバーのコンテナイメージビルドに必要
   - DevContainerとは独立して管理

2. **docker-compose.ymlについて**
   - `docker-compose.yml` (本番用) は削除しない
   - MCP サーバーの実行に必要
   - DevContainerとは独立して管理

3. **生成ファイルの編集禁止**
   - `.devcontainer/devcontainer.json` は編集しない
   - 変更は `project-config.ts` で行う

4. **statusline-command.shについて**
   - 共有DevContainer版を使用
   - プロジェクト固有のカスタマイズが必要な場合は、共有DevContainerに反映するか、project-config.tsで対応

5. **Claude/Codex認証情報の永続化**
   - base.tsではホストマシンとbindマウント（`~/.claude`, `~/.codex`）
   - 複数プロジェクト間で認証情報を共有できる
   - volumeマウントに変更したい場合は、project-config.tsで明示的に指定

---

## ロールバック手順（問題発生時）

```bash
# バックアップから復元
cp .backup/devcontainer/Dockerfile.dev ./
cp .backup/devcontainer/docker-compose.dev.yml ./

# 元のdevcontainer.jsonを復元
cp .backup/devcontainer/devcontainer.json.old .devcontainer/devcontainer.json

# DevContainer 再ビルド
# VS Code: Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

---

以上が移行計画です。
