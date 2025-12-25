---
date: 2025-12-25
topic: confluence-content Agent Skills化
participants:
  - user
  - facilitator
---

# Summary
- `confluence-content`のMCPツールをAgent Skillsとして実装する設計を決定
- ツールベースアプローチを採用（SKILL.mdでMCPツール呼び出しを指示）
- CursorのMCPサーバー接続は実証済みのため、シンプルな構成で十分
- 1スキル = 1ツールの粒度で開始

## Decision
- A) ツールベースアプローチを採用
- SKILL.mdファイルのみで実装（スクリプト不要）
- 既存MCPサーバーの構成は変更しない

## Notes
- Agent Skillsはオープン仕様（agentskills.io）
- Claude Code、Cursor、VS Code Copilot等で利用可能
- MCPとAgent Skillsは補完関係（MCP=データ接続、Skills=タスク実行）

## Open / TODO
- [ ] SKILL.md作成
- [ ] Claude Code動作確認
- [ ] Cursor動作確認
- [ ] 将来: ワークフロースキルの設計（get_space_tree実装後）
