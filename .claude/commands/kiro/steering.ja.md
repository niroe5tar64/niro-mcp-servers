---
description: .kiro/steering/ を永続的なプロジェクト知識として管理する
allowed-tools: Read, Task, Glob
---

# Kiro ステアリング管理

## モード検出

**Subagent を呼び出す前に検出する**:

`.kiro/steering/` の状態を確認:
- **ブートストラップモード**: 空、またはコアファイル（product.md, tech.md, structure.md）が欠落
- **同期モード**: コアファイルがすべて存在

Glob を使って既存のステアリングファイルを確認する。

## サブエージェントの起動

steering-agent にステアリング管理を委譲する:

Task ツールで Subagent を呼び出し、読み取り対象のファイルパターンを渡す:

```
Task(
  subagent_type="steering-agent",
  description="Manage steering files",
  prompt="""
Mode: {bootstrap or sync based on detection}

File patterns to read:
- .kiro/steering/*.md (if sync mode)
- .kiro/settings/templates/steering/*.md
- .kiro/settings/rules/steering-principles.md

JIT Strategy: Fetch codebase files when needed, not upfront
"""
)
```

## 結果の表示

Subagent のサマリーを表示する:

### ブートストラップ:
- 生成されたステアリングファイル: product.md, tech.md, structure.md
- Source of Truth としてレビュー/承認

### 同期:
- 更新されたステアリングファイル
- コードドリフト警告
- カスタムステアリングの推奨

## 注意

- `.kiro/steering/*.md` はすべてプロジェクト記憶として読み込まれる
- テンプレートと原則は外部のカスタマイズ用
- カタログではなくパターンに集中する
- "ゴールデンルール": 既存パターンに従う新規コードであればステアリング更新は不要
- エージェント固有ツールのディレクトリ（例: `.cursor/`, `.gemini/`, `.claude/`）は記載しない
- `.kiro/settings/` の内容はステアリングに記載しない（メタデータでありプロジェクト知識ではない）
- `.kiro/specs/` と `.kiro/steering/` の軽い参照は許容。その他の `.kiro/` ディレクトリは避ける
