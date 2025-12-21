---
name: claude-commands
description: CodexにClaude風のスラッシュコマンドUXを提供するため、"/<command> [args]" を /home/bun/.claude/commands のコマンド仕様（references/に同期）へ対応付ける。ユーザーが /commit のようなスラッシュコマンドの実行やClaude的なコマンド挙動を求めたときに使う。
---

# Claude Commands

## 概要

`/<command> ...` を `references/` 内のMarkdown仕様へルーティングして、Claude風のスラッシュコマンド体験を実現する。

## クイックスタート

1) スキル宣言 `$claude-commands` 直後にある `/<command>` を解析する（例: `$claude-commands /commit`）。
2) コマンド仕様を読み込む:
   - まず `references/<command>.md` を使う。
   - 無ければ `/home/bun/.claude/commands/<command>.md` を読み、必要なら `scripts/sync_claude_commands.sh` で `references/` に同期する。
   - それでも無ければ、未対応である旨を伝え、利用可能な `references/*.md` を列挙する。
3) 仕様は最優先の指示として従う:
   - YAMLフロントマターはメタデータとして扱い、手順には含めない。
   - 仕様で明示された手順のみ実行する。
   - 仕様が質問や停止を求める場合は、その指示に従う。
4) スラッシュコマンドUXを維持する:
   - 例: `Running /<command> ...` のような短い開始行を出す。
   - その後に処理を実行し、結果を報告する。

## 利用可能コマンドの列挙

- `references/*.md` を列挙し、拡張子なしの `/filename` として提示する。

## 同期

- `scripts/sync_claude_commands.sh` を実行して `/home/bun/.claude/commands` から `references/` を更新する。
