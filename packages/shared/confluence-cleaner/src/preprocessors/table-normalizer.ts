import * as cheerio from "cheerio";

/**
 * テーブルセル内のブロック要素を正規化して、Markdownテーブル変換を可能にする
 *
 * Markdownテーブルはインライン要素のみをサポートするため、
 * セル内のdiv、p、ulなどのブロック要素を処理する必要がある
 */
export function normalizeTableCells(html: string): string {
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
