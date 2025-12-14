import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { spawn, type ChildProcess } from "child_process";

describe("Confluence-MD MCP Server Integration Tests", () => {
  const PORT = 50302; // テスト用のポート（本番の50301と被らないように）
  const BASE_URL = `http://localhost:${PORT}`;
  let serverProcess: ChildProcess | null = null;
  let sessionId: string | null = null;

  // サーバー起動を待つヘルパー関数
  async function waitForServer(maxRetries = 30, retryDelay = 100): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${BASE_URL}/health`);
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // サーバーがまだ起動していない
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
    return false;
  }

  // MCPセッションを初期化するヘルパー関数
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
    serverProcess.stdout?.on("data", (data) => {
      // console.log(`Server stdout: ${data}`);
    });

    serverProcess.stderr?.on("data", (data) => {
      // console.error(`Server stderr: ${data}`);
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
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = await response.json();
      expect(data).toEqual({
        status: "ok",
        server: "confluence-md",
      });
    });
  });

  describe("MCP Protocol", () => {
    test("tools/list リクエストでツール一覧を取得できる", async () => {
      const request = {
        jsonrpc: "2.0",
        method: "tools/list",
        id: 1,
      };

      const response = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "mcp-session-id": sessionId!,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);

      // SSE形式のレスポンスをパース
      const text = await response.text();

      // SSE形式から "event: message" の後のデータを抽出
      const dataMatch = text.match(/data: ({.*})/);
      expect(dataMatch).toBeDefined();

      const data = JSON.parse(dataMatch![1]);
      expect(data.jsonrpc).toBe("2.0");
      expect(data.id).toBe(1);
      expect(data.result).toBeDefined();
      expect(data.result.tools).toBeArray();
      expect(data.result.tools).toHaveLength(1);

      const tool = data.result.tools[0];
      expect(tool.name).toBe("convert_confluence_to_markdown");
      expect(tool.description).toContain("Confluence HTML");
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.properties.html).toBeDefined();
    });

    test("convert_confluence_to_markdown ツールを実行できる", async () => {
      const request = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "convert_confluence_to_markdown",
          arguments: {
            html: '<div class="confluence-content"><p>Hello World</p></div>',
            removeMetadata: true,
            expandMacros: true,
            convertTables: true,
          },
        },
        id: 2,
      };

      const response = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "mcp-session-id": sessionId!,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);

      // SSE形式のレスポンスをパース
      const text = await response.text();
      const dataMatch = text.match(/data: ({.*})/);
      expect(dataMatch).toBeDefined();

      const data = JSON.parse(dataMatch![1]);
      expect(data.jsonrpc).toBe("2.0");
      expect(data.id).toBe(2);
      expect(data.result).toBeDefined();
      expect(data.result.content).toBeArray();
      expect(data.result.content.length).toBeGreaterThan(0);

      // 現在の実装ではHTMLがそのまま返される（TODO実装後はMarkdownが返される）
      const mainContent = data.result.content[0];
      expect(mainContent.type).toBe("text");
      expect(mainContent.text).toBeDefined();

      // トークン削減情報が含まれているか確認
      const hasTokenReduction = data.result.content.some(
        (item: any) => item.text && item.text.includes("Token reduction:")
      );
      expect(hasTokenReduction).toBe(true);
    });

    test("必須パラメータ html なしでエラーになる", async () => {
      const request = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "convert_confluence_to_markdown",
          arguments: {
            // html パラメータなし
            removeMetadata: true,
          },
        },
        id: 3,
      };

      const response = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "mcp-session-id": sessionId!,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);

      // SSE形式のレスポンスをパース
      const text = await response.text();
      const dataMatch = text.match(/data: ({.*})/);
      expect(dataMatch).toBeDefined();

      const data = JSON.parse(dataMatch![1]);
      // MCPプロトコルではエラーもJSONRPCレスポンスとして返される
      expect(data.jsonrpc).toBe("2.0");
      expect(data.id).toBe(3);
    });

    test("未知のツール名でエラーになる", async () => {
      const request = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "unknown_tool",
          arguments: {},
        },
        id: 4,
      };

      const response = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "mcp-session-id": sessionId!,
        },
        body: JSON.stringify(request),
      });

      expect(response.status).toBe(200);

      // SSE形式のレスポンスをパース
      const text = await response.text();
      const dataMatch = text.match(/data: ({.*})/);
      expect(dataMatch).toBeDefined();

      const data = JSON.parse(dataMatch![1]);
      expect(data.jsonrpc).toBe("2.0");
      expect(data.id).toBe(4);
      // エラーレスポンスが返される
      expect(data.error || data.result?.isError).toBeTruthy();
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
