# Claude Code – Safe Hooks / Permissions（DevContainer 運用）

このリポジトリでは、Claude Code を
`--dangerously-skip-permissions` 付きで利用する前提のもと、
**PreToolUse Hook によって Bash コマンドの一部を強制的に拒否**する構成を採用しています。

目的は、利便性を落とさずに「うっかり事故」や「致命的な破壊操作」だけを防ぐことです。

---

## 前提と方針

- Claude Code は **DevContainer 内でのみ使用**します
- CI では Claude Code を使用しません
- `--dangerously-skip-permissions` を使用します
- 権限制御は Claude 本体ではなく **Hook（deny-check.sh）で行います**
- 誤検知を極力避けるため、deny は「明確に危険な操作」のみに限定します

---

## 仕組みの概要

1. Claude Code が Bash ツールを実行しようとする
2. PreToolUse Hook が起動
3. `.claude/scripts/deny-check.sh` が実行される
4. `.claude/settings.json` の `permissions.deny` を元に判定
5. 危険なコマンドの場合は **実行前に拒否**される

---

## 設定ファイルの役割

### `.claude/settings.json`（repo管理・コミット対象）

- deny ルールと Hook 設定を定義します
- DevContainer では **必ず repo のこのファイルを使用**します
- `permissions.allow` は `"*"`（すべて許可）とし、
  実際の制御は deny-check.sh に委ねます

### `.claude/scripts/deny-check.sh`

- Bash 実行前に deny 判定を行うスクリプト
- 以下の性質を持ちます：
  - **fail-closed**（設定が読めない・コマンドが取得できない場合は拒否）
  - repo の settings.json を優先して使用
  - glob パターンによるシンプルなマッチング（誤検知を抑制）

---

## DevContainer 固有の設定

### 設定ファイルの固定
DevContainer では、以下の環境変数を設定しています：
```
CLAUDE_SETTINGS_PATH=/workspaces/.claude/settings.json
```

これにより、deny-check.sh は必ず repo の設定ファイルを参照します
（個人の `$HOME/.claude/settings.json` は使用されません）。

### 実行ユーザー
- DevContainer の `remoteUser` は `dev-user`
- Hook や Claude Code は **非 root** で実行されます

### SSH キーの扱い
- ホストの `.ssh` は **read-only** でマウントされています
- 秘密鍵や `authorized_keys` の破壊・上書きは物理的に不可能です

## DevContainer における `claude` コマンドの実行方法

DevContainer 内では、`claude` コマンドは **必ず**
`--dangerously-skip-permissions` 付きで実行されるように構成されています。

### 仕組み

- リポジトリ内に `claude` コマンドの **ラッパースクリプト**を配置しています
  - パス: `.devcontainer/bin/claude`
- DevContainer 起動時に、このディレクトリを `PATH` の先頭に追加しています
- その結果、DevContainer 内で `claude` を実行すると：
  1. ラッパースクリプトが呼び出される
  2. 実体の `claude` バイナリを検出する
  3. 常に `--dangerously-skip-permissions` を付与して実行される

### 利点

- フラグの付け忘れが起きない
- メンバーごとに実行方法がブレない
- alias ではなく PATH 制御のため、確実に強制される
- deny-check.sh（PreToolUse Hook）と組み合わせる前提で安全に運用できる

### 注意点

- DevContainer **外**（ホスト環境）ではこの挙動は保証されません
- Claude Code は **必ず DevContainer 内で実行**してください
- 権限制御は `.claude/scripts/deny-check.sh` が最終防衛ラインです

---

## 主な拒否対象（例）

### ファイル・システム破壊
- `rm -rf /`
- `rm -rf /*`
- `mkfs*`
- `dd if=*`

### 権限昇格
- `sudo *`
- `su *`

### 外部スクリプト実行
- `curl ... | bash`
- `wget ... | sh`
- `bash -c ...`
- `sh -c ...`
- `eval ...`

### Git（完全禁止）
- `git reset --hard ...`
- `git clean -fd...`
- `git clean -xdf...`
- `git checkout -f...`
- `git switch -f...`
- `git push --force ...`
- `git push --force-with-lease ...`

### 認証系ファイル
- `authorized_keys`
- `id_rsa`

※ deny の詳細は `.claude/settings.json` を参照してください

---

## 運用ルール

- Hook によって拒否されたコマンドは **実行しません**
- 拒否された場合：
  - Claude には **代替案の提示まで**を依頼します
  - 実行が必要な場合は **人間が判断して手動で行います**
- deny ルールの変更は `.claude/settings.json` を修正し、PR でレビューします

---

## 動作確認の目安

以下が期待どおりであれば、設定は正常です：

- `git status` → 実行可能
- `git reset --hard HEAD~1` → 拒否される
- `git push --force` → 拒否される
- `rm -rf /` → 拒否される

---

## この設計の立ち位置

- 完璧なサンドボックスではありません
- 悪意ある回避を完全に防ぐものではありません
- しかし、**日常開発における重大事故の確率を大きく下げる**ことを目的としています

「便利さを維持したまま、致命傷だけを防ぐ」
そのための現実的な落とし所です。
