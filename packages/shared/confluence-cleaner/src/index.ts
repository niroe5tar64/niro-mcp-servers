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

  // 言語クラス付きコードブロックのカスタムルール（GFMの後に追加して上書き）
  service.addRule("fencedCodeBlockWithLanguage", {
    filter: (node) => {
      return (
        node.nodeName === "PRE" &&
        node.firstChild !== null &&
        node.firstChild.nodeName === "CODE"
      );
    },
    replacement: (_content, node) => {
      const codeElement = node.firstChild as HTMLElement;

      // code要素のclass属性から言語を取得
      const className = codeElement.getAttribute("class") || "";
      const languageMatch = className.match(/language-(\S+)/);
      const language = languageMatch ? languageMatch[1] : "";

      // コード内容を取得
      const code = codeElement.textContent || "";

      const fence = "```";
      return `\n${fence}${language}\n${code}\n${fence}\n`;
    },
  });

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

    // すべての要素から class, style 属性を削除（ただし language-* クラスは保持）
    $("*").each((_, element) => {
      if (element.type === "tag" && element.attribs) {
        const classAttr = element.attribs.class || "";

        // language-* クラスがある場合は保持、それ以外は削除
        if (classAttr && /\blanguage-\S+/.test(classAttr)) {
          const languageClass = classAttr.match(/\blanguage-\S+/)?.[0] || "";
          $(element).attr("class", languageClass);
        } else {
          $(element).removeAttr("class");
        }

        // style属性は常に削除
        $(element).removeAttr("style");
      }
    });

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
 * レンダリング後のConfluence HTMLを処理
 * ブラウザで表示される形式のHTMLを前提とする
 */
function processRenderedHtml(html: string): string {
  try {
    const $ = cheerio.load(html, {
      xml: false, // HTMLモード
    });

    // PlantUML SVG画像をMermaidに変換: plantuml-svg-image
    $(".plantuml-svg-image").each((_, el) => {
      const svgHtml = $(el).html() || "";
      const mermaidCode = processSvgToMermaid(svgHtml);
      if (mermaidCode) {
        // Mermaidコードブロックに変換
        // cheerioの.text()を使うことで自動的に適切にエスケープされ、
        // Turndownが正しくデコードできる
        const pre = $("<pre></pre>");
        const code = $('<code class="language-mermaid"></code>');
        code.text(mermaidCode);
        pre.append(code);
        $(el).replaceWith(pre);
      }
    });

    // Expandマクロの処理: class="expand-container"
    $(".expand-container").each((_, el) => {
      const $control = $(el).find(".expand-control-text");
      const title = $control.text().trim() || "Details";
      const $content = $(el).find(".expand-content");
      const body = $content.html() || "";

      // Markdown-friendly形式に変換
      $(el).replaceWith(
        `<div><strong>▶ ${escapeHtml(title)}</strong><br><br>${body}</div>`,
      );
    });

    // 画像のラッパー除去: confluence-embedded-file-wrapper
    $(".confluence-embedded-file-wrapper").each((_, el) => {
      const $img = $(el).find("img");
      if ($img.length > 0) {
        // ラッパーを削除してimg要素のみ保持
        $(el).replaceWith($img);
      } else {
        // 画像がない場合は削除
        $(el).remove();
      }
    });

    // Page Tree マクロの削除: plugin_pagetree
    $(".plugin_pagetree").remove();

    // レイアウトコンテナのラッパー除去
    $(".contentLayout2, .columnLayout, .cell, .innerCell").each((_, el) => {
      const contents = $(el).contents();
      $(el).replaceWith(contents);
    });

    return $.html();
  } catch (error) {
    console.warn("Failed to process rendered HTML:", error);
    return html;
  }
}

/**
 * PlantUML SVGをMermaid flowchartに変換
 * @param svgHtml SVG要素のHTML文字列
 * @returns Mermaidコード（変換失敗時は空文字列）
 */
