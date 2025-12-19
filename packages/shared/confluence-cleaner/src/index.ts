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

    // テーブル変換が有効な場合、テーブルセル内のブロック要素を正規化
    if (convertTables) {
      html = normalizeTableCells(html);
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
    // まずcheerio(XMLモード)でConfluenceの名前空間タグ(ac: / ri:)を構造的に処理する。
    // 正規表現ベースだと include/expand/new_window_link/widget などが落ちやすいため。
    const processed = expandConfluenceMacrosWithCheerio(html);

    // cheerio処理が効かないケースのため、既存の正規表現フォールバックも残す。
    let result = processed;

    // パターン1: Confluence標準の<ac:structured-macro>形式
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
 * Confluence名前空間タグ(ac: / ri:)をcheerioで処理して、意味のあるHTMLに正規化する。
 * - structured-macro: include/expand/new_window_link/widget/toc/linkgraph などを展開
 * - layout: セクション/セルのラッパーを剥がす
 * - time: datetimeを文字列化
 * - image(attachment): turndownが扱える<img>へ
 */
function expandConfluenceMacrosWithCheerio(html: string): string {
  try {
    const $ = cheerio.load(html, {
      // Confluenceの ac: / ri: など名前空間タグを崩さず扱う
      xml: { decodeEntities: false },
    });

    const getMacroParams = (macroEl: Parameters<typeof $>[0]) => {
      const params: Record<string, string> = {};
      $(macroEl)
        .find("ac\\:parameter")
        .each((_, p) => {
          const key = ($(p).attr("ac:name") || "").trim();
          const value = $(p).text().trim();
          if (key) {
            params[key] = value;
          }
        });
      return params;
    };

    const getMacroBodyHtml = (macroEl: Parameters<typeof $>[0]) => {
      const rich = $(macroEl).find("ac\\:rich-text-body").first();
      if (rich.length) return (rich.html() || "").trim();
      const plain = $(macroEl).find("ac\\:plain-text-body").first();
      if (plain.length) return plain.text().trim();
      return $(macroEl).text().trim();
    };

    // structured-macro を展開
    $("ac\\:structured-macro").each((_, el) => {
      const macroName = ($(el).attr("ac:name") || "").trim();
      if (!macroName) return;

      const params = getMacroParams(el);
      const bodyHtml = getMacroBodyHtml(el);

      switch (macroName.toLowerCase()) {
        case "toc":
          // 目次はLLM向けMarkdownではノイズになりがちなので削除
          $(el).replaceWith("");
          return;

        case "include": {
          const pageTitle =
            $(el).find("ri\\:page").attr("ri:content-title")?.trim() || "";
          const spaceKey =
            $(el).find("ri\\:space").attr("ri:space-key")?.trim() || "";
          const label = pageTitle || spaceKey || "Included content";
          $(el).replaceWith(
            `<p><em>Included page:</em> ${escapeHtml(label)}</p>`,
          );
          return;
        }

        case "expand": {
          const title = (params.title || "Details").trim();
          // <details> はturndownで落ちやすいので、シンプルなHTMLへ正規化
          $(el).replaceWith(
            `<div><strong>▶ ${escapeHtml(
              title,
            )}</strong><br><br>${bodyHtml}</div>`,
          );
          return;
        }

        case "new_window_link": {
          const link = (params.link || "").trim();
          const text = (params.body || params.link || link || "link").trim();
          if (!link) {
            $(el).replaceWith(escapeHtml(text));
            return;
          }
          $(el).replaceWith(
            `<a href="${escapeHtml(link)}">${escapeHtml(text)}</a>`,
          );
          return;
        }

        case "widget": {
          const url =
            $(el).find("ri\\:url").attr("ri:value")?.trim() ||
            (params.url || "").trim();
          const width = (params.width || "").trim();
          const height = (params.height || "").trim();
          const size =
            width || height ? ` (${width || "?"}x${height || "?"})` : "";
          const label = url ? `Widget: ${url}${size}` : `Widget${size}`;
          if (url) {
            $(el).replaceWith(
              `<p><a href="${escapeHtml(url)}">${escapeHtml(
                "Widget",
              )}</a>${escapeHtml(size)}</p>`,
            );
          } else {
            $(el).replaceWith(`<p>${escapeHtml(label)}</p>`);
          }
          return;
        }

        case "linkgraph": {
          const spaceKey =
            $(el).find("ri\\:space").attr("ri:space-key")?.trim() || "";
          const labels = (params.labels || "").trim();
          const label = [
            "Link graph",
            spaceKey ? `space=${spaceKey}` : "",
            labels ? `labels=${labels}` : "",
          ]
            .filter(Boolean)
            .join(" ");
          $(el).replaceWith(`<p><em>${escapeHtml(label)}</em></p>`);
          return;
        }

        default: {
          // 既存対応( info/warning/note/tip/code ) は共通関数に委譲
          if (
            ["info", "warning", "note", "tip", "code"].includes(
              macroName.toLowerCase(),
            )
          ) {
            const language =
              $(el)
                .find('ac\\:parameter[ac\\:name="language"]')
                .first()
                .text()
                .trim() || undefined;
            $(el).replaceWith(expandMacro(macroName, bodyHtml, language));
          } else {
            // 未知マクロはbodyだけ残す（パラメータ等のノイズを落とす）
            $(el).replaceWith(bodyHtml);
          }
        }
      }
    });

    // ac:image (attachment) を <img> に変換
    $("ac\\:image").each((_, el) => {
      const filename =
        $(el).find("ri\\:attachment").attr("ri:filename")?.trim() || "";
      const width = ($(el).attr("ac:width") || "").trim();
      if (!filename) {
        $(el).replaceWith("");
        return;
      }
      const widthAttr = width ? ` width="${escapeHtml(width)}"` : "";
      $(el).replaceWith(
        `<img src="attachment:${escapeHtml(
          filename,
        )}" alt="${escapeHtml(filename)}"${widthAttr} />`,
      );
    });

    // <time datetime="..."/> をテキスト化
    $("time").each((_, el) => {
      const dt = ($(el).attr("datetime") || "").trim();
      const text = dt || $(el).text().trim();
      $(el).replaceWith(escapeHtml(text));
    });

    // layout系ラッパーは剥がす（順序を保って中身を残す）
    $("ac\\:layout, ac\\:layout-section, ac\\:layout-cell").each((_, el) => {
      const contents = $(el).contents();
      $(el).replaceWith(contents);
    });

    return $.root().html() || html;
  } catch {
    // cheerioパースに失敗した場合は元のHTMLを返す
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
 * テーブルセル内のブロック要素を正規化して、Markdownテーブル変換を可能にする
 * 
 * Markdownテーブルはインライン要素のみをサポートするため、
 * セル内のdiv、p、ulなどのブロック要素を処理する必要がある
 */
function normalizeTableCells(html: string): string {
  try {
    const $ = cheerio.load(html, {
      xml: false,
    });

    // テーブルセル（td, th）を処理
    $("td, th").each((_, cell) => {
      const $cell = $(cell);
      
      // ブロック要素（div, p）を削除して、中身を直接セルに移動
      // 画像やリンクなどのインライン要素は保持
      // 注意: ネストされたdiv/pも処理するため、外側から内側へ処理
      let changed = true;
      while (changed) {
        changed = false;
        $cell.find("div, p").each((_, block) => {
          const $block = $(block);
          // さらにネストされたdiv/pがない場合のみ処理
          if ($block.find("div, p").length === 0) {
            // 画像が含まれている場合は特別に処理
            const $images = $block.find("img");
            if ($images.length > 0) {
              // 画像を含むブロック要素の場合、画像をHTMLのまま保持してブロック要素のラッパーを削除
              const blockHtml = $block.html() || "";
              if (blockHtml.trim()) {
                // 画像を含むHTMLをそのまま保持（cheerioがHTML文字列をパースする際に画像が保持される）
                $block.replaceWith(blockHtml);
              } else {
                $block.remove();
              }
            } else {
              // 画像やリンクなどのインライン要素が含まれている場合はHTMLを保持
              const hasInlineElements = $block.find("a, strong, em, code, b, i").length > 0;
              if (hasInlineElements) {
                // インライン要素を含む場合は、ブロック要素のラッパーを削除して中身を保持
                // HTML文字列として取得してから置き換える
                const blockHtml = $block.html() || "";
                if (blockHtml.trim()) {
                  // HTML文字列をそのまま置き換える（cheerioが自動的にパースする）
                  $block.replaceWith(blockHtml);
                } else {
                  $block.remove();
                }
              } else {
                // テキストのみの場合はテキストを保持
                const blockText = $block.text().trim();
                if (blockText) {
                  $block.replaceWith(blockText);
                } else {
                  $block.remove();
                }
              }
            }
            changed = true;
            return false; // break the loop
          }
        });
      }
      
      // 画像をMarkdown形式に事前変換（Turndownが処理する前に確実に保持するため）
      $cell.find("img").each((_, img) => {
        const $img = $(img);
        const src = $img.attr("src") || "";
        const alt = $img.attr("alt") || "";
        if (src) {
          // Markdown形式に変換: ![alt](src)
          // ただし、Turndownがこれをさらに処理しないように、HTMLコメントとして一時的に保持
          // その後、Turndownが処理する際にMarkdown形式として認識される
          const markdown = `![${alt}](${src})`;
          $img.replaceWith(markdown);
        }
      });
      
      // リスト（ul, ol）をテキストに変換
      $cell.find("ul, ol").each((_, list) => {
        const $list = $(list);
        const listItems: string[] = [];
        $list.find("li").each((_, li) => {
          const itemText = $(li).text().trim();
          if (itemText) {
            listItems.push(itemText);
          }
        });
        if (listItems.length > 0) {
          $list.replaceWith(listItems.join(" "));
        } else {
          $list.remove();
        }
      });
      
      // 空のbrタグを削除
      $cell.find("br").each((_, br) => {
        const $br = $(br);
        // 前後のテキストがない場合は削除
        const prevText = $br.prev().text().trim();
        const nextText = $br.next().text().trim();
        if (!prevText && !nextText) {
          $br.remove();
        }
      });
      
      // 空の要素を削除
      $cell.find("*").each((_, elem) => {
        const $elem = $(elem);
        if ($elem.children().length === 0 && !$elem.text().trim()) {
          $elem.remove();
        }
      });
      
      // テキストノードの前後の空白を整理
      $cell.contents().each((_, node) => {
        if (node.type === "text") {
          const text = $(node).text();
          const trimmed = text.trim();
          if (trimmed !== text) {
            $(node).replaceWith(trimmed);
          }
        }
      });
    });

    // colgroupは不要なので削除（Markdownテーブルでは幅指定ができない）
    $("colgroup").remove();

    return $.html();
  } catch (error) {
    console.warn("Failed to normalize table cells:", error);
    return html;
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
