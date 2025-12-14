import { describe, test, expect } from "bun:test";
import { calculateTokenReduction, cleanConfluenceHtml, expandMacro } from "./index";

describe("calculateTokenReduction", () => {
  test("正常な削減率を計算できる", () => {
    const original = "1234567890123456"; // 16文字 = 4トークン
    const cleaned = "12345678"; // 8文字 = 2トークン
    const reduction = calculateTokenReduction(original, cleaned);

    expect(reduction).toBe(50); // 50%削減
  });

  test("削減がない場合は0%を返す", () => {
    const text = "12345678"; // 8文字
    const reduction = calculateTokenReduction(text, text);

    expect(reduction).toBe(0);
  });

  test("トークンが増加した場合は負の値を返す", () => {
    const original = "1234"; // 4文字 = 1トークン
    const cleaned = "12345678"; // 8文字 = 2トークン
    const reduction = calculateTokenReduction(original, cleaned);

    expect(reduction).toBe(-100); // 100%増加（-100%削減）
  });

  test("空文字列を処理できる", () => {
    const original = "12345678"; // 8文字 = 2トークン
    const cleaned = ""; // 0文字 = 0トークン
    const reduction = calculateTokenReduction(original, cleaned);

    expect(reduction).toBe(100); // 100%削減
  });

  test("日本語テキストでも動作する", () => {
    const original = "あいうえおかきくけこ"; // 10文字 = 3トークン（切り上げ）
    const cleaned = "あいうえお"; // 5文字 = 2トークン（切り上げ）
    const reduction = calculateTokenReduction(original, cleaned);

    // 10文字→3トークン, 5文字→2トークン = (3-2)/3*100 = 33.33...
    expect(reduction).toBeCloseTo(33.33, 1);
  });

  test("実際のHTMLとMarkdownで削減率を計算", () => {
    const html = '<div class="confluence-content"><p style="color: red;">Hello World</p></div>'; // 76文字 = 19トークン
    const markdown = "Hello World"; // 11文字 = 3トークン
    const reduction = calculateTokenReduction(html, markdown);

    // (19-3)/19*100 = 84.21...
    expect(reduction).toBeGreaterThan(80); // 80%以上削減されている
    expect(reduction).toBeLessThan(90); // 90%未満
  });
});

describe("cleanConfluenceHtml", () => {
  test("現在はHTMLをそのまま返す（TODO実装前）", () => {
    const html = '<div class="confluence-content"><p>Test</p></div>';
    const result = cleanConfluenceHtml(html);

    expect(result).toBe(html); // TODO実装後はMarkdownが返される
  });

  test("オプションを受け付ける", () => {
    const html = '<p>Test</p>';
    const result = cleanConfluenceHtml(html, {
      removeMetadata: true,
      expandMacros: true,
      convertTables: true,
    });

    expect(result).toBeDefined();
  });
});

describe("expandMacro", () => {
  test("現在はコンテンツをそのまま返す（TODO実装前）", () => {
    const content = "This is a test";
    const result = expandMacro("info", content);

    expect(result).toBe(content); // TODO実装後は展開されたテキストが返される
  });

  test("異なるマクロタイプを受け付ける", () => {
    const content = "Warning message";
    const result = expandMacro("warning", content);

    expect(result).toBeDefined();
  });
});
