# 明示化ファーストの議論メモ

## 目的

cc-sddとMFRの共通原理を整理し、後から議論の背景・論点・根拠を素早く辿れる形にまとめる。

## 中心仮説

暗黙知を先に明示化してから推論・実行に移ることで、LLMと開発プロセスの信頼性が上がる。

## 背景

- cc-sdd: 仕様を明示化してから実装へ進む仕様駆動開発の枠組み。
- MFR: 問題モデルを明示化してから推論に入るLLMエージェントの手法。

## 論文要約

対象: "Model-First Reasoning LLM Agents: Reducing Hallucinations through Explicit Problem Modeling" (arXiv:2512.14474v1, 2025)

- 主張: LLMエージェントの失敗は推論能力不足ではなく、問題表現が暗黙で不安定なことに起因する。
- 提案: Model-First Reasoning (MFR)として、推論前に「エンティティ/状態変数/行動(前提・効果)/制約」を明示的にモデル化する2段階手順を導入。
- 実験: 制約の厳しい計画問題(スケジューリング、経路計画、資源配分、論理パズル等)でCoT/ReActと比較。
- 結果: MFRは制約違反と暗黙の仮定を減らし、長期整合性と構造の明瞭性を改善。
- 限界: モデル構築のトークンコスト増と、モデル構築の正確さに性能が依存。

## cc-sddとMFRの関係性

- cc-sdd: 開発プロセス全体で「仕様という外部表現」を先に作る。
- MFR: 推論プロセス内で「問題モデルという外部表現」を先に作る。
- 共通点: 先に明示化し、後から推論/実行する。
- 期待効果: 制約違反や抜け漏れの削減、長期的整合性の向上、レビュー容易性の改善。

## cc-sddフェーズとMFRの対応

| cc-sddフェーズ | 目的 | MFR対応 | 対応の理由 |
|---|---|---|---|
| 要求（spec-requirements） | 何を満たすべきかを明文化 | モデル構築 | 制約・目的・前提を明示して問題空間を定義する |
| 設計（spec-design） | どう構成し、どう動くかを明文化 | モデル構築 | エンティティ/状態/行動/制約の構造を確定する |
| タスク（spec-tasks） | 実行手順と分解 | 推論 | モデルに基づく具体的な行動計画の生成 |
| 実装（spec-impl） | 実装と検証 | 推論 | 計画に従って行動し、モデルと整合するか確認 |

## テンプレート反映案（MFRをcc-sddに組み込む）

目的: 仕様生成の段階で「問題モデルの明示」を強制し、後続フェーズの推論/実装の一貫性を高める。

### 1) requirements.ja.mdへの追加案

新規セクション: 「問題モデル（MFR）」を要件冒頭に追加。

含める項目:
- エンティティ（登場人物/対象/外部システム）
- 状態変数（変化する属性）
- 行動（前提/効果）
- 制約（常に満たす条件）

狙い: 要件の段階で暗黙の前提を可視化し、受け入れ基準の抜けを減らす。

### 2) design.ja.mdへの追加案

既存「データモデル」または「アーキテクチャ」の直前に「問題モデル詳細」セクションを追加。

内容:
- requirementsで定義したモデルの確定版
- 制約がアーキテクチャ/データモデルにどう反映されるかの対応付け
- 状態遷移や不変条件の図示（必要時）

狙い: 設計でモデルの一貫性を固定し、後工程の解釈ぶれを防ぐ。

### 3) tasks.ja.mdへの追加案

タスクテンプレートに「モデル参照」欄を追加。

例:
- _モデル参照: Entities=..., Constraints=..._

狙い: 実装タスクがモデルから逸脱しないことを明示的にチェックできるようにする。

### 4) 運用ルール案

- 仕様レビュー時に「問題モデルの明示性」チェック項目を追加。
- モデルの差分が出たら要件と設計の両方を更新する（モデルが単一の真実）。

## 議論の次の問い

- cc-sddの各成果物に「モデルの明示性」を評価する指標を付けられるか。
- MFRのモデル構築フェーズをcc-sddの成果物に直接投影できるか。
- モデル明示化のコスト(時間/トークン/レビュー負荷)と効果の最適点はどこか。

## 生成由来

この一覧は、Kiroスタイルの仕様駆動開発を支援するツール「cc-sdd」で生成されたファイル群を日本語化したもの。元の生成は `npx cc-sdd@latest --claude-agent` によって行われている。

## 最新コミットで新規作成されたファイル一覧

- .claude/agents/kiro/spec-design.ja.md
- .claude/agents/kiro/spec-impl.ja.md
- .claude/agents/kiro/spec-requirements.ja.md
- .claude/agents/kiro/spec-tasks.ja.md
- .claude/agents/kiro/steering-custom.ja.md
- .claude/agents/kiro/steering.ja.md
- .claude/agents/kiro/validate-design.ja.md
- .claude/agents/kiro/validate-gap.ja.md
- .claude/agents/kiro/validate-impl.ja.md
- .claude/commands/kiro/spec-design.ja.md
- .claude/commands/kiro/spec-impl.ja.md
- .claude/commands/kiro/spec-init.ja.md
- .claude/commands/kiro/spec-quick.ja.md
- .claude/commands/kiro/spec-requirements.ja.md
- .claude/commands/kiro/spec-status.ja.md
- .claude/commands/kiro/spec-tasks.ja.md
- .claude/commands/kiro/steering-custom.ja.md
- .claude/commands/kiro/steering.ja.md
- .claude/commands/kiro/validate-design.ja.md
- .claude/commands/kiro/validate-gap.ja.md
- .claude/commands/kiro/validate-impl.ja.md
- .kiro/settings/rules/design-discovery-full.ja.md
- .kiro/settings/rules/design-discovery-light.ja.md
- .kiro/settings/rules/design-principles.ja.md
- .kiro/settings/rules/design-review.ja.md
- .kiro/settings/rules/ears-format.ja.md
- .kiro/settings/rules/gap-analysis.ja.md
- .kiro/settings/rules/steering-principles.ja.md
- .kiro/settings/rules/tasks-generation.ja.md
- .kiro/settings/rules/tasks-parallel-analysis.ja.md
- .kiro/settings/templates/specs/design.ja.md
- .kiro/settings/templates/specs/requirements-init.ja.md
- .kiro/settings/templates/specs/requirements.ja.md
- .kiro/settings/templates/specs/research.ja.md
- .kiro/settings/templates/specs/tasks.ja.md
- .kiro/settings/templates/steering-custom/api-standards.ja.md
- .kiro/settings/templates/steering-custom/authentication.ja.md
- .kiro/settings/templates/steering-custom/database.ja.md
- .kiro/settings/templates/steering-custom/deployment.ja.md
- .kiro/settings/templates/steering-custom/error-handling.ja.md
- .kiro/settings/templates/steering-custom/security.ja.md
- .kiro/settings/templates/steering-custom/testing.ja.md
- .kiro/settings/templates/steering/product.ja.md
- .kiro/settings/templates/steering/structure.ja.md
- .kiro/settings/templates/steering/tech.ja.md
- CLAUDE.ja.md
