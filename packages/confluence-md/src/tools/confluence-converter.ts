/**
 * Confluence to Markdown Converter Tool
 *
 * このファイルは、Confluence HTMLをMarkdownに変換するMCPツールの定義と実装を含みます。
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  calculateTokenReduction,
  cleanConfluenceHtml,
} from "@niro-mcp/confluence-cleaner";

/**
 * ツール定義
 * MCPクライアントに提供されるツールのメタデータ
 */
export const confluenceConverterTool: Tool = {
  name: "convert_confluence_to_markdown",
  description:
    "Convert Confluence HTML content to clean Markdown. Removes HTML noise, expands macros, and optimizes for LLM consumption.",
  inputSchema: {
    type: "object",
    properties: {
      html: {
        type: "string",
        description: "Confluence HTML content to convert",
      },
      removeMetadata: {
        type: "boolean",
        description: "Remove Confluence-specific metadata and styling",
        default: true,
      },
      expandMacros: {
        type: "boolean",
        description: "Expand Confluence macros (info, warning, code, etc.)",
        default: true,
      },
      convertTables: {
        type: "boolean",
        description: "Convert tables to Markdown format",
        default: true,
      },
    },
    required: ["html"],
  },
};

/**
 * ツール引数の型定義
 */
export interface ConvertConfluenceToMarkdownArgs {
  html: string;
  removeMetadata?: boolean;
  expandMacros?: boolean;
  convertTables?: boolean;
}

/**
 * ツールハンドラー
 * Confluence HTMLをMarkdownに変換し、トークン削減率を計算します
 *
 * @param args - ツールの引数
 * @returns 変換されたMarkdownとトークン削減率
 */
export async function handleConvertConfluenceToMarkdown(
  args: ConvertConfluenceToMarkdownArgs,
) {
  const {
    html,
    removeMetadata = true,
    expandMacros = true,
    convertTables = true,
  } = args;

  // 必須パラメータのバリデーション
  if (typeof html !== "string") {
    return {
      content: [
        {
          type: "text",
          text: "Error: 'html' parameter is required and must be a string",
        },
      ],
      isError: true,
    };
  }

  try {
    // Confluence HTMLをクリーンなMarkdownに変換
    const markdown = cleanConfluenceHtml(html, {
      removeMetadata,
      expandMacros,
      convertTables,
    });

    // トークン削減率を計算
    const tokenReduction = calculateTokenReduction(html, markdown);

    return {
      content: [
        {
          type: "text",
          text: markdown,
        },
        {
          type: "text",
          text: `\n\n---\nToken reduction: ${tokenReduction.toFixed(1)}%`,
        },
      ],
    };
  } catch (error) {
    // エラーハンドリング
    return {
      content: [
        {
          type: "text",
          text: `Error converting Confluence HTML: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
