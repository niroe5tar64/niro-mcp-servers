---
date: 2025-12-25
topic: confluence-content機能追加
participants:
  - user
  - facilitator
---

# Summary
- `packages/confluence-content` の次の機能追加として「スペースツリー取得」を優先することを決定
- 現状は `get_confluence_page_markdown` のみで、ページIDが分からないと検索できない課題があった
- ページ数が多いため、ツリー構造のみ（本文なし）を返す設計とし、必要なページは既存ツールで個別取得する方針

## Decision
- `get_space_tree` ツールを新規追加する
- 入力: `spaceKey`（必須）
- 出力: ページID・タイトル・親子関係の階層構造（本文なし）
- 別アプローチが必要な場合は別機能として追加し、組み合わせで対応

## Notes
- 他のLLMから提案された機能（検索、増分同期、添付ファイル等）は今回は見送り
- ユースケース: 「〇〇スペースの設計書を探して」のような指示にLLMが対応できるようにする

## Open / TODO
- [ ] `get_space_tree` の詳細設計（APIエンドポイント、レスポンス形式）
- [ ] 実装
- [ ] テスト作成
