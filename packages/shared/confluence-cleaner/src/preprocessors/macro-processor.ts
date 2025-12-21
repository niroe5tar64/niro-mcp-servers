import * as cheerio from "cheerio";
import { escapeHtml } from "../utils/html-escape";
import { processSvgToMermaid } from "./svg-to-mermaid";

/**
 * レンダリング後のConfluence HTMLを処理
 * ブラウザで表示される形式のHTMLを前提とする
 */
export function processRenderedHtml(html: string): string {
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
