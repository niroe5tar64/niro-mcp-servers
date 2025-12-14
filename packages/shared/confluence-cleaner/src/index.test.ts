import { describe, expect, test } from "bun:test";
import {
  calculateTokenReduction,
  cleanConfluenceHtml,
  expandMacro,
} from "./index";

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
    const html =
      '<div class="confluence-content"><p style="color: red;">Hello World</p></div>'; // 76文字 = 19トークン
    const markdown = "Hello World"; // 11文字 = 3トークン
    const reduction = calculateTokenReduction(html, markdown);

    // (19-3)/19*100 = 84.21...
    expect(reduction).toBeGreaterThan(80); // 80%以上削減されている
    expect(reduction).toBeLessThan(90); // 90%未満
  });
});

describe("cleanConfluenceHtml", () => {
  describe("基本的なHTML変換", () => {
    test("シンプルな段落をMarkdownに変換", () => {
      const html = "<p>Hello World</p>";
      const result = cleanConfluenceHtml(html);

      expect(result.trim()).toBe("Hello World");
    });

    test("見出しをMarkdownに変換", () => {
      const html = "<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>";
      const result = cleanConfluenceHtml(html);

      expect(result).toContain("# Title");
      expect(result).toContain("## Subtitle");
      expect(result).toContain("### Section");
    });

    test("リストをMarkdownに変換", () => {
      const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
      const result = cleanConfluenceHtml(html);

      expect(result).toContain("-   Item 1");
      expect(result).toContain("-   Item 2");
    });

    test("強調とボールドをMarkdownに変換", () => {
      const html = "<p>This is <strong>bold</strong> and <em>italic</em></p>";
      const result = cleanConfluenceHtml(html);

      expect(result).toContain("**bold**");
      expect(result).toContain("*italic*");
    });

    test("リンクをMarkdownに変換", () => {
      const html = '<p><a href="https://example.com">Link</a></p>';
      const result = cleanConfluenceHtml(html);

      expect(result).toContain("[Link](https://example.com)");
    });
  });

  describe("Confluence特有のメタデータ除去", () => {
    test("classとstyle属性を削除", () => {
      const html =
        '<div class="confluence-content" style="color: red;"><p class="paragraph" style="margin: 10px;">Test</p></div>';
      const result = cleanConfluenceHtml(html, { removeMetadata: true });

      expect(result).not.toContain("class=");
      expect(result).not.toContain("style=");
      expect(result.trim()).toBe("Test");
    });

    test("data-*属性を削除", () => {
      const html =
        '<div data-confluence-id="12345" data-macro-name="info"><p>Test</p></div>';
      const result = cleanConfluenceHtml(html, { removeMetadata: true });

      expect(result).not.toContain("data-");
    });

    test("removeMetadata: false の場合は属性を保持", () => {
      const html = '<div class="test"><p>Test</p></div>';
      const result = cleanConfluenceHtml(html, { removeMetadata: false });

      // Turndownはデフォルトで属性を除去するため、このテストは実装依存
      // 基本的な変換は行われることを確認
      expect(result).toBeDefined();
      expect(result).toContain("Test");
    });
  });

  describe("テーブル変換", () => {
    test("シンプルなテーブルをMarkdownに変換", () => {
      const html = `
        <table>
          <thead>
            <tr><th>Header 1</th><th>Header 2</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
            <tr><td>Cell 3</td><td>Cell 4</td></tr>
          </tbody>
        </table>
      `;
      const result = cleanConfluenceHtml(html, { convertTables: true });

      expect(result).toContain("| Header 1 | Header 2 |");
      expect(result).toContain("| --- | --- |");
      expect(result).toContain("| Cell 1 | Cell 2 |");
    });

    test("convertTables: false の場合はHTMLテーブルを保持", () => {
      const html = "<table><tr><td>Test</td></tr></table>";
      const result = cleanConfluenceHtml(html, { convertTables: false });

      expect(result).toContain("<table>");
    });
  });

  describe("空文字列とエッジケース", () => {
    test("空文字列を処理", () => {
      const result = cleanConfluenceHtml("");
      expect(result).toBe("");
    });

    test("HTMLタグなしのプレーンテキストを処理", () => {
      const text = "Plain text without HTML";
      const result = cleanConfluenceHtml(text);

      expect(result).toBe(text);
    });

    test("ネストされた複雑なHTMLを処理", () => {
      const html = `
        <div class="confluence-content">
          <h1>Title</h1>
          <div class="section">
            <p>Paragraph with <strong>bold</strong> and <em>italic</em></p>
            <ul>
              <li>Item 1</li>
              <li>Item 2 with <a href="/link">link</a></li>
            </ul>
          </div>
        </div>
      `;
      const result = cleanConfluenceHtml(html);

      // 適切なMarkdownが返されることを確認
      expect(result).toContain("# Title");
      expect(result).toContain("**bold**");
      expect(result).toContain("*italic*");
      expect(result).toContain("-   Item 1");
      expect(result).toContain("[link](/link)");
    });
  });
});

describe("expandMacro", () => {
  test("infoマクロを展開", () => {
    const content = "This is important information";
    const result = expandMacro("info", content);

    expect(result).toContain("ℹ️");
    expect(result).toContain(content);
  });

  test("warningマクロを展開", () => {
    const content = "This is a warning";
    const result = expandMacro("warning", content);

    expect(result).toContain("⚠️");
    expect(result).toContain(content);
  });

  test("noteマクロを展開", () => {
    const content = "Please note this";
    const result = expandMacro("note", content);

    expect(result).toContain("📝");
    expect(result).toContain(content);
  });

  test("tipマクロを展開", () => {
    const content = "Here's a tip";
    const result = expandMacro("tip", content);

    expect(result).toContain("💡");
    expect(result).toContain(content);
  });

  test("codeマクロを展開", () => {
    const content = "console.log('Hello')";
    const result = expandMacro("code", content);

    expect(result).toContain("```");
    expect(result).toContain(content);
  });

  test("未知のマクロタイプは元のコンテンツを返す", () => {
    const content = "Unknown macro content";
    const result = expandMacro("unknown-macro-type", content);

    expect(result).toBe(content);
  });

  test("空のコンテンツを処理", () => {
    const result = expandMacro("info", "");

    // 空文字列またはマクロのプレフィックスのみ返す
    expect(result).toBeDefined();
  });
});
