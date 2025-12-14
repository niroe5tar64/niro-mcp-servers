import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { type ChildProcess, spawn } from "node:child_process";

/**
 * Confluence-MD MCP Server Integration Tests
 *
 * HTTPサーバー全体のエンドツーエンド統合テスト。
 * 実際にサーバープロセスを起動し、HTTP経由でMCPプロトコルをテストします。
 */
describe("Confluence-MD MCP Server Integration Tests", () => {
  const PORT = 50302; // テスト用のポート（本番の50301と被らないように）
  const BASE_URL = `http://localhost:${PORT}`;
  let serverProcess: ChildProcess | null = null;
  let sessionId: string | null = null;

  // ========================================
  // ヘルパー関数
  // ========================================

  /**
   * サーバー起動を待つヘルパー関数
   */
  async function waitForServer(
    maxRetries = 30,
    retryDelay = 100,
  ): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${BASE_URL}/health`);
        if (response.ok) {
          return true;
        }
      } catch (_error) {
        // サーバーがまだ起動していない
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
    return false;
  }

  /**
   * MCPセッションを初期化するヘルパー関数
   */
  async function initializeMCPSession(): Promise<string> {
    const request = {
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "test-client",
          version: "1.0.0",
        },
      },
      id: 0,
    };

    const response = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize MCP session: ${response.status}`);
    }

    // セッションIDをヘッダーから取得
    const newSessionId = response.headers.get("mcp-session-id");
    if (!newSessionId) {
      throw new Error("No session ID returned from initialize");
    }

    return newSessionId;
  }

  /**
   * SSE形式のレスポンスをパースするヘルパー関数
   */
  async function parseSseResponse(
    response: Response,
  ): Promise<Record<string, unknown>> {
    expect(response.status).toBe(200);
    const text = await response.text();
    const dataMatch = text.match(/data: ({.*})/);
    expect(dataMatch).toBeDefined();
    const data = dataMatch?.[1];
    if (!data) throw new Error("Invalid SSE format");
    return JSON.parse(data);
  }

  /**
   * MCPリクエストを送信するヘルパー関数
   */
  async function sendMcpRequest(
    method: string,
    params: Record<string, unknown>,
    id: number,
  ): Promise<Record<string, unknown>> {
    const response = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "mcp-session-id": sessionId || "",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id,
      }),
    });

    return parseSseResponse(response);
  }

  beforeAll(async () => {
    // HTTPモードでサーバーを起動
    serverProcess = spawn("bun", ["run", "src/index.ts"], {
      cwd: "/workspace/packages/confluence-md",
      env: {
        ...process.env,
        TRANSPORT_MODE: "http",
        PORT: PORT.toString(),
        HOST: "127.0.0.1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    // サーバーのログを出力（デバッグ用）
    serverProcess.stdout?.on("data", (_data) => {
      // console.log(`Server stdout: ${_data}`);
    });

    serverProcess.stderr?.on("data", (_data) => {
      // console.error(`Server stderr: ${_data}`);
    });

    // サーバーの起動を待つ
    const isReady = await waitForServer();
    if (!isReady) {
      throw new Error("Server failed to start");
    }

    // MCPセッションを初期化
    sessionId = await initializeMCPSession();
  }, 10000); // タイムアウトを10秒に設定

  afterAll(() => {
    // サーバーを停止
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
  });

  describe("Health Check", () => {
    test("GET /health が正常に応答する", async () => {
      const response = await fetch(`${BASE_URL}/health`);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );

      const data = await response.json();
      expect(data).toEqual({
        status: "ok",
        server: "confluence-md",
      });
    });
  });

  describe("MCP Protocol", () => {
    test("tools/list リクエストでツール一覧を取得できる", async () => {
      const data = await sendMcpRequest("tools/list", {}, 1);

      expect(data.jsonrpc).toBe("2.0");
      expect(data.id).toBe(1);
      expect(data.result).toBeDefined();
      const typedData = data as {
        result?: { tools?: Array<Record<string, unknown>> };
      };
      expect(typedData.result?.tools).toBeArray();
      expect(typedData.result?.tools).toHaveLength(1);

      const tool = typedData.result?.tools?.[0];
      expect(tool).toBeDefined();
      expect((tool as Record<string, unknown>)?.name).toBe(
        "convert_confluence_to_markdown",
      );
      expect((tool as Record<string, unknown>)?.description).toContain(
        "Confluence HTML",
      );
      expect((tool as Record<string, unknown>)?.inputSchema).toBeDefined();
      expect(
        (
          (tool as Record<string, unknown>)?.inputSchema as Record<
            string,
            unknown
          >
        )?.properties,
      ).toBeDefined();
    });

    test("convert_confluence_to_markdown ツールを実行できる", async () => {
      const data = await sendMcpRequest(
        "tools/call",
        {
          name: "convert_confluence_to_markdown",
          arguments: {
            html: '<div class="confluence-content"><p>Hello World</p></div>',
            removeMetadata: true,
            expandMacros: true,
            convertTables: true,
          },
        },
        2,
      );

      expect(data.jsonrpc).toBe("2.0");
      expect(data.id).toBe(2);
      expect(data.result).toBeDefined();
      const typedData = data as {
        result?: { content?: Array<Record<string, unknown>> };
      };
      expect(typedData.result?.content).toBeArray();
      expect(typedData.result?.content?.length).toBeGreaterThan(0);

      // 変換結果が返される
      const mainContent = typedData.result?.content?.[0];
      expect(mainContent).toBeDefined();
      expect((mainContent as Record<string, unknown>)?.type).toBe("text");
      expect((mainContent as Record<string, unknown>)?.text).toBeDefined();

      // トークン削減情報が含まれているか確認
      const hasTokenReduction = typedData.result?.content?.some(
        (item: Record<string, unknown>) =>
          typeof item.text === "string" &&
          item.text.includes("Token reduction:"),
      );
      expect(hasTokenReduction).toBe(true);
    });

    test("必須パラメータ html なしでエラーになる", async () => {
      const data = await sendMcpRequest(
        "tools/call",
        {
          name: "convert_confluence_to_markdown",
          arguments: {
            // html パラメータなし
            removeMetadata: true,
          },
        },
        3,
      );

      // MCPプロトコルではエラーもJSONRPCレスポンスとして返される
      expect(data.jsonrpc).toBe("2.0");
      expect(data.id).toBe(3);
      // エラーの内容を確認（実装によってerrorまたはresult.isErrorが設定される）
      const typedData = data as {
        error?: unknown;
        result?: { isError?: unknown };
      };
      const hasError = typedData.error || typedData.result?.isError;
      expect(hasError).toBeTruthy();
    });

    test("未知のツール名でエラーになる", async () => {
      const data = await sendMcpRequest(
        "tools/call",
        {
          name: "unknown_tool",
          arguments: {},
        },
        4,
      );

      expect(data.jsonrpc).toBe("2.0");
      expect(data.id).toBe(4);
      // エラーレスポンスが返される
      const typedData = data as {
        error?: unknown;
        result?: { isError?: unknown };
      };
      const hasError = typedData.error || typedData.result?.isError;
      expect(hasError).toBeTruthy();
    });

    test("不正なJSONでエラーになる", async () => {
      const response = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("Invalid JSON");
    });
  });

  describe("Unknown Endpoints", () => {
    test("存在しないエンドポイントで 404 を返す", async () => {
      const response = await fetch(`${BASE_URL}/unknown`);
      expect(response.status).toBe(404);
    });
  });
});
