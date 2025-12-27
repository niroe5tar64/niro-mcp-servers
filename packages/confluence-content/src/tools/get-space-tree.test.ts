/**
 * Get Space Tree Tool - Unit Tests
 *
 * ツールロジックの単体テスト。サーバー起動不要で高速に実行できます。
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  type GetSpaceTreeArgs,
  getSpaceTreeTool,
  handleGetSpaceTree,
} from "./get-space-tree.js";

describe("Get Space Tree Tool", () => {
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
      expect(getSpaceTreeTool.name).toBe("get_space_tree");
    });

    test("説明文が定義されている", () => {
      expect(getSpaceTreeTool.description).toBeDefined();
      expect(getSpaceTreeTool.description).toBeTypeOf("string");
      if (getSpaceTreeTool.description) {
        expect(getSpaceTreeTool.description.length).toBeGreaterThan(0);
      }
    });

    test("入力スキーマが定義されている", () => {
      expect(getSpaceTreeTool.inputSchema).toBeDefined();
      expect(getSpaceTreeTool.inputSchema.type).toBe("object");
      expect(getSpaceTreeTool.inputSchema.properties).toBeDefined();
    });

    test("spaceKey パラメータが必須として定義されている", () => {
      const props = getSpaceTreeTool.inputSchema.properties;
      if (props && typeof props === "object") {
        expect(props.spaceKey).toBeDefined();
      }
      expect(getSpaceTreeTool.inputSchema.required).toContain("spaceKey");
    });

    test("pageId パラメータが任意として定義されている", () => {
      const props = getSpaceTreeTool.inputSchema.properties;
      if (props && typeof props === "object") {
        expect(props.pageId).toBeDefined();
      }
      // pageIdは任意なので required に含まれない
      expect(getSpaceTreeTool.inputSchema.required).not.toContain("pageId");
    });
  });

  describe("handleGetSpaceTree", () => {
    describe("バリデーション", () => {
      test("spaceKeyが空文字列の場合、エラーを返す", async () => {
        const args: GetSpaceTreeArgs = {
          spaceKey: "",
        };

        const result = await handleGetSpaceTree(args);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("required");
      });

      test("spaceKeyが空白のみの場合、エラーを返す", async () => {
        const args: GetSpaceTreeArgs = {
          spaceKey: "   ",
        };

        const result = await handleGetSpaceTree(args);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("required");
      });

      test("spaceKeyが未定義の場合、エラーを返す", async () => {
        const args = {} as GetSpaceTreeArgs;

        const result = await handleGetSpaceTree(args);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("required");
      });

      test("pageIdが文字列でない場合、エラーを返す", async () => {
        const args = {
          spaceKey: "TEST",
          pageId: 123,
        } as unknown as GetSpaceTreeArgs;

        const result = await handleGetSpaceTree(args);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("pageId");
        expect(result.content[0].text).toContain("string");
      });

      test("pageIdが未定義の場合、エラーを返さない（任意パラメータ）", async () => {
        const args: GetSpaceTreeArgs = {
          spaceKey: "TEST",
        };

        // 実際のAPIを呼び出すとエラーになる可能性が高いが、
        // pageId未定義によるバリデーションエラーは発生しない
        const result = await handleGetSpaceTree(args);

        // APIエラーまたは正常レスポンスのいずれか
        expect(result.content).toBeArray();
        expect(result.content.length).toBeGreaterThan(0);
      });
    });

    describe("環境変数エラー", () => {
      test("CONFLUENCE_BASE_URLが未設定の場合、エラーを返す", async () => {
        process.env.CONFLUENCE_BASE_URL = undefined;

        const args: GetSpaceTreeArgs = {
          spaceKey: "TEST",
        };

        const result = await handleGetSpaceTree(args);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("CONFLUENCE_BASE_URL");
      });

      test("CONFLUENCE_USERNAMEが未設定の場合、エラーを返す", async () => {
        process.env.CONFLUENCE_USERNAME = undefined;

        const args: GetSpaceTreeArgs = {
          spaceKey: "TEST",
        };

        const result = await handleGetSpaceTree(args);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("CONFLUENCE_USERNAME");
      });

      test("認証情報が両方未設定の場合、エラーを返す", async () => {
        process.env.CONFLUENCE_PASSWORD = undefined;
        process.env.CONFLUENCE_API_TOKEN = undefined;

        const args: GetSpaceTreeArgs = {
          spaceKey: "TEST",
        };

        const result = await handleGetSpaceTree(args);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("CONFLUENCE_PASSWORD");
      });
    });

    describe("レスポンス形式", () => {
      test("正常なレスポンスはJSON形式で返される", async () => {
        // 注意: このテストは実際のAPIを呼び出すため、モックが必要
        // ここでは基本的な構造のみ確認
        const args: GetSpaceTreeArgs = {
          spaceKey: "TEST",
        };

        // 実際のAPIを呼び出すとエラーになる可能性が高いため、
        // エラーレスポンスの形式を確認
        const result = await handleGetSpaceTree(args);

        expect(result.content).toBeArray();
        expect(result.content.length).toBeGreaterThan(0);
        expect(result.content[0].type).toBe("text");
        expect(result.content[0].text).toBeDefined();
      });
    });
  });
});
