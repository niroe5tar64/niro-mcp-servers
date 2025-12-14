/**
 * Stdio Transport
 *
 * MCPサーバーを標準入出力経由で起動するためのトランスポート層。
 * Claude Desktopなどのローカルクライアントから使用されます。
 */

import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

/**
 * Stdio トランスポートでサーバーを起動
 *
 * @param server - MCPサーバーインスタンス
 */
export async function startStdioTransport(server: Server): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Confluence-MD MCP Server running on stdio");
}
