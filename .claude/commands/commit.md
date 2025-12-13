---
description: ステージされた変更から適切なコミットメッセージを生成
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*)
argument-hint: [追加メッセージ(オプション)]
---

# Git Commit Message Generator

## 現在の状態を確認

1. ステージされた変更を確認
2. 差分の内容を分析
3. 最近のコミット履歴からスタイルを把握

## タスク

以下の形式で適切なコミットメッセージを生成し、コミットを作成してください：

### コミットメッセージの形式

**1行目（サマリー）:**
- Conventional Commits形式: `<type>: <subject>`
- タイプ: feat, fix, refactor, docs, style, test, chore, perf
- 件名: 日本語で簡潔に（変更内容の要約）

**本文（必要に応じて）:**
- 変更の詳細を箇条書きで説明
- 「何を」「なぜ」変更したかを明確に

**フッター:**
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 実行手順

1. `git status`で現在の状態を確認
2. `git diff --cached`でステージされた変更の詳細を確認
3. `git log --oneline -5`で最近のコミットスタイルを確認
4. 変更内容を分析し、適切なコミットメッセージを作成
5. `git commit`でコミットを実行（HEREDOCを使用）
6. `git status`でコミット成功を確認

### 注意事項

- ステージされた変更がない場合は、その旨を報告
- コミットメッセージは日本語で記述
- 複数の異なる種類の変更がある場合は、最も重要な変更に焦点を当てる
- ユーザーが引数で追加メッセージを指定した場合は、それを考慮に入れる

ユーザーからの追加メッセージ: $ARGUMENTS
