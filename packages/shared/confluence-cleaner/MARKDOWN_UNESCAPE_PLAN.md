# Markdownエスケープ解除修正計画

## 1. 問題の概要

### 現象
`confluence-cleaner`によるHTML→Markdown変換後に、不要なバックスラッシュエスケープが残っている。

### 具体例

**page-2570547984.md での出現状況**:

| エスケープ | 出現回数 | 変換されるべき文字 |
|-----------|---------|------------------|
| `\_` | 77回 | `_` (アンダースコア) |
| `\-` | 67回 | `-` (ハイフン) |
| `\*` | 8回 | `*` (アスタリスク) |

### 実際の出力例

```markdown
# 変換前（問題あり）
| og:locale | ja\_JP |
| og:site\_name | ExampleService |
| 表示条件 | \- |
| URL | video.example.com/category-a/\* |

# 変換後（期待される結果）
| og:locale | ja_JP |
| og:site_name | ExampleService |
| 表示条件 | - |
| URL | video.example.com/category-a/* |
```

---

## 2. 原因分析

### 問題の根本原因
TurndownServiceはMarkdown変換時に、Markdown構文として解釈される可能性のある文字を自動的にエスケープする。

#### TurndownServiceのデフォルトエスケープ対象
- `_` (アンダースコア) → 斜体構文 `_text_` と誤解されないように
- `*` (アスタリスク) → 斜体/太字構文 `*text*` と誤解されないように
- `-` (ハイフン) → リスト構文 `- item` と誤解されないように
- その他: `#`, `.`, `!`, `[`, `]`, `(`, `)`, `\` など

### LLM向けMarkdownでは不要
これらのエスケープは、Markdownをレンダリングする際の安全策だが、LLM向けのプレーンテキストとしては不要。むしろ可読性を損なう。

### 現在の実装状況
- `src/postprocessors/table-unescape.ts`: テーブル行内の画像構文エスケープ解除のみ
- `\_`, `\-`, `\*` などの一般的なエスケープは対象外

---

## 3. 修正方針

### アプローチ
Markdown変換後の後処理（postprocessor）として、不要なバックスラッシュエスケープを解除する関数を追加する。

### 対象エスケープ

| 優先度 | エスケープ | 変換先 | 備考 |
|--------|-----------|-------|------|
| 高 | `\_` | `_` | 最も多く出現 |
| 高 | `\-` | `-` | テーブルセル内で頻出 |
| 中 | `\*` | `*` | URL内のワイルドカードなど |
| 低 | `\#` | `#` | 必要に応じて |
| 低 | `\.` | `.` | 必要に応じて |
| 低 | `\!` | `!` | 画像構文以外で使用時 |

### 除外すべきコンテキスト
- **コードブロック内** (``` ... ```): エスケープが意図的な可能性
- **インラインコード内** (` ... `): 同上

ただし、現在のfixtureファイル分析では、コードブロック内にこれらのエスケープは見られないため、初期実装ではシンプルに全体置換とする。問題が発生した場合にコンテキスト判定を追加する。

---

## 4. 実装計画

### Task 1: Markdownエスケープ解除関数の作成

**ファイル**: `src/postprocessors/markdown-unescape.ts`（新規作成）

```typescript
/**
 * Turndownが挿入した不要なバックスラッシュエスケープを解除する
 * LLM向けのプレーンテキストとして可読性を向上させる
 */
export function unescapeMarkdown(markdown: string): string {
  // エスケープ解除対象の文字
  const escapePatterns: [string, string][] = [
    ["\\_", "_"],
    ["\\-", "-"],
    ["\\*", "*"],
    ["\\#", "#"],
    ["\\.", "."],
    ["\\!", "!"],
  ];

  let result = markdown;

  for (const [escaped, unescaped] of escapePatterns) {
    result = result.replaceAll(escaped, unescaped);
  }

  return result;
}
```

### Task 2: postprocessorsのエクスポート追加

**ファイル**: `src/postprocessors/index.ts`

```typescript
export { unescapeMarkdownInTables } from "./table-unescape";
export { convertRemainingHtmlTables } from "./html-table-converter";
export { decodeHtmlEntities } from "./html-entity-decoder";
export { unescapeMarkdown } from "./markdown-unescape"; // 追加
```

### Task 3: cleaner.tsへの統合

**ファイル**: `src/cleaner.ts`

変換パイプラインの最終段階（HTMLエンティティデコードの後）に追加：

```typescript
import {
  convertRemainingHtmlTables,
  decodeHtmlEntities,
  unescapeMarkdown,          // 追加
  unescapeMarkdownInTables,
} from "./postprocessors";

// ... 省略 ...

export function cleanConfluenceHtml(
  html: string,
  options: CleanerOptions = {},
): string {
  // ... 既存処理 ...

  // HTML → Markdown変換
  let markdown = turndownService.turndown(cleanedHtml);

  // TurndownがエスケープしたMarkdown構文を解除
  markdown = unescapeMarkdownInTables(markdown);

  // Turndownが変換できなかった残りのHTMLテーブルをMarkdownに変換
  if (convertTables) {
    markdown = convertRemainingHtmlTables(markdown);
  }

  // HTMLエンティティをデコード
  markdown = decodeHtmlEntities(markdown);

  // 不要なMarkdownエスケープを解除（最終処理）← 追加
  markdown = unescapeMarkdown(markdown);

  return markdown;
}
```

