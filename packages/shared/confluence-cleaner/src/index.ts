/**
 * Confluence HTML Cleaner
 *
 * Removes HTML noise and converts Confluence content to clean Markdown
 * optimized for LLM consumption.
 */

import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

export interface CleanerOptions {
  /**
   * Remove Confluence-specific metadata and styling
   */
  removeMetadata?: boolean;

  /**
   * Expand Confluence macros (info, warning, code, etc.)
   */
  expandMacros?: boolean;

  /**
   * Convert tables to Markdown format
   */
  convertTables?: boolean;
}

/**
 * TurndownServiceのシングルトンキャッシュ
 * convertTablesオプションごとにインスタンスを保持
 */
const turndownServiceCache = new Map<boolean, TurndownService>();

/**
 * TurndownServiceインスタンスを取得（キャッシュ付き）
 */
function getTurndownService(convertTables: boolean): TurndownService {
  const cached = turndownServiceCache.get(convertTables);
  if (cached) {
    return cached;
  }

  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*", // 斜体を*で表現
  });

  // GFM（GitHub Flavored Markdown）プラグインを追加（テーブル対応）
  if (convertTables) {
    service.use(gfm);
  } else {
    // テーブルをHTMLのまま保持するルールを追加
    service.keep(["table", "thead", "tbody", "tr", "th", "td"]);
  }

  turndownServiceCache.set(convertTables, service);
  return service;
}

/**
 * Clean Confluence HTML and convert to Markdown
 */
export function cleanConfluenceHtml(
  html: string,
  options: CleanerOptions = {},
): string {
  // 空文字列の場合はそのまま返す
  if (!html || html.trim() === "") {
    return "";
  }

  const {
    removeMetadata = true,
    expandMacros = true,
    convertTables = true,
  } = options;

  // メタデータ除去が有効な場合は、不要な属性を削除
  if (removeMetadata) {
    html = removeConfluenceMetadata(html);
  }

  // Confluenceマクロの展開
  if (expandMacros) {
    html = expandConfluenceMacros(html);
  }

  // TurndownServiceのインスタンスを取得（キャッシュ付き）
  const turndownService = getTurndownService(convertTables);

  // HTML → Markdown変換
  const markdown = turndownService.turndown(html);

  return markdown;
}

/**
 * Confluenceメタデータ（class, style, data-*属性）を削除
 * cheerioを使用してHTMLを安全にパース・操作
 */
function removeConfluenceMetadata(html: string): string {
  const $ = cheerio.load(html, {
    // XMLモードは無効（HTMLとして扱う）
    xml: false,
  });

  // すべての要素から class, style 属性を削除
  $("*").removeAttr("class").removeAttr("style");

  // すべての data-* 属性を削除
  $("*").each((_, element) => {
    if (element.type === "tag" && element.attribs) {
      for (const attr in element.attribs) {
        if (attr.startsWith("data-")) {
          $(element).removeAttr(attr);
        }
      }
    }
  });

  return $.html();
}

/**
 * Confluence マクロを認識して展開
 */
function expandConfluenceMacros(html: string): string {
  // Confluenceマクロパターンを認識
  // 例: <ac:structured-macro ac:name="info">...<ac:rich-text-body>content</ac:rich-text-body>...</ac:structured-macro>

  // シンプルな実装: div要素のdata-macro-name属性からマクロタイプを認識
  const macroPattern =
    /<div[^>]*data-macro-name="([^"]+)"[^>]*>([\s\S]*?)<\/div>/gi;

  const expanded = html.replace(macroPattern, (_match, macroType, content) => {
    // divタグを除去してコンテンツのみを取得
    const cleanContent = content.replace(/<\/?div[^>]*>/g, "");
    return expandMacro(macroType, cleanContent);
  });

  return expanded;
}

/**
 * Expand Confluence macro to readable format
 */
export function expandMacro(macroType: string, content: string): string {
  const trimmedContent = content.trim();

  switch (macroType.toLowerCase()) {
    case "info":
      return `ℹ️ **INFO**\n\n${trimmedContent}`;

    case "warning":
      return `⚠️ **WARNING**\n\n${trimmedContent}`;

    case "note":
      return `📝 **NOTE**\n\n${trimmedContent}`;

    case "tip":
      return `💡 **TIP**\n\n${trimmedContent}`;

    case "code":
      // コードマクロはコードブロックとして展開
      return `\`\`\`\n${trimmedContent}\n\`\`\``;

    default:
      // 未知のマクロタイプはそのまま返す
      return trimmedContent;
  }
}

/**
 * Calculate token reduction percentage
 */
export function calculateTokenReduction(
  original: string,
  cleaned: string,
): number {
  const originalTokens = estimateTokens(original);
  const cleanedTokens = estimateTokens(cleaned);
  return ((originalTokens - cleanedTokens) / originalTokens) * 100;
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}
