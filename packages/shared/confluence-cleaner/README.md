# @niro-mcp/confluence-cleaner

Confluence HTML cleaner shared library for MCP servers.

## Features

- Remove HTML noise and metadata
- Expand Confluence macros
- Convert to clean Markdown
- Token reduction optimization

## Usage

```typescript
import { cleanConfluenceHtml } from '@niro-mcp/confluence-cleaner';

const cleanedMarkdown = cleanConfluenceHtml(htmlContent, {
  removeMetadata: true,
  expandMacros: true,
  convertTables: true
});
```

## Development

```bash
# Run tests
bun test

# Clean build artifacts
bun run clean
```
