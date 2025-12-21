# HTMLエンティティデコード修正計画

## 1. 問題の概要

### 現象
`confluence-cleaner`によるHTML→Markdown変換後も、HTMLエンティティがデコードされずに残っている。

### 具体例

**page-2570547984.md での出現状況**:

| エンティティ | 出現回数 | 変換されるべき文字 |
|-------------|---------|------------------|
| `&nbsp;` | 148回 | 半角スペース ` ` |
| `&amp;` | 多数 | アンパサンド `&` |

### 実際の出力例

```markdown
# 変換前（問題あり）
-   ベース記載&nbsp;2025/01/09&nbsp;[小谷野 諭@FE](/display/~koyano-satoshi)&nbsp;
![](/download/attachments/2570547984/video.png?version=1&amp;modificationDate=1749435563414&amp;api=v2)

# 変換後（期待される結果）
-   ベース記載 2025/01/09 [小谷野 諭@FE](/display/~koyano-satoshi)
![](/download/attachments/2570547984/video.png?version=1&modificationDate=1749435563414&api=v2)
```

---

## 2. 原因分析

### 問題の根本原因
TurndownServiceによるHTML→Markdown変換時に、HTMLエンティティが自動的にはデコードされない。特に以下のケースで問題が発生する：

1. **テキストノード内の`&nbsp;`**: ConfluenceがHTML内でスペースを`&nbsp;`として保持している
2. **URL内の`&amp;`**: クエリパラメータの`&`が`&amp;`としてエンコードされたまま

### 現在の実装状況
- `src/utils/html-escape.ts`: エスケープ関数のみ存在（`escapeHtml()`）
- デコード（アンエスケープ）関数が存在しない
- 後処理（postprocessors）にHTMLエンティティデコードが含まれていない

---

## 3. 修正方針

### アプローチ
Markdown変換後の後処理（postprocessor）として、HTMLエンティティをデコードする関数を追加する。

### 対象エンティティ

| 優先度 | エンティティ | 変換先 | 備考 |
|--------|-------------|-------|------|
| 高 | `&nbsp;` | ` ` (半角スペース) | 最も多く出現 |
| 高 | `&amp;` | `&` | URL内で多用 |
| 中 | `&lt;` | `<` | コードブロック内で使用される可能性 |
| 中 | `&gt;` | `>` | コードブロック内で使用される可能性 |
| 低 | `&quot;` | `"` | 属性値で使用 |
| 低 | `&#039;` / `&apos;` | `'` | 属性値で使用 |
| 低 | `&#数字;` | 対応文字 | 数値文字参照 |

---

## 4. 実装計画

### Task 1: HTMLエンティティデコード関数の作成

**ファイル**: `src/postprocessors/html-entity-decoder.ts`（新規作成）

```typescript
/**
 * HTMLエンティティをデコードする
 * Markdown変換後のテキストに残るHTMLエンティティを元の文字に戻す
 */
export function decodeHtmlEntities(markdown: string): string {
  // 名前付きエンティティ
  const namedEntities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
  };

  let result = markdown;

  // 名前付きエンティティの変換
  for (const [entity, char] of Object.entries(namedEntities)) {
    result = result.replaceAll(entity, char);
  }

  // 数値文字参照の変換 (&#数字;)
  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(Number.parseInt(code, 10))
  );

  // 16進数値文字参照の変換 (&#x16進数;)
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
    String.fromCharCode(Number.parseInt(code, 16))
  );

  return result;
}
```

### Task 2: postprocessorsのエクスポート追加

**ファイル**: `src/postprocessors/index.ts`

```typescript
export { unescapeMarkdownInTables } from "./table-unescape";
export { convertRemainingHtmlTables } from "./html-table-converter";
export { decodeHtmlEntities } from "./html-entity-decoder"; // 追加
```

### Task 3: cleaner.tsへの統合

**ファイル**: `src/cleaner.ts`

変換パイプラインの最終段階に`decodeHtmlEntities`を追加する：

```typescript
import {
  convertRemainingHtmlTables,
  decodeHtmlEntities,        // 追加
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

  // HTMLエンティティをデコード（最終処理）← 追加
  markdown = decodeHtmlEntities(markdown);

  return markdown;
}
```

### Task 4: テストの作成

