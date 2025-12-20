/**
 * HTTP Transport
 *
 * MCPサーバーをHTTP経由で起動するためのトランスポート層。
 * リモートクライアントからアクセス可能にし、セッション管理を行います。
 */

import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

/**
 * HTTP トランスポートでサーバーを起動
 *
 * @param server - MCPサーバーインスタンス
 * @param serverName - サーバー名（ヘルスチェックとログに使用）
 * @param port - リッスンするポート番号
 * @param host - リッスンするホスト（例: "0.0.0.0"）
 */
export async function startHttpTransport(
  server: Server,
  serverName: string,
  port: number,
  host: string,
): Promise<void> {
  // セッションIDごとにトランスポートを保存
  // 各クライアントは独立したセッションを持ち、状態が分離されます
  const transports = new Map<string, StreamableHTTPServerTransport>();

  // Node.js の http モジュールを使用してHTTPサーバーを作成
  const httpServer = createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end("Bad Request");
      return;
    }
    const url = new URL(req.url, `http://${req.headers.host}`);

    // ヘルスチェックエンドポイント
    // サーバーが正常に動作しているか確認するために使用
    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", server: serverName }));
      return;
    }

    // MCPエンドポイント
    // 実際のMCPプロトコル通信を処理
    if (url.pathname === "/mcp") {
      try {
        // POSTリクエストのボディをパース
        let parsedBody: unknown;
        if (req.method === "POST") {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = Buffer.concat(chunks).toString();
          try {
            parsedBody = JSON.parse(body);
          } catch (_error) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON" }));
            return;
          }
        }

        // セッションIDを取得、またはトランスポートを新規作成
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        let transport = sessionId ? transports.get(sessionId) : undefined;

        if (!transport) {
          // 新しいトランスポートを作成
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => {
              console.error(`Session initialized: ${id}`);
              // トランスポートをセッションIDで保存
              if (transport) {
                transports.set(id, transport);
              }
            },
            onsessionclosed: (id) => {
              console.error(`Session closed: ${id}`);
              transports.delete(id);
            },
          });
          // サーバーとトランスポートを接続
          await server.connect(transport);
        }

        // MCPリクエストを処理
        await transport.handleRequest(req, res, parsedBody);
      } catch (error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      }
      return;
    }

    // 未知のエンドポイントには404を返す
    res.writeHead(404);
    res.end("Not Found");
  });

  // サーバーを起動
  httpServer.listen(port, host, () => {
    console.error(`${serverName} MCP Server running on http://${host}:${port}`);
    console.error(`Health check: http://${host}:${port}/health`);
    console.error(`MCP endpoint: http://${host}:${port}/mcp`);
  });
}
