#!/bin/bash

# Test script for HTTP/SSE transport mode
# Usage: ./test-http.sh [host:port]

HOST_PORT="${1:-localhost:3001}"
BASE_URL="http://${HOST_PORT}"

echo "Testing Confluence-MD MCP Server at ${BASE_URL}"
echo "================================================"

# Test 1: Health check
echo -e "\n[1] Health Check"
echo "GET ${BASE_URL}/health"
curl -s "${BASE_URL}/health"
echo ""

# Test 2: Initialize MCP session
echo -e "\n[2] Initialize MCP Session"
echo "POST ${BASE_URL}/mcp (initialize)"
INIT_RESPONSE=$(curl -s -i -X POST "${BASE_URL}/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }')

# Extract session ID from response headers
SESSION_ID=$(echo "$INIT_RESPONSE" | grep -i "mcp-session-id" | cut -d' ' -f2 | tr -d '\r\n')
echo "Session ID: ${SESSION_ID}"

# Extract initialize response body (skip headers)
echo "$INIT_RESPONSE" | sed -n '/^event: message/,$p'
echo ""

# Test 3: List tools (MCP protocol)
echo -e "\n[3] List Tools (MCP Protocol)"
echo "POST ${BASE_URL}/mcp (tools/list)"
echo "Using session: ${SESSION_ID}"
curl -s -X POST "${BASE_URL}/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: ${SESSION_ID}" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 2
  }'
echo ""

# Test 4: Call convert_confluence_to_markdown tool
echo -e "\n[4] Convert Confluence HTML to Markdown"
echo "POST ${BASE_URL}/mcp (tools/call)"
echo "Using session: ${SESSION_ID}"
curl -s -X POST "${BASE_URL}/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: ${SESSION_ID}" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "convert_confluence_to_markdown",
      "arguments": {
        "html": "<h1>Test Header</h1><p>This is a <strong>test</strong> paragraph.</p>",
        "removeMetadata": true,
        "expandMacros": true,
        "convertTables": true
      }
    },
    "id": 3
  }'
echo ""

echo -e "\n================================================"
echo "Test complete!"
