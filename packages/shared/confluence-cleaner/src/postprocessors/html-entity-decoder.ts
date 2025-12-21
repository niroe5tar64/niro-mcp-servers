/**
 * HTMLエンティティをデコードする
 * Markdown変換後のテキストに残るHTMLエンティティを元の文字に戻す
 */
export function decodeHtmlEntities(markdown: string): string {
  const namedEntities: Record<string, string> = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
  };

  let result = markdown;

  for (const [entity, char] of Object.entries(namedEntities)) {
    result = result.replaceAll(entity, char);
  }

  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(Number.parseInt(code, 10)),
  );

  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
    String.fromCharCode(Number.parseInt(code, 16)),
  );

  return result;
}
