# Confluence-MD MCP Server

Confluence to Markdown MCP Server that converts Confluence HTML content to clean Markdown optimized for LLM consumption.

## Features

- **HTML Noise Removal**: Removes Confluence-specific metadata and styling
- **Macro Expansion**: Expands Confluence macros (info, warning, code, etc.)
- **Token Reduction**: Achieves ~50% token reduction
- **Table Conversion**: Converts Confluence tables to Markdown format

## Installation

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "confluence-md": {
      "command": "docker",
      "args": [
        "compose",
        "-f",
        "/path/to/niro-mcp-servers/docker-compose.yml",
        "run",
        "--rm",
        "confluence-md"
      ]
    }
  }
}
```

## Usage

The server provides one tool:

### convert_confluence_to_markdown

Convert Confluence HTML to clean Markdown.

**Parameters:**
- `html` (required): Confluence HTML content
- `removeMetadata` (optional, default: true): Remove metadata and styling
- `expandMacros` (optional, default: true): Expand Confluence macros
- `convertTables` (optional, default: true): Convert tables to Markdown

**Example:**

```typescript
{
  "html": "<ac:structured-macro ac:name=\"info\">...</ac:structured-macro>",
  "removeMetadata": true,
  "expandMacros": true,
  "convertTables": true
}
```

## Development

```bash
# Start development server
bun run dev

# Build
bun run build

# Run tests
bun test

# Clean
bun run clean
```

## Security

- Runs in Docker container with read-only filesystem
- No external network access
- stdio-only communication with Claude Desktop
- No data persistence
