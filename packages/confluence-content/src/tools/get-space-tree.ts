/**
 * Get Space Tree Tool
 *
 * Confluenceスペース配下のページツリーを本文なしで取得するMCPツール。
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  ConfluenceApiClient,
  ConfluenceApiError,
} from "../lib/confluence-api.js";
import { buildPageTree, extractSubTree } from "../lib/tree-builder.js";

/**
 * ツール定義
 * MCPクライアントに提供されるツールのメタデータ
 */
export const getSpaceTreeTool: Tool = {
  name: "get_space_tree",
  description:
    "Get Confluence space page tree structure without page content. Returns page hierarchy (id, title, excerpt, children) for the entire space or a specific subtree. Use this to find page IDs before calling get_confluence_page_markdown.",
  inputSchema: {
    type: "object",
    properties: {
      spaceKey: {
        type: "string",
        description: "Confluence space key (e.g., 'TEAM', 'DOCS')",
      },
      pageId: {
        type: "string",
        description:
          "Optional: Specific page ID to get subtree. If omitted, returns entire space tree.",
      },
    },
    required: ["spaceKey"],
  },
};

/**
 * ツール引数の型定義
 */
export interface GetSpaceTreeArgs {
  spaceKey: string;
  pageId?: string;
}

/**
 * レスポンスの型定義
 */
export interface GetSpaceTreeResponse {
  spaceKey: string;
  spaceName?: string;
  rootPageId?: string;
  rootPageTitle?: string;
  pages: Array<{
    id: string;
    title: string;
    description?: string;
    excerpt?: string;
    children: unknown[];
  }>;
}

/**
 * ツールハンドラー
 * Confluenceスペース配下のページツリーを取得します
 *
 * @param args - ツールの引数
 * @returns ページツリー構造
 */
export async function handleGetSpaceTree(args: GetSpaceTreeArgs): Promise<{
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}> {
  // 必須パラメータのバリデーション
  if (typeof args.spaceKey !== "string" || args.spaceKey.trim() === "") {
    return {
      content: [
        {
          type: "text",
          text: "Error: 'spaceKey' parameter is required and must be a non-empty string",
        },
      ],
      isError: true,
    };
  }

  // pageIdのバリデーション（任意パラメータ）
  if (args.pageId !== undefined && typeof args.pageId !== "string") {
    return {
      content: [
        {
          type: "text",
          text: "Error: 'pageId' parameter must be a string if provided",
        },
      ],
      isError: true,
    };
  }

  try {
    // Confluence API クライアントを作成
    const client = ConfluenceApiClient.fromEnvironment();

    // CQLクエリを構築
    let cql: string;
    if (args.pageId) {
      // 特定ページ配下のみ取得
      cql = `ancestor = ${args.pageId.trim()} AND type = page`;
    } else {
      // スペース全体を取得
      cql = `space = "${args.spaceKey.trim()}" AND type = page`;
    }

    // CQL検索を実行（ancestors展開）
    console.error(`[get_space_tree] CQL query: ${cql}`);
    const searchResults = await client.searchAllContentByCql(
      cql,
      "ancestors,space",
    );

    console.error(
      `[get_space_tree] Found ${searchResults.length} pages in total`,
    );

    // ツリーを構築
    const tree = buildPageTree(searchResults);

    // レスポンスを構築
    let response: GetSpaceTreeResponse;

    if (args.pageId) {
      // pageId指定時: サブツリーを抽出
      const subTree = extractSubTree(tree, args.pageId.trim());

      if (!subTree) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Page not found in search results. Page ID "${args.pageId}" may not exist in space "${args.spaceKey}" or you may not have access to it.`,
            },
          ],
          isError: true,
        };
      }

      // スペース情報を取得（最初の検索結果から）
      const firstResult = searchResults[0];
      const spaceName = firstResult?.content.space?.name;

      response = {
        spaceKey: args.spaceKey.trim(),
        spaceName,
        rootPageId: subTree.id,
        rootPageTitle: subTree.title,
        pages: subTree.children,
      };
    } else {
      // spaceKeyのみ: スペース全体のツリー
      const firstResult = searchResults[0];
      const spaceName = firstResult?.content.space?.name;

      response = {
        spaceKey: args.spaceKey.trim(),
        spaceName,
        pages: tree,
      };
    }

    // レスポンスサイズをログ出力
    const jsonString = JSON.stringify(response, null, 2);
    const responseSize = jsonString.length;
    const responseSizeKB = (responseSize / 1024).toFixed(2);

    console.error(`[get_space_tree] Space: ${args.spaceKey.trim()}`);
    console.error(
      `[get_space_tree] Total pages found: ${searchResults.length}`,
    );
    console.error(`[get_space_tree] Root nodes: ${tree.length}`);
    console.error(
      `[get_space_tree] Response size: ${responseSize} bytes (${responseSizeKB} KB)`,
    );

    // JSON形式でレスポンスを返す
    return {
      content: [
        {
          type: "text",
          text: jsonString,
        },
      ],
    };
  } catch (error) {
    // エラーハンドリング
    if (error instanceof ConfluenceApiError) {
      let errorMessage = `Confluence API Error: ${error.message}`;
      if (error.statusCode) {
        errorMessage += ` (HTTP ${error.statusCode})`;
      }
      if (error.statusCode === 404) {
        errorMessage = `Space not found: Space key "${args.spaceKey}" does not exist or you don't have access to it.`;
      } else if (error.statusCode === 401) {
        errorMessage =
          "Authentication failed: Please check your CONFLUENCE_USERNAME and CONFLUENCE_PASSWORD (or CONFLUENCE_API_TOKEN) environment variables.";
      } else if (error.statusCode === 403) {
        errorMessage = `Access forbidden: You don't have permission to access space "${args.spaceKey}".`;
      } else if (error.statusCode === 408) {
        errorMessage =
          "Request timeout: The API request took too long to complete.";
      }

      return {
        content: [
          {
            type: "text",
            text: errorMessage,
          },
        ],
        isError: true,
      };
    }

    // その他のエラー（環境変数エラーなど）
    return {
      content: [
        {
          type: "text",
          text: `Error getting space tree: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
}
