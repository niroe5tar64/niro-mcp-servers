/**
 * テーブルセル内のエスケープされたMarkdown構文を解除
 * Turndownがテーブルセル内のMarkdown構文をエスケープしてしまうため、後処理で解除する
 */
export function unescapeMarkdownInTables(markdown: string): string {
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
