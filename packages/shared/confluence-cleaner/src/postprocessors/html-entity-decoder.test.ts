import { describe, expect, test } from "bun:test";
import { decodeHtmlEntities } from "./html-entity-decoder";

describe("decodeHtmlEntities", () => {
  test("&nbsp; を半角スペースに変換する", () => {
    const input = "Hello&nbsp;World";
    const expected = "Hello World";
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test("&amp; を & に変換する", () => {
    const input = "foo=1&amp;bar=2";
    const expected = "foo=1&bar=2";
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test("複数のエンティティを同時に変換する", () => {
    const input = "&lt;div&gt;&amp;&nbsp;&quot;test&quot;&lt;/div&gt;";
    const expected = '<div>& "test"</div>';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test("数値文字参照を変換する", () => {
    const input = "&#65;&#66;&#67;";
    const expected = "ABC";
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test("16進数値文字参照を変換する", () => {
    const input = "&#x41;&#x42;&#x43;";
    const expected = "ABC";
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test("エンティティがない文字列はそのまま返す", () => {
    const input = "Normal text without entities";
    expect(decodeHtmlEntities(input)).toBe(input);
  });

  test("URL内のエンティティを変換する", () => {
    const input =
      "![](/download/attachments/123/image.png?version=1&amp;modificationDate=1749435563414&amp;api=v2)";
    const expected =
      "![](/download/attachments/123/image.png?version=1&modificationDate=1749435563414&api=v2)";
    expect(decodeHtmlEntities(input)).toBe(expected);
  });
});
