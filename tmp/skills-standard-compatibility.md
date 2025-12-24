# Skills 標準互換性メモ

このメモは、Agent Skills 標準と Claude Code Skills、Codex Skills（本環境）を比較したものです。

## 参照元
- Agent Skills 仕様: https://agentskills.io/specification
- Claude Code Skills ドキュメント: https://code.claude.com/docs/en/skills
- Codex Skills（本環境の挙動と SKILL.md 構成）: ローカルの指示と `.codex/skills/*/SKILL.md` から確認

## 互換性表

| 観点 | Agent Skills（標準） | Claude Code Skills | Codex Skills（本環境） | 補足 |
| --- | --- | --- | --- | --- |
| 発火 | 必要時に発見・利用される想定（仕様は発火条件を規定しない） | モデル判断で自動発火（ドキュメント記載） | description による自動発火、明示指定で強制発火 | 体験は近いが、発火ルールは実装依存 |
| エントリ | `SKILL.md` 必須 | `SKILL.md` 必須 | `SKILL.md` を使用 | ここは一致 |
| 必須 frontmatter | `name`, `description` 必須、厳密な制約あり | `name`, `description` 必須 | `name`, `description` は存在、制約は未明文化 | Codex 側の制約は不明 |
| 任意 frontmatter | `license`, `compatibility`, `metadata`, `allowed-tools` | `allowed-tools` を明記、他は強調されず | 文書化されていない可能性 | 標準の方が項目が多い |
| ディレクトリ構成 | フォルダ + `SKILL.md`、任意で `scripts/` `references/` `assets/` | SKILL.md から補助ファイル参照 | `references/` `scripts/` `assets/` を利用可能 | 構成は概ね一致 |
| 配置場所 | 標準では未規定 | `~/.claude/skills/`（個人）と `.claude/skills/`（プロジェクト） | ローカル依存（本環境では `.codex/skills/`） | パスは製品ごとに異なる |
| 配布方法 | 仕様としては形式のみ定義 | git とプラグイン配布 | 未規定（ローカル検出） | 配布は未標準化 |
| 権限制御 | `allowed-tools`（実験的） | `allowed-tools` サポート | 未文書化 | 権限の統一は未成熟 |
| チーム共有 | 標準では未規定 | リポジトリ共有が想定 | リポジトリ配置次第 | 運用依存 |

## まとめ
- Claude Code Skills は Agent Skills 標準にかなり近い。
- Codex Skills（本環境）は概念的には近いが、パス・権限・制約などが実装依存。
- ユーザー体験（必要時に自動で使われる点）は似ているが、運用面はまだ差がある。

## 用語定義
- Agent Skills 標準: skills をフォルダ単位で定義する公開仕様（`SKILL.md` と任意の補助ディレクトリ）。
- Claude Code Skills: Claude Code の実装仕様に沿った skills。モデルが自動発火し、配置先が規定される。
- Codex Skills（本環境）: 本リポジトリにある SKILL.md 群と、description をトリガーとして自動発火する運用。
- Model-invoked: ユーザーの明示呼び出しなしで、モデルが自動的に skills を使う挙動。
- `allowed-tools`: skill 実行中に許可するツールを制限するメタデータ（標準では実験的、Claude Code ではサポート）。

## 差分の影響（運用上の注意）
- 配置ディレクトリが統一されていないため、チーム共有や同期の方法が製品依存になる。
- `allowed-tools` の扱いが統一されていないため、権限制御を共通化するには追加ルールが必要。
- `name` など frontmatter の厳格な制約は Codex 側で不明瞭なため、標準仕様に合わせて記述すると安全。
- 標準は「フォーマット」を定義するのみで発火条件は規定しない。UX を揃えるならトリガールールを明文化するのが有効。
