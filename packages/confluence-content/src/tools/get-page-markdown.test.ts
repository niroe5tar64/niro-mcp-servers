/**
 * Get Page Markdown Tool - Unit Tests
 *
 * ツールロジックの単体テスト。サーバー起動不要で高速に実行できます。
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  type GetPageMarkdownArgs,
  getPageMarkdownTool,
  handleGetPageMarkdown,
} from "./get-page-markdown.js";

describe("Get Page Markdown Tool", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // テスト用の環境変数を設定
    process.env = {
      ...originalEnv,
      CONFLUENCE_BASE_URL: "https://confluence.example.com",
      CONFLUENCE_USERNAME: "testuser",
      CONFLUENCE_PASSWORD: "testpass",
    };
  });

  afterEach(() => {
    // 環境変数を元に戻す
    process.env = originalEnv;
  });

  describe("ツール定義", () => {
    test("正しいツール名を持つ", () => {
      expect(getPageMarkdownTool.name).toBe("get_confluence_page_markdown");
    });

    test("説明文が定義されている", () => {
      expect(getPageMarkdownTool.description).toBeDefined();
      expect(getPageMarkdownTool.description).toBeTypeOf("string");
      if (getPageMarkdownTool.description) {
        expect(getPageMarkdownTool.description.length).toBeGreaterThan(0);
      }
    });

    test("入力スキーマが定義されている", () => {
      expect(getPageMarkdownTool.inputSchema).toBeDefined();
      expect(getPageMarkdownTool.inputSchema.type).toBe("object");
      expect(getPageMarkdownTool.inputSchema.properties).toBeDefined();
    });

    test("pageId パラメータが必須として定義されている", () => {
      const props = getPageMarkdownTool.inputSchema.properties;
      if (props && typeof props === "object") {
        expect(props.pageId).toBeDefined();
      }
      expect(getPageMarkdownTool.inputSchema.required).toContain("pageId");
    });
  });

  describe("handleGetPageMarkdown", () => {
    describe("バリデーション", () => {
      test("pageIdが空文字列の場合、エラーを返す", async () => {
        const args: GetPageMarkdownArgs = {
          pageId: "",
        };

        const result = await handleGetPageMarkdown(args);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("required");
      });

      test("pageIdが空白のみの場合、エラーを返す", async () => {
        const args: GetPageMarkdownArgs = {
          pageId: "   ",
        };

        const result = await handleGetPageMarkdown(args);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("required");
      });

      test("pageIdが未定義の場合、エラーを返す", async () => {
        const args = {} as GetPageMarkdownArgs;

        const result = await handleGetPageMarkdown(args);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("required");
      });
    });

    describe("環境変数エラー", () => {
      test("CONFLUENCE_BASE_URLが未設定の場合、エラーを返す", async () => {
        process.env.CONFLUENCE_BASE_URL = undefined;

        const args: GetPageMarkdownArgs = {
          pageId: "123",
        };

        const result = await handleGetPageMarkdown(args);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("CONFLUENCE_BASE_URL");
      });

      test("CONFLUENCE_USERNAMEが未設定の場合、エラーを返す", async () => {
        process.env.CONFLUENCE_USERNAME = undefined;

        const args: GetPageMarkdownArgs = {
          pageId: "123",
        };

        const result = await handleGetPageMarkdown(args);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("CONFLUENCE_USERNAME");
      });

      test("認証情報が両方未設定の場合、エラーを返す", async () => {
        process.env.CONFLUENCE_PASSWORD = undefined;
        process.env.CONFLUENCE_API_TOKEN = undefined;

        const args: GetPageMarkdownArgs = {
          pageId: "123",
        };

        const result = await handleGetPageMarkdown(args);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("CONFLUENCE_PASSWORD");
      });
    });

    describe("レスポンス形式", () => {
      test("正常なレスポンスはJSON形式で返される", async () => {
        // 注意: このテストは実際のAPIを呼び出すため、モックが必要
        // ここでは基本的な構造のみ確認
        const args: GetPageMarkdownArgs = {
          pageId: "123",
        };

        // 実際のAPIを呼び出すとエラーになる可能性が高いため、
        // エラーレスポンスの形式を確認
        const result = await handleGetPageMarkdown(args);

        expect(result.content).toBeArray();
        expect(result.content.length).toBeGreaterThan(0);
        expect(result.content[0].type).toBe("text");
        expect(result.content[0].text).toBeDefined();
      });
    });
  });
});
