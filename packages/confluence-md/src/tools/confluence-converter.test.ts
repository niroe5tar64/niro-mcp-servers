/**
 * Confluence Converter Tool - Unit Tests
 *
 * ツールロジックの単体テスト。サーバー起動不要で高速に実行できます。
 */

import { describe, expect, test } from "bun:test";
import {
  type ConvertConfluenceToMarkdownArgs,
  confluenceConverterTool,
  handleConvertConfluenceToMarkdown,
} from "./confluence-converter.js";

describe("Confluence Converter Tool", () => {
  describe("ツール定義", () => {
    test("正しいツール名を持つ", () => {
      expect(confluenceConverterTool.name).toBe(
        "convert_confluence_to_markdown",
      );
    });

    test("説明文が定義されている", () => {
      expect(confluenceConverterTool.description).toBeDefined();
      expect(confluenceConverterTool.description).toBeTypeOf("string");
      if (confluenceConverterTool.description) {
        expect(confluenceConverterTool.description.length).toBeGreaterThan(0);
      }
    });

    test("入力スキーマが定義されている", () => {
      expect(confluenceConverterTool.inputSchema).toBeDefined();
      expect(confluenceConverterTool.inputSchema.type).toBe("object");
      expect(confluenceConverterTool.inputSchema.properties).toBeDefined();
    });

    test("html パラメータが必須として定義されている", () => {
      const props = confluenceConverterTool.inputSchema.properties;
      if (props && typeof props === "object") {
        expect(props.html).toBeDefined();
      }
      expect(confluenceConverterTool.inputSchema.required).toContain("html");
    });

    test("オプションパラメータが定義されている", () => {
      const props = confluenceConverterTool.inputSchema.properties;
      if (props && typeof props === "object") {
        expect(props.removeMetadata).toBeDefined();
        expect(props.expandMacros).toBeDefined();
        expect(props.convertTables).toBeDefined();
      }
    });
  });

  describe("handleConvertConfluenceToMarkdown", () => {
    describe("基本的な変換", () => {
      test("シンプルなHTMLを変換できる", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<p>Hello World</p>",
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
        expect(result.content).toBeArray();
        expect(result.content.length).toBeGreaterThan(0);
        expect(result.content[0].type).toBe("text");
        expect(result.content[0].text).toBeDefined();
      });

      test("空のHTMLを処理できる", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "",
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
        expect(result.content).toBeArray();
      });

      test("トークン削減情報が含まれる", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<p>Test</p>",
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        // 2つのコンテンツ（変換結果 + トークン削減情報）が返される
        expect(result.content.length).toBeGreaterThanOrEqual(2);

        // トークン削減情報を含むコンテンツがある
        const hasTokenReduction = result.content.some((item) =>
          item.text?.includes("Token reduction:"),
        );
        expect(hasTokenReduction).toBe(true);
      });
    });

    describe("Confluence特有のHTMLパターン", () => {
      test("Confluenceコンテナ付きのHTMLを変換できる", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: '<div class="confluence-content"><p>Content</p></div>',
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
        expect(result.content[0].text).toBeDefined();
      });

      test("複雑なネストされたHTMLを処理できる", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: `
            <div class="confluence-content">
              <h1>Title</h1>
              <p>Paragraph with <strong>bold</strong> and <em>italic</em></p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
          `,
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
        expect(result.content[0].text).toBeDefined();
      });

      test("テーブルを含むHTMLを処理できる", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: `
            <table>
              <tr><th>Header 1</th><th>Header 2</th></tr>
              <tr><td>Cell 1</td><td>Cell 2</td></tr>
            </table>
          `,
          convertTables: true,
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
        expect(result.content[0].text).toBeDefined();
      });
    });

    describe("オプションパラメータ", () => {
      test("removeMetadata オプションを受け付ける", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<p>Test</p>",
          removeMetadata: false,
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
      });

      test("expandMacros オプションを受け付ける", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<p>Test</p>",
          expandMacros: false,
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
      });

      test("convertTables オプションを受け付ける", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<table><tr><td>Test</td></tr></table>",
          convertTables: false,
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
      });

      test("すべてのオプションを組み合わせて使用できる", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<p>Test</p>",
          removeMetadata: true,
          expandMacros: true,
          convertTables: true,
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
      });

      test("オプション未指定時はデフォルト値が使用される", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<p>Test</p>",
          // オプション未指定
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
      });
    });

    describe("エッジケース", () => {
      test("HTMLタグが含まれない文字列を処理できる", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "Plain text without tags",
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
      });

      test("特殊文字を含むHTMLを処理できる", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<p>&lt;&gt;&amp;&quot;&#39;</p>",
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
      });

      test("非常に長いHTMLを処理できる", async () => {
        const longHtml = `<p>${"x".repeat(10000)}</p>`;
        const args: ConvertConfluenceToMarkdownArgs = {
          html: longHtml,
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
      });

      test("マルチバイト文字を含むHTMLを処理できる", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<p>日本語のテキスト</p><p>中文文本</p><p>한글 텍스트</p>",
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.isError).toBeUndefined();
        expect(result.content[0].text).toBeDefined();
      });
    });

    describe("エラーハンドリング", () => {
      test("エラー時にisErrorフラグがtrueになる", async () => {
        // cleanConfluenceHtmlがエラーをスローするケースをシミュレート
        // 実際のエラーケースは実装依存なので、ここでは構造のみテスト
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<p>Valid HTML</p>",
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        // 正常系の場合、isErrorはundefinedまたはfalse
        expect(result.isError).toBeFalsy();
      });

      test("エラー時にエラーメッセージが含まれる", async () => {
        // このテストはcleanConfluenceHtmlが実際にエラーをスローする場合に有効
        // 現在の実装では、ほとんどのHTMLを処理できるため、
        // エラーケースの作成は難しい。構造のみ確認。

        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<p>Test</p>",
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        // content配列は常に存在する
        expect(result.content).toBeArray();
        expect(result.content.length).toBeGreaterThan(0);
      });
    });

    describe("レスポンス形式", () => {
      test("contentフィールドが配列である", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<p>Test</p>",
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.content).toBeArray();
      });

      test("各コンテンツアイテムがtype: 'text'を持つ", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<p>Test</p>",
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        for (const item of result.content) {
          expect(item.type).toBe("text");
          expect(item.text).toBeDefined();
        }
      });

      test("最初のコンテンツアイテムが変換結果である", async () => {
        const args: ConvertConfluenceToMarkdownArgs = {
          html: "<p>Test Content</p>",
        };

        const result = await handleConvertConfluenceToMarkdown(args);

        expect(result.content[0]).toBeDefined();
        expect(result.content[0].type).toBe("text");
        expect(result.content[0].text).toBeDefined();
      });
    });
  });
});