### Task 4: テストの作成

**ファイル**: `src/postprocessors/markdown-unescape.test.ts`（新規作成）

```typescript
import { describe, expect, test } from "bun:test";
import { unescapeMarkdown } from "./markdown-unescape";

describe("unescapeMarkdown", () => {
  test("\\_ をアンダースコアに変換する", () => {
    const input = "ja\\_JP";
    const expected = "ja_JP";
    expect(unescapeMarkdown(input)).toBe(expected);
  });

  test("\\- をハイフンに変換する", () => {
    const input = "| \\- |";
    const expected = "| - |";
    expect(unescapeMarkdown(input)).toBe(expected);
  });

  test("\\* をアスタリスクに変換する", () => {
    const input = "video.example.com/\\*";
    const expected = "video.example.com/*";
    expect(unescapeMarkdown(input)).toBe(expected);
  });

  test("複数のエスケープを同時に変換する", () => {
    const input = "og:site\\_name | \\- | /path/\\*";
    const expected = "og:site_name | - | /path/*";
    expect(unescapeMarkdown(input)).toBe(expected);
  });

  test("エスケープがない文字列はそのまま返す", () => {
    const input = "Normal text without escapes";
    expect(unescapeMarkdown(input)).toBe(input);
  });

  test("ファイル名内のアンダースコアを正しく処理する", () => {
    const input = "image-2025-1-10\\_16-21-19.png";
    const expected = "image-2025-1-10_16-21-19.png";
    expect(unescapeMarkdown(input)).toBe(expected);
  });
});
```

### Task 5: 既存のtable-unescape.tsとの整理（オプション）

`unescapeMarkdownInTables` と `unescapeMarkdown` の役割が重複する部分がある場合、統合を検討する。

ただし、`unescapeMarkdownInTables` はテーブル行のみを対象としており、画像構文の特殊なエスケープ解除に特化しているため、当面は別関数として維持する。

---

## 5. 処理順序

`cleaner.ts`での後処理の順序：

1. `turndownService.turndown()` - HTML→Markdown変換
2. `unescapeMarkdownInTables()` - テーブル内画像構文のエスケープ解除
3. `convertRemainingHtmlTables()` - 残りHTMLテーブル変換
4. `decodeHtmlEntities()` - HTMLエンティティデコード
5. **`unescapeMarkdown()`** - 不要なMarkdownエスケープ解除 ← 新規追加

---

## 6. 作業チェックリスト

- [ ] `src/postprocessors/markdown-unescape.ts` を新規作成
- [ ] `src/postprocessors/index.ts` にエクスポート追加
- [ ] `src/cleaner.ts` にインポートと呼び出しを追加
- [ ] `src/postprocessors/markdown-unescape.test.ts` を新規作成
- [ ] `bun test` で全テストがパスすることを確認
- [ ] `bun run check` でリント/フォーマットを適用
- [ ] fixtureファイル `page-2570547984.md` で `\_`, `\-`, `\*` が解消されていることを確認

---

## 7. 期待される結果

### Before
```markdown
| og:locale | ja\_JP |
| og:site\_name | ExampleService |
| 表示条件 | \- |
| URL | video.example.com/category-a/\* |
| 撮影日 | image-2025-1-10\_16-21-19.png |
```

### After
```markdown
| og:locale | ja_JP |
| og:site_name | ExampleService |
| 表示条件 | - |
| URL | video.example.com/category-a/* |
| 撮影日 | image-2025-1-10_16-21-19.png |
```

---

## 8. 注意事項

### バックスラッシュ自体のエスケープ
`\\` (バックスラッシュのエスケープ) は意図的に使用される可能性があるため、対象外とする。

### 将来の拡張
コードブロック内のエスケープを保持する必要がある場合：

```typescript
export function unescapeMarkdown(markdown: string): string {
  // コードブロックを一時的に保護
  const codeBlocks: string[] = [];
  let result = markdown.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // エスケープ解除
  // ...

  // コードブロックを復元
  result = result.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => {
    return codeBlocks[Number(index)];
  });

  return result;
}
```

現時点では、fixtureファイルにこのような問題は見られないため、シンプルな実装から始める。

---

## 9. 参考情報

### 関連ファイル
- `src/cleaner.ts` - メイン変換ロジック
- `src/turndown-service.ts` - TurndownService設定
- `src/postprocessors/index.ts` - 後処理のエクスポート
- `src/postprocessors/table-unescape.ts` - 既存のエスケープ解除（参考実装）
- `src/postprocessors/html-entity-decoder.ts` - 同様のパターンの参考

### TurndownServiceのエスケープ動作
TurndownServiceは`escape`オプションでエスケープ関数をカスタマイズ可能だが、後処理でのアンエスケープの方がシンプルで安全。
