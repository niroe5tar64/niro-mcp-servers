# cc-sdd ファイル移動リスト

## cc-sddリポジトリ検証結果

- **リポジトリ**: [gotalab/cc-sdd](https://github.com/gotalab/cc-sdd)
- **検証日**: 2026-01-01
- **標準ファイル数**: 37個（英語版のみ、日本語版は含まれない）
- **日本語訳版**: 36個（プロジェクト独自の翻訳）
- **Codex版プロンプト**: 11個（Codex CLI用に追加）

---

## 移動対象ファイル一覧

### 1. Claude Code コマンドファイル（24個）

**パス**: `.claude/commands/kiro/`

#### cc-sdd 標準ファイル（12個）
```
.claude/commands/kiro/spec-design.md
.claude/commands/kiro/spec-impl.md
.claude/commands/kiro/spec-init.md
.claude/commands/kiro/spec-quick.md
.claude/commands/kiro/spec-requirements.md
.claude/commands/kiro/spec-status.md
.claude/commands/kiro/spec-tasks.md
.claude/commands/kiro/steering.md
.claude/commands/kiro/steering-custom.md
.claude/commands/kiro/validate-design.md
.claude/commands/kiro/validate-gap.md
.claude/commands/kiro/validate-impl.md
```

#### 日本語訳版（12個）
```
.claude/commands/kiro/spec-design.ja.md
.claude/commands/kiro/spec-impl.ja.md
.claude/commands/kiro/spec-init.ja.md
.claude/commands/kiro/spec-quick.ja.md
.claude/commands/kiro/spec-requirements.ja.md
.claude/commands/kiro/spec-status.ja.md
.claude/commands/kiro/spec-tasks.ja.md
.claude/commands/kiro/steering.ja.md
.claude/commands/kiro/steering-custom.ja.md
.claude/commands/kiro/validate-design.ja.md
.claude/commands/kiro/validate-gap.ja.md
.claude/commands/kiro/validate-impl.ja.md
```

### 2. Codex プロンプトファイル（11個）

**パス**: `.codex/prompts/`

```
.codex/prompts/kiro-spec-design.md
.codex/prompts/kiro-spec-impl.md
.codex/prompts/kiro-spec-init.md
.codex/prompts/kiro-spec-requirements.md
.codex/prompts/kiro-spec-status.md
.codex/prompts/kiro-spec-tasks.md
.codex/prompts/kiro-steering.md
.codex/prompts/kiro-steering-custom.md
.codex/prompts/kiro-validate-design.md
.codex/prompts/kiro-validate-gap.md
.codex/prompts/kiro-validate-impl.md
```

### 3. ルールファイル（18個）

**パス**: `.kiro/settings/rules/`

#### cc-sdd 標準ファイル（9個）
```
.kiro/settings/rules/design-discovery-full.md
.kiro/settings/rules/design-discovery-light.md
.kiro/settings/rules/design-principles.md
.kiro/settings/rules/design-review.md
.kiro/settings/rules/ears-format.md
.kiro/settings/rules/gap-analysis.md
.kiro/settings/rules/steering-principles.md
.kiro/settings/rules/tasks-generation.md
.kiro/settings/rules/tasks-parallel-analysis.md
```

#### 日本語訳版（9個）
```
.kiro/settings/rules/design-discovery-full.ja.md
.kiro/settings/rules/design-discovery-light.ja.md
.kiro/settings/rules/design-principles.ja.md
.kiro/settings/rules/design-review.ja.md
.kiro/settings/rules/ears-format.ja.md
.kiro/settings/rules/gap-analysis.ja.md
.kiro/settings/rules/steering-principles.ja.md
.kiro/settings/rules/tasks-generation.ja.md
.kiro/settings/rules/tasks-parallel-analysis.ja.md
```

### 4. Spec テンプレートファイル（11個）

**パス**: `.kiro/settings/templates/specs/`

#### cc-sdd 標準ファイル（6個）
```
.kiro/settings/templates/specs/design.md
.kiro/settings/templates/specs/init.json
.kiro/settings/templates/specs/requirements.md
.kiro/settings/templates/specs/requirements-init.md
.kiro/settings/templates/specs/research.md
.kiro/settings/templates/specs/tasks.md
```

#### 日本語訳版（5個）
```
.kiro/settings/templates/specs/design.ja.md
.kiro/settings/templates/specs/requirements.ja.md
.kiro/settings/templates/specs/requirements-init.ja.md
.kiro/settings/templates/specs/research.ja.md
.kiro/settings/templates/specs/tasks.ja.md
```

### 5. Steering テンプレートファイル（6個）

**パス**: `.kiro/settings/templates/steering/`

#### cc-sdd 標準ファイル（3個）
```
.kiro/settings/templates/steering/product.md
.kiro/settings/templates/steering/structure.md
.kiro/settings/templates/steering/tech.md
```

#### 日本語訳版（3個）
```
.kiro/settings/templates/steering/product.ja.md
.kiro/settings/templates/steering/structure.ja.md
.kiro/settings/templates/steering/tech.ja.md
```

### 6. Steering Custom テンプレートファイル（14個）

**パス**: `.kiro/settings/templates/steering-custom/`

#### cc-sdd 標準ファイル（7個）
```
.kiro/settings/templates/steering-custom/api-standards.md
.kiro/settings/templates/steering-custom/authentication.md
.kiro/settings/templates/steering-custom/database.md
.kiro/settings/templates/steering-custom/deployment.md
.kiro/settings/templates/steering-custom/error-handling.md
.kiro/settings/templates/steering-custom/security.md
.kiro/settings/templates/steering-custom/testing.md
```

#### 日本語訳版（7個）
```
.kiro/settings/templates/steering-custom/api-standards.ja.md
.kiro/settings/templates/steering-custom/authentication.ja.md
.kiro/settings/templates/steering-custom/database.ja.md
.kiro/settings/templates/steering-custom/deployment.ja.md
.kiro/settings/templates/steering-custom/error-handling.ja.md
.kiro/settings/templates/steering-custom/security.ja.md
.kiro/settings/templates/steering-custom/testing.ja.md
```

---

## コピー用リスト（全84ファイル）

### 全ファイルパス
```
.claude/commands/kiro/spec-design.md
.claude/commands/kiro/spec-design.ja.md
.claude/commands/kiro/spec-impl.md
.claude/commands/kiro/spec-impl.ja.md
.claude/commands/kiro/spec-init.md
.claude/commands/kiro/spec-init.ja.md
.claude/commands/kiro/spec-quick.md
.claude/commands/kiro/spec-quick.ja.md
.claude/commands/kiro/spec-requirements.md
.claude/commands/kiro/spec-requirements.ja.md
.claude/commands/kiro/spec-status.md
.claude/commands/kiro/spec-status.ja.md
.claude/commands/kiro/spec-tasks.md
.claude/commands/kiro/spec-tasks.ja.md
.claude/commands/kiro/steering.md
.claude/commands/kiro/steering.ja.md
.claude/commands/kiro/steering-custom.md
.claude/commands/kiro/steering-custom.ja.md
.claude/commands/kiro/validate-design.md
.claude/commands/kiro/validate-design.ja.md
.claude/commands/kiro/validate-gap.md
.claude/commands/kiro/validate-gap.ja.md
.claude/commands/kiro/validate-impl.md
.claude/commands/kiro/validate-impl.ja.md
.codex/prompts/kiro-spec-design.md
.codex/prompts/kiro-spec-impl.md
.codex/prompts/kiro-spec-init.md
.codex/prompts/kiro-spec-requirements.md
.codex/prompts/kiro-spec-status.md
.codex/prompts/kiro-spec-tasks.md
.codex/prompts/kiro-steering.md
.codex/prompts/kiro-steering-custom.md
.codex/prompts/kiro-validate-design.md
.codex/prompts/kiro-validate-gap.md
.codex/prompts/kiro-validate-impl.md
.kiro/settings/rules/design-discovery-full.md
.kiro/settings/rules/design-discovery-full.ja.md
.kiro/settings/rules/design-discovery-light.md
.kiro/settings/rules/design-discovery-light.ja.md
.kiro/settings/rules/design-principles.md
.kiro/settings/rules/design-principles.ja.md
.kiro/settings/rules/design-review.md
.kiro/settings/rules/design-review.ja.md
.kiro/settings/rules/ears-format.md
.kiro/settings/rules/ears-format.ja.md
.kiro/settings/rules/gap-analysis.md
.kiro/settings/rules/gap-analysis.ja.md
.kiro/settings/rules/steering-principles.md
.kiro/settings/rules/steering-principles.ja.md
.kiro/settings/rules/tasks-generation.md
.kiro/settings/rules/tasks-generation.ja.md
.kiro/settings/rules/tasks-parallel-analysis.md
.kiro/settings/rules/tasks-parallel-analysis.ja.md
.kiro/settings/templates/specs/design.md
.kiro/settings/templates/specs/design.ja.md
.kiro/settings/templates/specs/init.json
.kiro/settings/templates/specs/requirements.md
.kiro/settings/templates/specs/requirements.ja.md
.kiro/settings/templates/specs/requirements-init.md
.kiro/settings/templates/specs/requirements-init.ja.md
.kiro/settings/templates/specs/research.md
.kiro/settings/templates/specs/research.ja.md
.kiro/settings/templates/specs/tasks.md
.kiro/settings/templates/specs/tasks.ja.md
.kiro/settings/templates/steering/product.md
.kiro/settings/templates/steering/product.ja.md
.kiro/settings/templates/steering/structure.md
.kiro/settings/templates/steering/structure.ja.md
.kiro/settings/templates/steering/tech.md
.kiro/settings/templates/steering/tech.ja.md
.kiro/settings/templates/steering-custom/api-standards.md
.kiro/settings/templates/steering-custom/api-standards.ja.md
.kiro/settings/templates/steering-custom/authentication.md
.kiro/settings/templates/steering-custom/authentication.ja.md
.kiro/settings/templates/steering-custom/database.md
.kiro/settings/templates/steering-custom/database.ja.md
.kiro/settings/templates/steering-custom/deployment.md
.kiro/settings/templates/steering-custom/deployment.ja.md
.kiro/settings/templates/steering-custom/error-handling.md
.kiro/settings/templates/steering-custom/error-handling.ja.md
.kiro/settings/templates/steering-custom/security.md
.kiro/settings/templates/steering-custom/security.ja.md
.kiro/settings/templates/steering-custom/testing.md
.kiro/settings/templates/steering-custom/testing.ja.md
```

---

## 移動作業のヒント

### Git を使用した移動コマンド例

```bash
# 新しいリポジトリにファイルを追加する場合
cd /path/to/plugin-repo

# ディレクトリ構造を作成
mkdir -p .claude/commands/kiro
mkdir -p .kiro/settings/rules
mkdir -p .kiro/settings/templates/specs
mkdir -p .kiro/settings/templates/steering
mkdir -p .kiro/settings/templates/steering-custom

# ファイルをコピー
rsync -av /workspaces/niro-mcp-servers/.claude/commands/kiro/ .claude/commands/kiro/
rsync -av /workspaces/niro-mcp-servers/.kiro/settings/ .kiro/settings/

# Git に追加
git add .claude/commands/kiro .kiro/settings
git commit -m "Add cc-sdd configuration files from niro-mcp-servers"

# 元のリポジトリから削除（確認後）
cd /workspaces/niro-mcp-servers
git rm -r .claude/commands/kiro .kiro/settings
git commit -m "Move cc-sdd files to plugin repository"
```

### 推奨される移動先のディレクトリ構造

```
plugin-repo/
├── .claude/
│   └── commands/
│       └── kiro/           # 24 ファイル
├── .codex/
│   └── prompts/            # 11 ファイル
├── .kiro/
│   └── settings/
│       ├── rules/          # 18 ファイル
│       └── templates/
│           ├── specs/      # 11 ファイル
│           ├── steering/   # 6 ファイル
│           └── steering-custom/  # 14 ファイル
└── README.md
```

---

## 参考情報

### cc-sdd について

cc-sddは、Claude Code、Cursor、Gemini CLI、Codex CLI、GitHub Copilot、Qwen Code、Windsurfなどの
AIコーディングアシスタント向けのSpec-Driven Development (SDD) ワークフローを提供するツールです。

**本プロジェクトの実装状況**:
- Claude Code版コマンドファイル（24ファイル）✓ 実装済み
- Codex CLI版プロンプトファイル（11ファイル）✓ 2026-01-05 追加
- ルール、テンプレートファイル（49ファイル）✓ 実装済み

**ワークフロー機能**:
- 要件（Requirements）→ 設計（Design）→ タスク（Tasks）→ 実装（Implementation）の構造化されたワークフローを実現
- ステアリング（Steering）機能でプロジェクト全体のコンテキストを管理
- 検証（Validation）機能で品質を担保

### 関連リンク

- [gotalab/cc-sdd - GitHub](https://github.com/gotalab/cc-sdd)
- [cc-sdd 日本語ドキュメント](https://github.com/gotalab/cc-sdd/blob/main/tools/cc-sdd/README_ja.md)
- [Spec-Driven Development Guide](https://github.com/gotalab/cc-sdd/blob/main/docs/guides/ja/spec-driven.md)
