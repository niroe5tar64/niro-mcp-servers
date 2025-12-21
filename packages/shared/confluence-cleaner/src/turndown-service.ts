import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

/**
 * TurndownServiceのシングルトンキャッシュ
 * convertTablesオプションごとにインスタンスを保持
 */
const cache = new Map<boolean, TurndownService>();

/**
 * TurndownServiceインスタンスを取得（キャッシュ付き）
 */
export function getTurndownService(convertTables: boolean): TurndownService {
  const cached = cache.get(convertTables);
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

  cache.set(convertTables, service);
  return service;
}