function processSvgToMermaid(svgHtml: string): string {
  try {
    const $ = cheerio.load(svgHtml, { xml: true });

    // ノード情報を抽出
    interface Node {
      id: string; // SVG要素のid属性（例: node1, node2）
      title: string; // <title>のテキスト（例: Meta, /-PC）
      label: string; // 表示ラベル（例: Meta, /-PC）
    }
    const nodes: Node[] = [];
    $("g.node").each((_, el) => {
      const nodeId = $(el).attr("id"); // SVGのid属性を取得
      const title = $(el).find("title").first().text().trim();
      const text = $(el).find("text").first().text().trim();
      if (nodeId && title) {
        nodes.push({ id: nodeId, title, label: text || title });
      }
    });

    // タイトルからノードIDへのマップを作成
    const titleToIdMap = new Map<string, string>();
    for (const node of nodes) {
      titleToIdMap.set(node.title, node.id);
    }

    // エッジ情報を抽出
    interface Edge {
      from: string; // ノードID（例: node1）
      to: string; // ノードID（例: node2）
    }
    const edges: Edge[] = [];
    $("g.edge").each((_, el) => {
      const title = $(el).find("title").first().text().trim();
      // タイトル形式: "A->B" または "A-->B"
      const match = title.match(/^(.+?)-+>(.+)$/);
      if (match) {
        const fromTitle = match[1].trim();
        const toTitle = match[2].trim();
        const fromId = titleToIdMap.get(fromTitle);
        const toId = titleToIdMap.get(toTitle);
        if (fromId && toId) {
          edges.push({ from: fromId, to: toId });
        }
      }
    });

    // ノードやエッジがない場合は変換しない
    if (nodes.length === 0 && edges.length === 0) {
      return "";
    }

    // Mermaid flowchart生成
    const lines: string[] = ["flowchart LR"];

    // ノード定義
    for (const node of nodes) {
      // ラベルに特殊文字が含まれる場合は["..."]で囲む
      const label = node.label.includes('"')
        ? node.label.replace(/"/g, "&quot;")
        : node.label;
      lines.push(`    ${node.id}["${label}"]`);
    }

    // エッジ定義
    for (const edge of edges) {
      lines.push(`    ${edge.from} --> ${edge.to}`);
    }

    return lines.join("\n");
  } catch (error) {
    console.warn("Failed to convert SVG to Mermaid:", error);
    return "";
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
              const hasInlineElements =
                $block.find("a, strong, em, code, b, i").length > 0;
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
 * テーブルセル内のエスケープされたMarkdown構文を解除
 * Turndownがテーブルセル内のMarkdown構文をエスケープしてしまうため、後処理で解除する
 */
function unescapeMarkdownInTables(markdown: string): string {
  // テーブルセル内のエスケープされた画像構文を解除
  // !\[...\](...) を ![...](...) に変換
  // Bunのパーサーが誤検出するため、正規表現リテラルを使わずに実装
  const result = markdown;

  // テーブル行を行ごとに処理
  const lines = result.split("\n");
  const processedLines = lines.map((line) => {
    // テーブル行（| で始まる行）のみを処理
    if (!line.trim().startsWith("|")) {
      return line;
    }

    // エスケープされた画像構文を解除（正規表現を使わずに文字列置換）
    let processed = line;

    // !\[  -> ![ を文字列置換で処理
    const exclamation = String.fromCharCode(33);
    const backslash = String.fromCharCode(92);
    const openBracket = String.fromCharCode(91);
    const escapedImageStart = exclamation + backslash + openBracket;
    const imageStart = exclamation + openBracket;
    while (processed.includes(escapedImageStart)) {
      processed = processed.replace(escapedImageStart, imageStart);
    }

    // \](  -> ]( を文字列置換で処理
    const closeBracket = String.fromCharCode(93);
    const openParen = String.fromCharCode(40);
    const escapedImageMiddle = backslash + closeBracket + openParen;
    const imageMiddle = closeBracket + openParen;
    while (processed.includes(escapedImageMiddle)) {
      processed = processed.replace(escapedImageMiddle, imageMiddle);
    }

    // \) を ) に変換
    const closeParen = String.fromCharCode(41);
    const escapedCloseParen = backslash + closeParen;
    while (processed.includes(escapedCloseParen)) {
      processed = processed.replace(escapedCloseParen, closeParen);
    }

    // 画像構文内のaltテキストやURL内の角括弧のエスケープを解除
    // \[ を [ に変換（画像構文の構造部分以外）
    const escapedOpenBracket = backslash + openBracket;
    while (processed.includes(escapedOpenBracket)) {
      processed = processed.replace(escapedOpenBracket, openBracket);
    }

    // \] を ] に変換（画像構文の構造部分以外）
    const escapedCloseBracket = backslash + closeBracket;
    while (processed.includes(escapedCloseBracket)) {
      processed = processed.replace(escapedCloseBracket, closeBracket);
    }

    return processed;
  });

  return processedLines.join("\n");
}

/**
 * Turndownが変換できなかった残りのHTMLテーブルをMarkdownに変換
 * <thead>がないテーブルなど、TurndownのGFMプラグインが変換できないテーブルを処理
 */
function convertRemainingHtmlTables(markdown: string): string {
  try {
    // テーブルタグが含まれていない場合はそのまま返す
    if (!markdown.includes("<table")) {
      return markdown;
    }

    const $ = cheerio.load(markdown, {
      xml: false,
    });

    // 残っている<table>タグを検出して変換
    $("table").each((_, table) => {
      const $table = $(table);
      const rows: string[] = [];
      let hasHeader = false;

      // <thead>がある場合はヘッダー行を取得
      const $thead = $table.find("thead");
      if ($thead.length > 0) {
        const cells: string[] = [];
        $thead.find("tr").each((_, tr) => {
          $(tr)
            .find("th, td")
            .each((_, cell) => {
              const cellText = $(cell).text().trim();
              cells.push(cellText);
            });
          if (cells.length > 0) {
            rows.push(`| ${cells.join(" | ")} |`);
            hasHeader = true;
          }
        });
        // セパレーター行を追加
        if (rows.length > 0) {
          const separator = `| ${cells.map(() => "---").join(" | ")} |`;
          rows.push(separator);
        }
      }

      // <tbody>または<tr>を取得
      const $tbody = $table.find("tbody");
      let $rows = $tbody.length > 0 ? $tbody.find("tr") : $table.find("tr");

      // <thead>がない場合は最初の行をヘッダーとして扱う
      if (!hasHeader && $rows.length > 0) {
        const firstRow = $rows.first();
        const headerCells: string[] = [];
        firstRow.find("th, td").each((_, cell) => {
          const cellText = $(cell).text().trim();
          headerCells.push(cellText);
        });
        if (headerCells.length > 0) {
          rows.push(`| ${headerCells.join(" | ")} |`);
          rows.push(`| ${headerCells.map(() => "---").join(" | ")} |`);
        }
        // 最初の行をスキップ
        $rows = $rows.slice(1);
      }

      // データ行を追加
      $rows.each((_, tr) => {
        const cells: string[] = [];
        $(tr)
          .find("td, th")
          .each((_, cell) => {
            // セル内のHTMLをMarkdownに変換（Turndownを使用）
            const cellHtml = $(cell).html() || "";
            const cellText = cellHtml.trim()
              ? new TurndownService().turndown(cellHtml)
              : $(cell).text().trim();
            cells.push(cellText);
          });
        if (cells.length > 0) {
          rows.push(`| ${cells.join(" | ")} |`);
        }
      });

      // テーブルをMarkdownに置き換え
      if (rows.length > 0) {
        $table.replaceWith(rows.join("\n"));
      } else {
        $table.remove();
      }
    });

    // bodyタグの内容のみを取得（html/head/bodyタグを除外）
    let bodyContent = $("body").html() || $.html();

    // cheerioの.html()がコードブロック内の`>`を`&gt;`にエスケープするため、
    // コードブロック内のHTMLエンティティをデコード
    // 正規表現で```で囲まれたコードブロックを検出し、その中の&gt;を>に戻す
    bodyContent = bodyContent.replace(/(```[\s\S]*?```)/g, (match) => {
      return match
        .replace(/&gt;/g, ">")
        .replace(/&lt;/g, "<")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
    });

    return bodyContent || markdown;
  } catch (error) {
    console.warn("Failed to convert remaining HTML tables:", error);
    return markdown;
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