**ファイル**: `src/postprocessors/html-entity-decoder.test.ts`（新規作成）

```typescript
import { describe, expect, test } from "bun:test";
import { decodeHtmlEntities } from "./html-entity-decoder";

describe("decodeHtmlEntities", () => {
  test("&nbsp; を半角スペースに変換する", () => {
    const input = "Hello&nbsp;World";
    const expected = "Hello World";
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test("&amp; を & に変換する", () => {
    const input = "foo=1&amp;bar=2";
    const expected = "foo=1&bar=2";
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test("複数のエンティティを同時に変換する", () => {
    const input = "&lt;div&gt;&amp;&nbsp;&quot;test&quot;&lt;/div&gt;";
    const expected = '<div>& "test"</div>';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test("数値文字参照を変換する", () => {
    const input = "&#65;&#66;&#67;";
    const expected = "ABC";
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test("16進数値文字参照を変換する", () => {
    const input = "&#x41;&#x42;&#x43;";
    const expected = "ABC";
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test("エンティティがない文字列はそのまま返す", () => {
    const input = "Normal text without entities";
    expect(decodeHtmlEntities(input)).toBe(input);
  });

  test("URL内のエンティティを変換する", () => {
    const input = "![](/download/attachments/123/image.png?version=1&amp;modificationDate=1749435563414&amp;api=v2)";
    const expected = "![](/download/attachments/123/image.png?version=1&modificationDate=1749435563414&api=v2)";
    expect(decodeHtmlEntities(input)).toBe(expected);
  });
});
```

### Task 5: 統合テストの確認

**ファイル**: `src/index.test.ts`

既存のfixtureテストで、HTMLエンティティが正しくデコードされることを確認する。

---

## 5. 注意事項

### コードブロック内のエンティティ
コードブロック（```...```）内のHTMLエンティティは、意図的にエンコードされている可能性がある。
ただし、現在の実装ではシンプルに全てデコードする方針とする。
問題が発生した場合は、コードブロック内を除外する処理を追加検討する。

### 処理順序
`decodeHtmlEntities`は変換パイプラインの**最終段階**で実行する：

1. `processRenderedHtml` - マクロ処理
2. `removeConfluenceMetadata` - メタデータ除去
3. `normalizeTableCells` - テーブルセル正規化
4. `turndownService.turndown` - HTML→Markdown変換
5. `unescapeMarkdownInTables` - テーブル内Markdown構文解除
6. `convertRemainingHtmlTables` - 残りHTMLテーブル変換
7. **`decodeHtmlEntities`** - HTMLエンティティデコード ← 新規追加

---

## 6. 作業チェックリスト

- [ ] `src/postprocessors/html-entity-decoder.ts` を新規作成
- [ ] `src/postprocessors/index.ts` にエクスポート追加
- [ ] `src/cleaner.ts` にインポートと呼び出しを追加
- [ ] `src/postprocessors/html-entity-decoder.test.ts` を新規作成
- [ ] `bun test` で全テストがパスすることを確認
- [ ] `bun run check` でリント/フォーマットを適用
- [ ] fixtureファイル `page-2570547984.md` で `&nbsp;` が解消されていることを確認

---

## 7. 期待される結果

### Before
```markdown
-   ベース記載&nbsp;2025/01/09&nbsp;[小谷野 諭@FE](/display/~koyano-satoshi)&nbsp;
![](/download/attachments/2570547984/video.png?version=1&amp;modificationDate=1749435563414&amp;api=v2)
```

### After
```markdown
-   ベース記載 2025/01/09 [小谷野 諭@FE](/display/~koyano-satoshi)
![](/download/attachments/2570547984/video.png?version=1&modificationDate=1749435563414&api=v2)
```

---

## 8. 参考情報

### 関連ファイル
- `src/cleaner.ts` - メイン変換ロジック
- `src/postprocessors/index.ts` - 後処理のエクスポート
- `src/postprocessors/table-unescape.ts` - 既存の後処理（参考実装）
- `src/utils/html-escape.ts` - エスケープ関数（逆の処理を追加）

### HTMLエンティティ参照
- [HTML Entities - MDN](https://developer.mozilla.org/en-US/docs/Glossary/Entity)
- [Character Entity Reference Chart](https://dev.w3.org/html5/html-author/charref)
