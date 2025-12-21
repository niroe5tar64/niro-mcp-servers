/**
 * Estimate token count (improved approximation)
 *
 * より正確なトークン推定のため、以下の要素を考慮：
 * - 日本語（CJK文字）: 約2-3文字/トークン
 * - 英語・記号: 約4文字/トークン
 * - 空白・改行: カウントから除外
 */
export function estimateTokens(text: string): number {
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
