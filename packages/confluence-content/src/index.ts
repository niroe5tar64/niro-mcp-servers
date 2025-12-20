#!/usr/bin/env bun

/**
 * Confluence-Content MCP Server - Entry Point
 *
 * Retrieves Confluence page content in HTML view format (rendered HTML).
 *
 * このファイルはエントリーポイントです。
 * 環境変数に基づいて適切なトランスポート（stdio または HTTP）を選択し、
 * MCPサーバーを起動します。
 */

import {
  startHttpTransport,
  startStdioTransport,
} from "@niro-mcp/mcp-server-core/transports";
import { createMcpServer } from "./server.js";

/**
 * メインエントリーポイント
 *
 * 環境変数 TRANSPORT_MODE によって起動方法を切り替えます：
 * - "http": HTTPサーバーとして起動（リモートアクセス可能）
 * - それ以外: stdioモードで起動（ローカルクライアント用）
 */
async function main() {
  // MCPサーバーインスタンスを作成
  const server = createMcpServer();

  // トランスポートモードを環境変数から取得
  const transportMode = process.env.TRANSPORT_MODE || "stdio";

  if (transportMode === "http") {
    // HTTPモード: リモートクライアントからアクセス可能
    const port = Number.parseInt(process.env.PORT || "50302", 10);
    const host = process.env.HOST || "0.0.0.0";
    await startHttpTransport(server, "Confluence-Content", port, host);
  } else {
    // Stdioモード: Claude Desktopなどのローカルクライアント用
    await startStdioTransport(server, "Confluence-Content");
  }
}

// エラーハンドリング付きでmain関数を実行
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
