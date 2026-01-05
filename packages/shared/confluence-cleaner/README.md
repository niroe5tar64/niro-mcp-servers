# @niro-mcp/confluence-cleaner

Confluence HTML cleaner shared library for MCP servers.

Converts **rendered Confluence HTML** (browser-displayed HTML) to clean Markdown optimized for LLM consumption.

## Installation

This package is published to GitHub Packages (private registry).

### 1. Configure GitHub Packages

Create or edit `.npmrc` in your project root:

```ini
@niro-mcp:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Replace `YOUR_GITHUB_TOKEN` with a GitHub Personal Access Token (PAT) with `read:packages` permission.

### 2. Install the package

```bash
bun add @niro-mcp/confluence-cleaner
# or
npm install @niro-mcp/confluence-cleaner
```

## Features

- **Remove HTML noise and metadata**: Strips class, style, data-* attributes
- **Process Confluence macros**: Handles Expand, Page Tree, and other rendered macros
- **Clean up layouts**: Removes Confluence layout wrappers while preserving content
- **Convert to Markdown**: Uses Turndown with GFM support
- **Token reduction optimization**: Typically achieves 20-50% token reduction

## Supported Confluence Elements

### Rendered HTML Elements (Post-Browser Rendering)
- ✅ Expand macro (`expand-container`)
- ✅ Images with wrappers (`confluence-embedded-file-wrapper`)
- ✅ Page Tree macro (`plugin_pagetree`) - removed as noise
- ✅ Layout containers (`contentLayout2`, `columnLayout`, `cell`)
- ✅ Standard HTML (headings, lists, tables, links, etc.)

### Not Supported
- ❌ Confluence Storage Format (API XML with `<ac:structured-macro>`)
- Use rendered HTML from browser instead

## Usage

```typescript
import { cleanConfluenceHtml, calculateTokenReduction } from '@niro-mcp/confluence-cleaner';

// Convert rendered Confluence HTML to Markdown
const html = '<div class="expand-container">...</div>';
const markdown = cleanConfluenceHtml(html, {
  removeMetadata: true,   // Remove class/style/data-* attributes
  expandMacros: true,     // Process Confluence macros
  convertTables: true     // Convert tables to Markdown
});

// Calculate token reduction
const reduction = calculateTokenReduction(html, markdown);
console.log(`Token reduction: ${reduction.toFixed(1)}%`);
```

## Options

```typescript
interface CleanerOptions {
  removeMetadata?: boolean;  // Default: true
  expandMacros?: boolean;    // Default: true
  convertTables?: boolean;   // Default: true
}
```

## Development

```bash
# Run tests
bun test

# Build package
bun run build

# Check code quality
bunx biome check .

# Clean build artifacts
bun run clean
```

## Publishing

This package is automatically published to GitHub Packages when a version tag is pushed.

```bash
# 1. Update version in package.json
# 2. Commit changes
git add packages/shared/confluence-cleaner/package.json
git commit -m "chore: bump confluence-cleaner to v0.1.1"

# 3. Create and push tag
git tag confluence-cleaner-v0.1.1
git push origin main --tags

# GitHub Actions will automatically build and publish
```

## Implementation Notes

### Processing Order
1. **Expand macros** (uses class attributes)
2. **Remove metadata** (strips class/style/data-*)
3. **Normalize tables**
4. **Convert to Markdown**

This order is critical because macro processing requires class attributes.

### Input Format
This library expects **rendered Confluence HTML** (the HTML you see in browser DevTools), not the Storage Format XML from Confluence API.

**Correct input:**
```html
<div class="expand-container">
  <div class="expand-control">
    <span class="expand-control-text">Click to expand</span>
  </div>
  <div class="expand-content">
    <p>Content</p>
  </div>
</div>
```

**Incorrect input (API XML):**
```html
<ac:structured-macro ac:name="expand">
  <ac:parameter ac:name="title">Click to expand</ac:parameter>
  <ac:rich-text-body><p>Content</p></ac:rich-text-body>
</ac:structured-macro>
```
