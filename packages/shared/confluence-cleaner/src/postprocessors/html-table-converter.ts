import * as cheerio from "cheerio";
import TurndownService from "turndown";

/**
 * Turndownが変換できなかった残りのHTMLテーブルをMarkdownに変換
 * <thead>がないテーブルなど、TurndownのGFMプラグインが変換できないテーブルを処理
 */
export function convertRemainingHtmlTables(markdown: string): string {
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
