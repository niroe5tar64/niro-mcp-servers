#!/usr/bin/env bun

/**
 * Confluence-MD MCP Server
 *
 * Converts Confluence HTML content to clean Markdown optimized for LLM consumption.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { cleanConfluenceHtml, calculateTokenReduction } from "@niro-mcp/confluence-cleaner";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

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
 * Start the server with stdio transport
 */
async function startStdio() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Confluence-MD MCP Server running on stdio");
}

/**
 * Start the server with HTTP transport
 */
async function startHttp() {
  const PORT = parseInt(process.env.PORT || "3001");
  const HOST = process.env.HOST || "0.0.0.0";

  // Store active transports by session
  const transports = new Map<string, StreamableHTTPServerTransport>();

  // Create HTTP server using Node.js http module
  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);

    // Health check endpoint
    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", server: "confluence-md" }));
      return;
    }

    // MCP endpoint
    if (url.pathname === "/mcp") {
      try {
        // Parse body for POST requests
        let parsedBody;
        if (req.method === "POST") {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = Buffer.concat(chunks).toString();
          try {
            parsedBody = JSON.parse(body);
          } catch (error) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid JSON" }));
            return;
          }
        }

        // Get or create transport for this session
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        let transport = sessionId ? transports.get(sessionId) : undefined;

        if (!transport) {
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => {
              console.error(`Session initialized: ${id}`);
              // Store the transport with the session ID
              transports.set(id, transport!);
            },
            onsessionclosed: (id) => {
              console.error(`Session closed: ${id}`);
              transports.delete(id);
            },
          });
          await server.connect(transport);
        }

        // Handle the request
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

    // 404 for unknown endpoints
    res.writeHead(404);
    res.end("Not Found");
  });

  httpServer.listen(PORT, HOST, () => {
    console.error(`Confluence-MD MCP Server running on http://${HOST}:${PORT}`);
    console.error(`Health check: http://${HOST}:${PORT}/health`);
    console.error(`MCP endpoint: http://${HOST}:${PORT}/mcp`);
  });
}

/**
 * Main entry point
 */
async function main() {
  const transportMode = process.env.TRANSPORT_MODE || "stdio";

  if (transportMode === "http") {
    await startHttp();
  } else {
    await startStdio();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
