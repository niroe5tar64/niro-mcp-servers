/**
 * Turndownが挿入した不要なバックスラッシュエスケープを解除する
 * LLM向けのプレーンテキストとして可読性を向上させる
 */
export function unescapeMarkdown(markdown: string): string {
  const escapePatterns: [string, string][] = [
    ["\\_", "_"],
    ["\\-", "-"],
    ["\\*", "*"],
    ["\\#", "#"],
    ["\\.", "."],
    ["\\!", "!"],
  ];

  let result = markdown;

  for (const [escaped, unescaped] of escapePatterns) {
    result = result.replaceAll(escaped, unescaped);
  }

  return result;
}
