/**
 * Confluence API Client - Unit Tests
 *
 * APIクライアントの単体テスト。
 */

import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import {
  ConfluenceApiClient,
  ConfluenceApiError,
} from "./confluence-api.js";

describe("ConfluenceApiClient", () => {
  describe("コンストラクタ", () => {
    test("正常な設定でインスタンスを作成できる", () => {
      const client = new ConfluenceApiClient({
        baseUrl: "https://confluence.example.com",
        username: "testuser",
        password: "testpass",
      });

      expect(client).toBeInstanceOf(ConfluenceApiClient);
    });

    test("APIトークンでインスタンスを作成できる", () => {
      const client = new ConfluenceApiClient({
        baseUrl: "https://confluence.example.com",
        username: "testuser",
        apiToken: "testtoken",
      });

      expect(client).toBeInstanceOf(ConfluenceApiClient);
    });

    test("認証情報が両方未設定の場合、エラーをスロー", () => {
      expect(() => {
        new ConfluenceApiClient({
          baseUrl: "https://confluence.example.com",
          username: "testuser",
        });
      }).toThrow("Either CONFLUENCE_PASSWORD or CONFLUENCE_API_TOKEN");
    });

    test("カスタムタイムアウトを設定できる", () => {
      const client = new ConfluenceApiClient({
        baseUrl: "https://confluence.example.com",
        username: "testuser",
        password: "testpass",
        timeout: 60000,
      });

      expect(client).toBeInstanceOf(ConfluenceApiClient);
    });

    test("baseUrlの末尾スラッシュを削除する", () => {
      const client = new ConfluenceApiClient({
        baseUrl: "https://confluence.example.com/",
        username: "testuser",
        password: "testpass",
      });

      expect(client).toBeInstanceOf(ConfluenceApiClient);
    });
  });

  describe("fromEnvironment", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test("環境変数からインスタンスを作成できる", () => {
      process.env.CONFLUENCE_BASE_URL = "https://confluence.example.com";
      process.env.CONFLUENCE_USERNAME = "testuser";
      process.env.CONFLUENCE_PASSWORD = "testpass";

      const client = ConfluenceApiClient.fromEnvironment();

      expect(client).toBeInstanceOf(ConfluenceApiClient);
    });

    test("CONFLUENCE_BASE_URLが未設定の場合、エラーをスロー", () => {
      delete process.env.CONFLUENCE_BASE_URL;
      process.env.CONFLUENCE_USERNAME = "testuser";
      process.env.CONFLUENCE_PASSWORD = "testpass";

      expect(() => {
        ConfluenceApiClient.fromEnvironment();
      }).toThrow("CONFLUENCE_BASE_URL");
    });

    test("CONFLUENCE_USERNAMEが未設定の場合、エラーをスロー", () => {
      process.env.CONFLUENCE_BASE_URL = "https://confluence.example.com";
      delete process.env.CONFLUENCE_USERNAME;
      process.env.CONFLUENCE_PASSWORD = "testpass";

      expect(() => {
        ConfluenceApiClient.fromEnvironment();
      }).toThrow("CONFLUENCE_USERNAME");
    });

    test("CONFLUENCE_TIMEOUTを設定できる", () => {
      process.env.CONFLUENCE_BASE_URL = "https://confluence.example.com";
      process.env.CONFLUENCE_USERNAME = "testuser";
      process.env.CONFLUENCE_PASSWORD = "testpass";
      process.env.CONFLUENCE_TIMEOUT = "60000";

      const client = ConfluenceApiClient.fromEnvironment();

      expect(client).toBeInstanceOf(ConfluenceApiClient);
    });
  });

  describe("ConfluenceApiError", () => {
    test("エラーメッセージとステータスコードを含む", () => {
      const error = new ConfluenceApiError("Test error", 404);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ConfluenceApiError);
      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe("ConfluenceApiError");
    });

    test("レスポンス情報を含む", () => {
      const response = { error: "Not found" };
      const error = new ConfluenceApiError("Test error", 404, response);

      expect(error.response).toBe(response);
    });
  });
});

