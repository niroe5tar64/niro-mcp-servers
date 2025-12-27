/**
 * MCP Server Configuration
 *
 * MCPサーバーのコア設定とリクエストハンドラーの登録を行います。
 * このファイルがMCPプロトコルのビジネスロジックの中心です。
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  type GetPageMarkdownArgs,
  getPageMarkdownTool,
  handleGetPageMarkdown,
} from "./tools/get-page-markdown.js";
import {
  type GetSpaceTreeArgs,
  getSpaceTreeTool,
  handleGetSpaceTree,
} from "./tools/get-space-tree.js";

/**
 * MCPサーバーを作成・設定
 *
 * サーバーのメタデータを定義し、利用可能なツールとそのハンドラーを登録します。
 *
 * @returns 設定済みのMCPサーバーインスタンス
 */
export function createMcpServer(): Server {
  // サーバーインスタンスを作成
  // name: サーバーの識別子
  // version: サーバーのバージョン
  // capabilities: サーバーが提供する機能（ここではtoolsのみ）
  const server = new Server(
    {
      name: "confluence-content",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  /**
   * tools/list リクエストハンドラー
   *
   * クライアントが利用可能なツールの一覧を取得するために使用されます。
   * 各ツールの名前、説明、入力スキーマが返されます。
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [getPageMarkdownTool, getSpaceTreeTool],
    };
  });

  /**
   * tools/call リクエストハンドラー
   *
   * クライアントがツールを実行するために使用されます。
   * ツール名に基づいて適切なハンドラーを呼び出します。
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get_confluence_page_markdown") {
      return handleGetPageMarkdown(
        request.params.arguments as unknown as GetPageMarkdownArgs,
      );
    }

    if (request.params.name === "get_space_tree") {
      return handleGetSpaceTree(
        request.params.arguments as unknown as GetSpaceTreeArgs,
      );
    }

    // 未知のツール名の場合はエラーをスロー
    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  return server;
}
