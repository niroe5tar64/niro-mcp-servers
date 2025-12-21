import { describe, expect, test } from "bun:test";
import { unescapeMarkdown } from "./markdown-unescape";

describe("unescapeMarkdown", () => {
  test("\\_ をアンダースコアに変換する", () => {
    const input = "ja\\_JP";
    const expected = "ja_JP";
    expect(unescapeMarkdown(input)).toBe(expected);
  });

  test("\\- をハイフンに変換する", () => {
    const input = "| \\- |";
    const expected = "| - |";
    expect(unescapeMarkdown(input)).toBe(expected);
  });

  test("\\* をアスタリスクに変換する", () => {
    const input = "video.example.com/\\*";
    const expected = "video.example.com/*";
    expect(unescapeMarkdown(input)).toBe(expected);
  });

  test("複数のエスケープを同時に変換する", () => {
    const input = "og:site\\_name | \\- | /path/\\*";
    const expected = "og:site_name | - | /path/*";
    expect(unescapeMarkdown(input)).toBe(expected);
  });

  test("エスケープがない文字列はそのまま返す", () => {
    const input = "Normal text without escapes";
    expect(unescapeMarkdown(input)).toBe(input);
  });

  test("ファイル名内のアンダースコアを正しく処理する", () => {
    const input = "image-2025-1-10\\_16-21-19.png";
    const expected = "image-2025-1-10_16-21-19.png";
    expect(unescapeMarkdown(input)).toBe(expected);
  });
});
