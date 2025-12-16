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
 * サポートされているConfluenceマクロタイプ
 */
export type MacroType = "info" | "warning" | "note" | "tip" | "code";

/**
 * 認識可能なマクロタイプの集合（実行時チェック用）
 */
const SUPPORTED_MACRO_TYPES: ReadonlySet<string> = new Set<MacroType>([
  "info",
  "warning",
  "note",
  "tip",
  "code",
]);

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

  try {
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
  } catch (error) {
    // エラーが発生した場合は、元のHTMLを返す
    console.error("HTML to Markdown conversion failed:", error);
    return html;
  }
}

/**
 * Confluenceメタデータ（class, style, data-*属性）を削除
 * cheerioを使用してHTMLを安全にパース・操作
 */
function removeConfluenceMetadata(html: string): string {
  try {
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
  } catch (error) {
    // パースエラーが発生した場合は、元のHTMLを返す
    console.warn("Failed to parse HTML with cheerio:", error);
    return html;
  }
}

/**
 * Confluence マクロを認識して展開
 */
function expandConfluenceMacros(html: string): string {
  try {
    let result = html;

    // パターン1: Confluence標準の<ac:structured-macro>形式
    // 例: <ac:structured-macro ac:name="info"><ac:rich-text-body>content</ac:rich-text-body></ac:structured-macro>
    const acMacroPattern =
      /<ac:structured-macro[^>]*ac:name="([^"]+)"[^>]*>([\s\S]*?)<\/ac:structured-macro>/gi;

    result = result.replace(acMacroPattern, (_match, macroType, content) => {
      // 言語パラメータを抽出（codeマクロ用）
      const languageMatch = content.match(
        /<ac:parameter[^>]*ac:name="language"[^>]*>([^<]+)<\/ac:parameter>/i,
      );
      const language = languageMatch ? languageMatch[1].trim() : undefined;

      // ac:rich-text-bodyまたはac:plain-text-bodyからコンテンツを抽出
      const richTextMatch = content.match(
        /<ac:rich-text-body>([\s\S]*?)<\/ac:rich-text-body>/i,
      );
      const plainTextMatch = content.match(
        /<ac:plain-text-body><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-body>/i,
      );

      let cleanContent = "";
      if (richTextMatch) {
        cleanContent = richTextMatch[1].trim();
      } else if (plainTextMatch) {
        cleanContent = plainTextMatch[1].trim();
      } else {
        // bodyタグがない場合は、パラメータタグを除去して使用
        cleanContent = content
          .replace(/<ac:parameter[^>]*>[\s\S]*?<\/ac:parameter>/gi, "")
          .replace(/<\/?[^>]+(>|$)/g, "")
          .trim();
      }

      return expandMacro(macroType, cleanContent, language);
    });

    // パターン2: div要素のdata-macro-name属性（HTML出力形式）
    const divMacroPattern =
      /<div[^>]*data-macro-name="([^"]+)"[^>]*>([\s\S]*?)<\/div>/gi;

    result = result.replace(divMacroPattern, (_match, macroType, content) => {
      // divタグを除去してコンテンツのみを取得
      const cleanContent = content.replace(/<\/?div[^>]*>/g, "").trim();
      return expandMacro(macroType, cleanContent);
    });

    return result;
  } catch (error) {
    console.warn("Failed to expand Confluence macros:", error);
    return html;
  }
}

/**
 * マクロタイプがサポートされているかチェック
 */
function isSupportedMacroType(macroType: string): macroType is MacroType {
  return SUPPORTED_MACRO_TYPES.has(macroType.toLowerCase());
}

/**
 * Expand Confluence macro to readable format (HTML形式で返す)
 * Turndownが後で適切にMarkdownに変換する
 */
export function expandMacro(
  macroType: string,
  content: string,
  language?: string,
): string {
  const trimmedContent = content.trim();
  const normalizedType = macroType.toLowerCase();

  // 型安全なマクロ展開
  if (!isSupportedMacroType(normalizedType)) {
    // 未知のマクロタイプはそのまま返す
    return trimmedContent;
  }

  switch (normalizedType) {
    case "info":
      return `<div><strong>ℹ️ INFO</strong><br><br>${trimmedContent}</div>`;

    case "warning":
      return `<div><strong>⚠️ WARNING</strong><br><br>${trimmedContent}</div>`;

    case "note":
      return `<div><strong>📝 NOTE</strong><br><br>${trimmedContent}</div>`;

    case "tip":
      return `<div><strong>💡 TIP</strong><br><br>${trimmedContent}</div>`;

    case "code":
      // コードマクロはHTML codeブロックとして展開（言語指定付き）
      if (language) {
        return `<pre><code class="language-${language}">${escapeHtml(trimmedContent)}</code></pre>`;
      }
      return `<pre><code>${escapeHtml(trimmedContent)}</code></pre>`;
  }
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

  // 元のテキストが空の場合は計算不可
  if (originalTokens === 0) {
    return Number.NaN;
  }

  return ((originalTokens - cleanedTokens) / originalTokens) * 100;
}

/**
 * Estimate token count (improved approximation)
 *
 * より正確なトークン推定のため、以下の要素を考慮：
 * - 日本語（CJK文字）: 約2-3文字/トークン
 * - 英語・記号: 約4文字/トークン
 * - 空白・改行: カウントから除外
 */
function estimateTokens(text: string): number {
  if (!text || text.length === 0) {
    return 0;
  }

  // CJK文字（中国語、日本語、韓国語）のパターン
  const cjkPattern = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g;

  // 空白と改行を除去
  const withoutWhitespace = text.replace(/\s+/g, "");

  // CJK文字をカウント
  const cjkMatches = withoutWhitespace.match(cjkPattern);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;

  // 非CJK文字をカウント
  const nonCjkCount = withoutWhitespace.length - cjkCount;

  // トークン推定
  // CJK: 2.5文字/トークン, 非CJK: 4文字/トークン
  const cjkTokens = cjkCount / 2.5;
  const nonCjkTokens = nonCjkCount / 4;

  return Math.ceil(cjkTokens + nonCjkTokens);
}
