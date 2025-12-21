/**
 * Confluence HTML Cleaner
 *
 * Removes HTML noise and converts Confluence content to clean Markdown
 * optimized for LLM consumption.
 */

import {
  convertRemainingHtmlTables,
  unescapeMarkdownInTables,
} from "./postprocessors";
import {
  normalizeTableCells,
  processRenderedHtml,
  removeConfluenceMetadata,
} from "./preprocessors";
import { getTurndownService } from "./turndown-service";

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
    // ローカル変数を使用してパラメータの再代入を避ける
    let cleanedHtml = html;

    // レンダリング後のConfluence HTML要素を処理（class属性を使用するため、メタデータ除去より先に実行）
    if (expandMacros) {
      cleanedHtml = processRenderedHtml(cleanedHtml);
    }

    // メタデータ除去が有効な場合は、不要な属性を削除
    if (removeMetadata) {
      cleanedHtml = removeConfluenceMetadata(cleanedHtml);
    }

    // テーブル変換が有効な場合、テーブルセル内のブロック要素を正規化
    if (convertTables) {
      cleanedHtml = normalizeTableCells(cleanedHtml);
    }

    // TurndownServiceのインスタンスを取得（キャッシュ付き）
    const turndownService = getTurndownService(convertTables);

    // HTML → Markdown変換
    let markdown = turndownService.turndown(cleanedHtml);

    // TurndownがエスケープしたMarkdown構文を解除
    // テーブルセル内の画像構文（!\[...\](...)）を正規化
    markdown = unescapeMarkdownInTables(markdown);

    // Turndownが変換できなかった残りのHTMLテーブルをMarkdownに変換
    if (convertTables) {
      markdown = convertRemainingHtmlTables(markdown);
    }

    return markdown;
  } catch (error) {
    // エラーが発生した場合は、元のHTMLを返す
    console.error("HTML to Markdown conversion failed:", error);
    return html;
  }
}
