#!/usr/bin/env bun

/**
 * Confluence-MD MCP Server
 *
 * Converts Confluence HTML content to clean Markdown optimized for LLM consumption.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { cleanConfluenceHtml, calculateTokenReduction } from "@niro-mcp/confluence-cleaner";

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: "confluence-md",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
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
      },
    ],
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "convert_confluence_to_markdown") {
    const { html, removeMetadata = true, expandMacros = true, convertTables = true } = request.params.arguments as {
      html: string;
      removeMetadata?: boolean;
      expandMacros?: boolean;
      convertTables?: boolean;
    };

    try {
      const markdown = cleanConfluenceHtml(html, {
        removeMetadata,
        expandMacros,
        convertTables,
      });

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

  throw new Error(`Unknown tool: ${request.params.name}`);
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Confluence-MD MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
