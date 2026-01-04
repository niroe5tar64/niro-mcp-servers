# ステアリング原則

ステアリングファイルは**プロジェクトの記憶**であり、網羅的な仕様ではない。

---

## 内容の粒度

### ゴールデンルール
> 「新しいコードが既存パターンに従うなら、ステアリング更新は不要であるべき」

### ✅ 記載するもの
- 組織化パターン（機能優先、レイヤード）
- 命名規約（PascalCase など）
- インポート戦略（絶対/相対）
- アーキテクチャ決定（状態管理など）
- 技術標準（主要フレームワーク）

### ❌ 避けるもの
- 完全なファイル一覧
- すべてのコンポーネント説明
- 全依存関係
- 実装詳細
- エージェント固有ツールのディレクトリ（例: `.cursor/`, `.gemini/`, `.claude/`）
- `.kiro/` のメタデータディレクトリ（settings, automation）の詳細記述

### 例の比較

**悪い例**（仕様のような記述）:
```markdown
- /components/Button.tsx - Primary button with variants
- /components/Input.tsx - Text input with validation
- /components/Modal.tsx - Modal dialog
... (50+ files)
```

**良い例**（プロジェクト記憶）:
```markdown
## UI Components (`/components/ui/`)
Reusable, design-system aligned primitives
- Named by function (Button, Input, Modal)
- Export component + TypeScript interface
- No business logic
```

---

## セキュリティ

以下は**絶対に含めない**:
- API キー、パスワード、認証情報
- DB の URL、内部 IP
- 機密情報やセンシティブデータ

---

## 品質基準

- **単一ドメイン**: 1 ファイル 1 トピック
- **具体例**: パターンはコードで示す
- **理由の説明**: なぜその判断か
- **保守可能なサイズ**: 通常 100-200 行

---

## 更新時の保持ルール

- ユーザーのセクションとカスタム例は保持
- 既存に**追加**する（置換しない）
- `updated_at` タイムスタンプを付与
- 変更理由を記載

---

## 注意

- テンプレートは出発点。必要に応じて調整する。
- コアステアリングと同じ粒度原則に従う。
- すべてのステアリングファイルはプロジェクト記憶として読み込まれる。
- `.kiro/specs/` と `.kiro/steering/` の軽い参照は許容。その他の `.kiro/` ディレクトリは避ける。
- カスタムファイルもコアファイル同様に重要。

---

## ファイル別の焦点

- **product.md**: 目的、価値、ビジネス文脈（機能一覧ではない）
- **tech.md**: 主要フレームワーク、標準、規約（全依存関係ではない）
- **structure.md**: 構成パターン、命名規則（ディレクトリツリーではない）
- **カスタム**: 特化パターン（API、テスト、セキュリティなど）
