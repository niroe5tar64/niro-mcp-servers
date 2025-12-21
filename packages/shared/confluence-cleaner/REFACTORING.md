# confluence-cleaner リファクタリング計画

## 概要

`src/index.ts`（724行）を責務ごとにファイル分割し、パイプラインパターンで再構成する。

## 現在の問題

- 1ファイルに複数の責務が混在
- テストの粒度が粗い
- 新しいマクロ対応の追加時に影響範囲が広い

## 目標構造

```
src/
├── index.ts                    # エントリーポイント（re-export）
├── cleaner.ts                  # メイン変換ロジック
├── turndown-service.ts         # TurndownService管理
├── preprocessors/              # HTML前処理
│   ├── index.ts
│   ├── metadata-cleaner.ts
│   ├── macro-processor.ts
│   ├── table-normalizer.ts
│   └── svg-to-mermaid.ts
├── postprocessors/             # Markdown後処理
│   ├── index.ts
│   ├── table-unescape.ts
│   └── html-table-converter.ts
└── utils/
    ├── html-escape.ts
    └── token-estimator.ts
```

---

## 作業手順

### Step 1: ユーティリティの分離

**対象関数:**
- `escapeHtml()` → `utils/html-escape.ts`
- `estimateTokens()`, `calculateTokenReduction()` → `utils/token-estimator.ts`

**作業内容:**
1. `src/utils/html-escape.ts` を作成
2. `src/utils/token-estimator.ts` を作成
3. 各関数を移動し、`export` する

**utils/html-escape.ts:**
```typescript
export function escapeHtml(text: string): string {
  // 既存の実装をそのまま移動
}
```

**utils/token-estimator.ts:**
```typescript
export function estimateTokens(text: string): number {
  // 既存の実装をそのまま移動
}

export function calculateTokenReduction(original: string, cleaned: string): number {
  // 既存の実装をそのまま移動
}
```

---

### Step 2: TurndownService管理の分離

**対象:**
- `turndownServiceCache`（グローバル変数）
- `getTurndownService()`

**作業内容:**
1. `src/turndown-service.ts` を作成
2. キャッシュとファクトリー関数を移動

**turndown-service.ts:**
```typescript
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const cache = new Map<boolean, TurndownService>();

export function getTurndownService(convertTables: boolean): TurndownService {
  // 既存の実装をそのまま移動
}
```

---

### Step 3: プリプロセッサの分離

#### 3-1: metadata-cleaner.ts

**対象関数:** `removeConfluenceMetadata()`

```typescript
// preprocessors/metadata-cleaner.ts
import * as cheerio from "cheerio";

export function removeConfluenceMetadata(html: string): string {
  // 既存の実装をそのまま移動
}
```

#### 3-2: svg-to-mermaid.ts

**対象関数:** `processSvgToMermaid()`

```typescript
// preprocessors/svg-to-mermaid.ts
import * as cheerio from "cheerio";

export function processSvgToMermaid(svgHtml: string): string {
  // 既存の実装をそのまま移動
}
```

#### 3-3: macro-processor.ts

**対象関数:** `processRenderedHtml()`

**依存関係:** `svg-to-mermaid.ts`, `utils/html-escape.ts`

```typescript
// preprocessors/macro-processor.ts
import * as cheerio from "cheerio";
import { processSvgToMermaid } from "./svg-to-mermaid";
import { escapeHtml } from "../utils/html-escape";

export function processRenderedHtml(html: string): string {
  // 既存の実装をそのまま移動
}
```

#### 3-4: table-normalizer.ts

**対象関数:** `normalizeTableCells()`

```typescript
// preprocessors/table-normalizer.ts
import * as cheerio from "cheerio";

export function normalizeTableCells(html: string): string {
  // 既存の実装をそのまま移動
}
```

#### 3-5: preprocessors/index.ts

