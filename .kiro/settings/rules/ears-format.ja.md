# EARS 形式ガイドライン

## 概要
EARS（Easy Approach to Requirements Syntax）は、仕様駆動開発における受け入れ基準の標準形式。

EARS のパターンは要件の論理構造（条件 + 主体 + 応答）を表し、特定の自然言語に依存しない。
すべての受け入れ基準は仕様で指定された対象言語（例: `spec.json.language` / `ja`）で記述する。
EARS のトリガーキーワードと固定句は英語のまま（`When`, `If`, `While`, `Where`, `The system shall`, `The [system] shall`）とし、可変部分（`[event]`, `[precondition]`, `[trigger]`, `[feature is included]`, `[response/action]`）のみ対象言語にローカライズする。固定句の中に対象言語のテキストを挟み込まないこと。

## 主要 EARS パターン

### 1. イベント駆動要件
- **パターン**: When [event], the [system] shall [response/action]
- **用途**: 特定イベントやトリガーへの応答
- **例**: When user clicks checkout button, the Checkout Service shall validate cart contents

### 2. 状態駆動要件
- **パターン**: While [precondition], the [system] shall [response/action]
- **用途**: システム状態や前提条件に依存する挙動
- **例**: While payment is processing, the Checkout Service shall display loading indicator

### 3. 望ましくない挙動要件
- **パターン**: If [trigger], the [system] shall [response/action]
- **用途**: エラー、障害、望ましくない状況への応答
- **例**: If invalid credit card number is entered, then the website shall display error message

### 4. 任意機能要件
- **パターン**: Where [feature is included], the [system] shall [response/action]
- **用途**: オプション機能や条件付き機能の要件
- **例**: Where the car has a sunroof, the car shall have a sunroof control panel

### 5. 常時要件
- **パターン**: The [system] shall [response/action]
- **用途**: 常時有効な要件や基本特性
- **例**: The mobile phone shall have a mass of less than 100 grams

## 複合パターン
- While [precondition], when [event], the [system] shall [response/action]
- When [event] and [additional condition], the [system] shall [response/action]

## 主体の選定ガイドライン
- **ソフトウェアプロジェクト**: 具体的なシステム/サービス名（例: "Checkout Service", "User Auth Module"）
- **プロセス/ワークフロー**: 責任チーム/役割（例: "Support Team", "Review Process"）
- **非ソフトウェア**: 適切な主体（例: "Marketing Campaign", "Documentation"）

## 品質基準
- 要件はテスト可能・検証可能で、単一の振る舞いを表すこと。
- 客観的な表現を使う: 必須は "shall"、推奨は "should"。曖昧語は避ける。
- EARS 構文に従う: [condition], the [system] shall [response/action]。
