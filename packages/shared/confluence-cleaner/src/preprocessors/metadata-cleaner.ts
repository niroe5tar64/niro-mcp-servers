import * as cheerio from "cheerio";

/**
 * Confluenceメタデータ（class, style, data-*属性）を削除
 * cheerioを使用してHTMLを安全にパース・操作
 */
export function removeConfluenceMetadata(html: string): string {
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