```typescript
// preprocessors/index.ts
export { removeConfluenceMetadata } from "./metadata-cleaner";
export { processRenderedHtml } from "./macro-processor";
export { normalizeTableCells } from "./table-normalizer";
export { processSvgToMermaid } from "./svg-to-mermaid";
```

---

### Step 4: ポストプロセッサの分離

#### 4-1: table-unescape.ts

**対象関数:** `unescapeMarkdownInTables()`

```typescript
// postprocessors/table-unescape.ts
export function unescapeMarkdownInTables(markdown: string): string {
  // 既存の実装をそのまま移動
}
```

#### 4-2: html-table-converter.ts

**対象関数:** `convertRemainingHtmlTables()`

```typescript
// postprocessors/html-table-converter.ts
import * as cheerio from "cheerio";
import TurndownService from "turndown";

export function convertRemainingHtmlTables(markdown: string): string {
  // 既存の実装をそのまま移動
}
```

#### 4-3: postprocessors/index.ts

```typescript
// postprocessors/index.ts
export { unescapeMarkdownInTables } from "./table-unescape";
export { convertRemainingHtmlTables } from "./html-table-converter";
```

---

### Step 5: メイン変換ロジックの整理

**作業内容:**
1. `src/cleaner.ts` を作成
2. `cleanConfluenceHtml()` を移動
3. 分離したモジュールをインポート

**cleaner.ts:**
```typescript
import { getTurndownService } from "./turndown-service";
import {
  removeConfluenceMetadata,
  processRenderedHtml,
  normalizeTableCells,
} from "./preprocessors";
import {
  unescapeMarkdownInTables,
  convertRemainingHtmlTables,
} from "./postprocessors";

export interface CleanerOptions {
  removeMetadata?: boolean;
  expandMacros?: boolean;
  convertTables?: boolean;
}

export function cleanConfluenceHtml(
  html: string,
  options: CleanerOptions = {},
): string {
  // 既存の実装をそのまま移動
  // インポートした関数を使用
}
```

---

### Step 6: エントリーポイントの整理

**index.ts:**
```typescript
// src/index.ts
export { cleanConfluenceHtml, type CleanerOptions } from "./cleaner";
export { calculateTokenReduction } from "./utils/token-estimator";
```

---

### Step 7: テストの確認

**作業内容:**
1. `bun test` を実行し、全テストがパスすることを確認
2. `bun run check` を実行し、リント・フォーマットを適用

**期待結果:**
- 既存のテスト（`index.test.ts`）がすべてパス
- 外部APIに変更なし（`cleanConfluenceHtml`, `calculateTokenReduction` のみexport）

---

## 注意事項

### 処理順序の依存関係

以下の順序は変更不可（`cleanConfluenceHtml`内の処理順序）：

1. `processRenderedHtml()` - class属性を参照するため、メタデータ削除より先
2. `removeConfluenceMetadata()` - 不要な属性を削除
3. `normalizeTableCells()` - テーブル変換の前処理
4. Turndown変換
5. `unescapeMarkdownInTables()` - Turndownの後処理
6. `convertRemainingHtmlTables()` - 残りのテーブル変換

### 外部API（変更禁止）

```typescript
// これらのexportは変更しない
export function cleanConfluenceHtml(html: string, options?: CleanerOptions): string;
export function calculateTokenReduction(original: string, cleaned: string): number;
export interface CleanerOptions { ... }
```

### cheerioのインポート

各ファイルで `import * as cheerio from "cheerio"` を使用する。

---

## 完了条件

- [ ] 目標構造どおりにファイルが分割されている
- [ ] `bun test` が全てパス
- [ ] `bun run check` がエラーなし
- [ ] 外部API（`cleanConfluenceHtml`, `calculateTokenReduction`）の型シグネチャが変更されていない
- [ ] 各ファイルが100行以下（目安）

---

## 作業完了後

このファイル（`REFACTORING.md`）は削除してください。
