/**
 * Get Confluence Page Markdown Tool
 *
 * ConfluenceページをMarkdown形式で取得するMCPツール。
 * HTMLビューを取得し、クリーンアップしたMarkdownに変換します。
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { cleanConfluenceHtml } from "@niro-mcp/confluence-cleaner";
import {
  ConfluenceApiClient,
  ConfluenceApiError,
} from "../lib/confluence-api.js";

/**
 * ツール定義
 * MCPクライアントに提供されるツールのメタデータ
 */
export const getPageMarkdownTool: Tool = {
  name: "get_confluence_page_markdown",
  description:
    "Get Confluence page content in Markdown format. Returns page information and cleaned Markdown content converted from rendered HTML.",
  inputSchema: {
    type: "object",
    properties: {
      pageId: {
        type: "string",
        description: "Confluence page ID",
      },
    },
    required: ["pageId"],
  },
};

/**
 * ツール引数の型定義
 */
export interface GetPageMarkdownArgs {
  pageId: string;
}

/**
 * ツールハンドラー
 * ConfluenceページのHTMLビュー形式を取得してMarkdownに変換します
 *
 * @param args - ツールの引数
 * @returns ページ情報とクリーンアップされたMarkdownコンテンツ
 */
export async function handleGetPageMarkdown(
  args: GetPageMarkdownArgs,
): Promise<{
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}> {
  // 必須パラメータのバリデーション
  if (typeof args.pageId !== "string" || args.pageId.trim() === "") {
    return {
      content: [
        {
          type: "text",
          text: "Error: 'pageId' parameter is required and must be a non-empty string",
        },
      ],
      isError: true,
    };
  }

  try {
    // Confluence API クライアントを作成
    const client = ConfluenceApiClient.fromEnvironment();

    // ページのHTMLビュー形式を取得
    const result = await client.getPageView(args.pageId.trim());

    // HTMLをMarkdownに変換
    const markdown = cleanConfluenceHtml(result.html, {
      removeMetadata: true,
      expandMacros: true,
      convertTables: true,
    });

    // レスポンスオブジェクトを作成
    const response = {
      pageInfo: result.pageInfo,
      markdown,
    };

    // レスポンスサイズと形式をログ出力
    const htmlSize = result.html.length;
    const markdownSize = markdown.length;
    const jsonString = JSON.stringify(response, null, 2);
    const responseSize = jsonString.length;
    const responseSizeKB = (responseSize / 1024).toFixed(2);
    const responseSizeMB = (responseSize / (1024 * 1024)).toFixed(2);
    const reduction = (((htmlSize - markdownSize) / htmlSize) * 100).toFixed(2);

    console.error(
      `[get_confluence_page_markdown] Page ID: ${args.pageId.trim()}`,
    );
    console.error(
      `[get_confluence_page_markdown] HTML size: ${htmlSize} bytes (${(htmlSize / 1024).toFixed(2)} KB)`,
    );
    console.error(
      `[get_confluence_page_markdown] Markdown size: ${markdownSize} bytes (${(markdownSize / 1024).toFixed(2)} KB)`,
    );
    console.error(
      `[get_confluence_page_markdown] Size reduction: ${reduction}%`,
    );
    console.error(
      `[get_confluence_page_markdown] Response size: ${responseSize} bytes (${responseSizeKB} KB, ${responseSizeMB} MB)`,
    );
    console.error(
      `[get_confluence_page_markdown] Response format: content array with ${1} item(s)`,
    );
    console.error("[get_confluence_page_markdown] Content type: text");
    console.error(
      `[get_confluence_page_markdown] Content text length: ${jsonString.length} bytes`,
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
        errorMessage = `Page not found: Page ID "${args.pageId}" does not exist or you don't have access to it.`;
      } else if (error.statusCode === 401) {
        errorMessage =
          "Authentication failed: Please check your CONFLUENCE_USERNAME and CONFLUENCE_PASSWORD (or CONFLUENCE_API_TOKEN) environment variables.";
      } else if (error.statusCode === 403) {
        errorMessage =
          "Access forbidden: You don't have permission to access this page.";
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
          text: `Error getting Confluence page view: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
}
