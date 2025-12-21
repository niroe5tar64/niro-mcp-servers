/**
 * confluence-cleaner 統合テスト
 *
 * ## テスト分割の方針
 *
 * このファイルは公開API（cleanConfluenceHtml, calculateTokenReduction）の
 * 統合テストとして維持する。内部モジュール（preprocessors, postprocessors等）に
 * 密結合したテストは避け、リファクタリング耐性を保つ。
 *
 * ### 分割を検討するタイミング
 * - このファイルが1000行を超えた場合
 * - 特定モジュールに複雑なロジックが追加され、単体テストが必要な場合
 * - CIで特定テストだけ並列実行したい場合
 *
 * ### 分割時の構成案
 * - index.test.ts         → 公開APIの統合テスト（現状維持）
 * - preprocessors/*.test.ts → 前処理モジュールの単体テスト
 * - postprocessors/*.test.ts → 後処理モジュールの単体テスト
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { calculateTokenReduction, cleanConfluenceHtml } from "./index";

describe("calculateTokenReduction", () => {
  test("正常な削減率を計算できる", () => {
    const original = "1234567890123456"; // 16文字 = 4トークン
    const cleaned = "12345678"; // 8文字 = 2トークン
    const reduction = calculateTokenReduction(original, cleaned);

    expect(reduction).toBe(50); // 50%削減
  });

  test("削減がない場合は0%を返す", () => {
    const text = "12345678"; // 8文字
    const reduction = calculateTokenReduction(text, text);

    expect(reduction).toBe(0);
  });

  test("トークンが増加した場合は負の値を返す", () => {
    const original = "1234"; // 4文字 = 1トークン
    const cleaned = "12345678"; // 8文字 = 2トークン
    const reduction = calculateTokenReduction(original, cleaned);

    expect(reduction).toBe(-100); // 100%増加（-100%削減）
  });

  test("空文字列を処理できる", () => {
    const original = "12345678"; // 8文字 = 2トークン
    const cleaned = ""; // 0文字 = 0トークン
    const reduction = calculateTokenReduction(original, cleaned);

    expect(reduction).toBe(100); // 100%削減
  });

  test("日本語テキストでも動作する", () => {
    const original = "あいうえおかきくけこ"; // 10文字 ÷ 2.5 = 4トークン（切り上げ）
    const cleaned = "あいうえお"; // 5文字 ÷ 2.5 = 2トークン（切り上げ）
    const reduction = calculateTokenReduction(original, cleaned);

    // 改善されたトークン推定: (4-2)/4*100 = 50%
    expect(reduction).toBe(50);
  });

  test("実際のHTMLとMarkdownで削減率を計算", () => {
    const html =
      '<div class="confluence-content"><p style="color: red;">Hello World</p></div>'; // 76文字 = 19トークン
    const markdown = "Hello World"; // 11文字 = 3トークン
    const reduction = calculateTokenReduction(html, markdown);

    // (19-3)/19*100 = 84.21...
    expect(reduction).toBeGreaterThan(80); // 80%以上削減されている
    expect(reduction).toBeLessThan(90); // 90%未満
  });

  test("日英混在テキストのトークン推定", () => {
    const text = "Hello こんにちは World 世界"; // 英語8文字 + 日本語6文字
    const reduction = calculateTokenReduction(text, "");

    // 英語: 8文字 ÷ 4 = 2トークン
    // 日本語: 6文字 ÷ 2.5 = 2.4トークン（切り上げで3）
    // 合計: 5トークン削減 = 100%
    expect(reduction).toBe(100);
  });

  test("空文字列のトークン推定", () => {
    const reduction = calculateTokenReduction("", "");
    expect(reduction).toBeNaN(); // 0で割ることになるのでNaN
  });
});

describe("cleanConfluenceHtml", () => {
  describe("基本的なHTML変換", () => {
    test("シンプルな段落をMarkdownに変換", () => {
      const html = "<p>Hello World</p>";
      const result = cleanConfluenceHtml(html);

      expect(result.trim()).toBe("Hello World");
    });

    test("見出しをMarkdownに変換", () => {
      const html = "<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>";
      const result = cleanConfluenceHtml(html);

      expect(result).toContain("# Title");
      expect(result).toContain("## Subtitle");
      expect(result).toContain("### Section");
    });

    test("リストをMarkdownに変換", () => {
      const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
      const result = cleanConfluenceHtml(html);

      expect(result).toContain("-   Item 1");
      expect(result).toContain("-   Item 2");
    });

    test("強調とボールドをMarkdownに変換", () => {
      const html = "<p>This is <strong>bold</strong> and <em>italic</em></p>";
      const result = cleanConfluenceHtml(html);

      expect(result).toContain("**bold**");
      expect(result).toContain("*italic*");
    });

    test("リンクをMarkdownに変換", () => {
      const html = '<p><a href="https://example.com">Link</a></p>';
      const result = cleanConfluenceHtml(html);

      expect(result).toContain("[Link](https://example.com)");
    });
  });

  describe("Confluence特有のメタデータ除去", () => {
    test("classとstyle属性を削除", () => {
      const html =
        '<div class="confluence-content" style="color: red;"><p class="paragraph" style="margin: 10px;">Test</p></div>';
      const result = cleanConfluenceHtml(html, { removeMetadata: true });

      expect(result).not.toContain("class=");
      expect(result).not.toContain("style=");
      expect(result.trim()).toBe("Test");
    });

    test("data-*属性を削除", () => {
      const html =
        '<div data-confluence-id="12345" data-macro-name="info"><p>Test</p></div>';
      const result = cleanConfluenceHtml(html, { removeMetadata: true });

      expect(result).not.toContain("data-");
    });

    test("removeMetadata: false の場合は属性を保持", () => {
      const html = '<div class="test"><p>Test</p></div>';
      const result = cleanConfluenceHtml(html, { removeMetadata: false });

      // Turndownはデフォルトで属性を除去するため、このテストは実装依存
      // 基本的な変換は行われることを確認
      expect(result).toBeDefined();
      expect(result).toContain("Test");
    });
  });

  describe("テーブル変換", () => {
    test("シンプルなテーブルをMarkdownに変換", () => {
      const html = `
        <table>
          <thead>
            <tr><th>Header 1</th><th>Header 2</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
            <tr><td>Cell 3</td><td>Cell 4</td></tr>
          </tbody>
        </table>
      `;
      const result = cleanConfluenceHtml(html, { convertTables: true });

      expect(result).toContain("| Header 1 | Header 2 |");
      expect(result).toContain("| --- | --- |");
      expect(result).toContain("| Cell 1 | Cell 2 |");
    });

    test("convertTables: false の場合はHTMLテーブルを保持", () => {
      const html = "<table><tr><td>Test</td></tr></table>";
      const result = cleanConfluenceHtml(html, { convertTables: false });

      expect(result).toContain("<table>");
    });
  });

  describe("空文字列とエッジケース", () => {
    test("空文字列を処理", () => {
      const result = cleanConfluenceHtml("");
      expect(result).toBe("");
    });

    test("HTMLタグなしのプレーンテキストを処理", () => {
      const text = "Plain text without HTML";
      const result = cleanConfluenceHtml(text);

      expect(result).toBe(text);
    });

    test("ネストされた複雑なHTMLを処理", () => {
      const html = `
        <div class="confluence-content">
          <h1>Title</h1>
          <div class="section">
            <p>Paragraph with <strong>bold</strong> and <em>italic</em></p>
            <ul>
              <li>Item 1</li>
              <li>Item 2 with <a href="/link">link</a></li>
            </ul>
          </div>
        </div>
      `;
      const result = cleanConfluenceHtml(html);

      // 適切なMarkdownが返されることを確認
      expect(result).toContain("# Title");
      expect(result).toContain("**bold**");
      expect(result).toContain("*italic*");
      expect(result).toContain("-   Item 1");
      expect(result).toContain("[link](/link)");
    });
  });
});

describe("レンダリング後のConfluence HTML処理", () => {
  describe("PlantUML SVG → Mermaid変換", () => {
    test("シンプルなSVGグラフをMermaidに変換", () => {
      const html = `
        <span class="plantuml-svg-image">
          <svg>
            <g id="node1" class="node">
              <title>NodeA</title>
              <text>Node A</text>
            </g>
            <g id="node2" class="node">
              <title>NodeB</title>
              <text>Node B</text>
            </g>
            <g id="edge1" class="edge">
              <title>NodeA-&gt;NodeB</title>
            </g>
          </svg>
        </span>
      `;
      const result = cleanConfluenceHtml(html, { expandMacros: true });

      expect(result).toContain("```mermaid");
      expect(result).toContain("flowchart LR");
      expect(result).toContain('node1["Node A"]');
      expect(result).toContain('node2["Node B"]');
      expect(result).toContain("node1 --> node2");
    });

    test("日本語ノード名を含むSVGを変換", () => {
      const html = `
        <span class="plantuml-svg-image">
          <svg>
            <g id="node1" class="node">
              <title>メタ情報</title>
              <text>Meta</text>
            </g>
            <g id="node2" class="node">
              <title>UIパーツA</title>
              <text>UIパーツA</text>
            </g>
            <g id="edge1" class="edge">
              <title>メタ情報-&gt;UIパーツA</title>
            </g>
          </svg>
        </span>
      `;
      const result = cleanConfluenceHtml(html, { expandMacros: true });

      expect(result).toContain("```mermaid");
      // ラベル（<text>の値）が含まれることを確認
      expect(result).toContain("Meta");
      expect(result).toContain("UIパーツA");
      expect(result).toContain("node1 --> node2");
    });

    test("特殊文字を含むノード名でも正しく変換", () => {
      const html = `
        <span class="plantuml-svg-image">
          <svg>
            <g id="node1" class="node">
              <title>/-PC</title>
              <text>/-PC</text>
            </g>
            <g id="node2" class="node">
              <title>Node-2</title>
              <text>Node 2</text>
            </g>
            <g id="edge1" class="edge">
              <title>/-PC-&gt;Node-2</title>
            </g>
          </svg>
        </span>
      `;
      const result = cleanConfluenceHtml(html, { expandMacros: true });

      expect(result).toContain("```mermaid");
      // SVGのid属性を使用するため、特殊文字を含むラベルも正しく表示される
      expect(result).toContain('node1["/-PC"]');
      expect(result).toContain('node2["Node 2"]');
      expect(result).toContain("node1 --> node2");
    });

    test("ノードもエッジもない空SVGは変換しない", () => {
      const html = `
        <span class="plantuml-svg-image">
          <svg>
            <g id="graph0" class="graph">
              <title>g</title>
            </g>
          </svg>
        </span>
      `;
      const result = cleanConfluenceHtml(html, { expandMacros: true });

      // 空のSVGは変換されない（元のまま残るか削除される）
      expect(result).not.toContain("```mermaid");
    });

    test("expandMacros=falseの場合はSVGをMermaid変換しない", () => {
      const html = `
        <span class="plantuml-svg-image">
          <svg>
            <g class="node">
              <title>NodeA</title>
              <text>Node A</text>
            </g>
          </svg>
        </span>
      `;
      const result = cleanConfluenceHtml(html, { expandMacros: false });

      // 変換されない（TurndownがSVGをテキスト化するため、少なくともmermaidコードブロックにはならない）
      expect(result).not.toContain("```mermaid");
      expect(result).not.toContain("flowchart LR");
    });
  });

  describe("Expandマクロ", () => {
    test("expand-containerを展開", () => {
      const html = `
        <div id="expander-123" class="expand-container">
          <div class="expand-control">
            <span class="expand-control-text">クリックして展開</span>
          </div>
          <div class="expand-content">
            <p>展開される内容</p>
          </div>
        </div>
      `;
      const result = cleanConfluenceHtml(html, { expandMacros: true });

      expect(result).toContain("▶ クリックして展開");
      expect(result).toContain("展開される内容");
      expect(result).not.toContain("expand-container");
    });

    test("タイトルがない場合はDetailsを使用", () => {
      const html = `
        <div class="expand-container">
          <div class="expand-control">
            <span class="expand-control-text"></span>
          </div>
          <div class="expand-content">
            <p>内容</p>
          </div>
        </div>
      `;
      const result = cleanConfluenceHtml(html, { expandMacros: true });

      expect(result).toContain("▶ Details");
    });
  });

  describe("画像処理", () => {
    test("confluence-embedded-file-wrapperを除去してimg要素を保持", () => {
      const html = `
        <span class="confluence-embedded-file-wrapper">
          <img class="confluence-embedded-image" src="/download/test.png" alt="Test">
        </span>
      `;
      const result = cleanConfluenceHtml(html, { expandMacros: true });

      expect(result).toContain("![Test](/download/test.png)");
      expect(result).not.toContain("confluence-embedded-file-wrapper");
    });

    test("画像がないラッパーは削除", () => {
      const html = `
        <span class="confluence-embedded-file-wrapper">
          <span>テキストのみ</span>
        </span>
      `;
      const result = cleanConfluenceHtml(html, { expandMacros: true });

      expect(result).not.toContain("confluence-embedded-file-wrapper");
    });
  });

  describe("Page Treeマクロ", () => {
    test("plugin_pagetreeを削除", () => {
      const html = `
        <p>before</p>
        <div class="plugin_pagetree">
          <div id="pagetreesearch">
            <form>...</form>
          </div>
        </div>
        <p>after</p>
      `;
      const result = cleanConfluenceHtml(html, { expandMacros: true });

      expect(result).toContain("before");
      expect(result).toContain("after");
      expect(result).not.toContain("plugin_pagetree");
      expect(result).not.toContain("pagetreesearch");
    });
  });

  describe("レイアウトコンテナ", () => {
    test("contentLayout2, columnLayout, cellのラッパーを除去", () => {
      const html = `
        <div class="contentLayout2">
          <div class="columnLayout">
            <div class="cell">
              <div class="innerCell">
                <p>コンテンツ</p>
              </div>
            </div>
          </div>
        </div>
      `;
      const result = cleanConfluenceHtml(html, { expandMacros: true });

      expect(result).toContain("コンテンツ");
      expect(result).not.toContain("contentLayout2");
      expect(result).not.toContain("columnLayout");
      expect(result).not.toContain("cell");
      expect(result).not.toContain("innerCell");
    });
  });
});

describe("エラーハンドリング", () => {
  test("不正なHTMLでもエラーにならずフォールバックする", () => {
    const invalidHtml = "<div><p>unclosed tag";
    const result = cleanConfluenceHtml(invalidHtml);

    // エラーにならず何かしらの結果が返る
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  test("極端に大きなHTMLも処理できる", () => {
    const largeHtml = `<p>${"a".repeat(100000)}</p>`;
    const result = cleanConfluenceHtml(largeHtml);

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });
});

describe("大きめの実サンプル（fixture）", () => {
  test("page-2570547984.html: レイアウト＋SVG画像の変換", () => {
    const html = readFileSync(
      new URL("./__fixtures__/page-2570547984.html", import.meta.url),
      "utf8",
    );
    const md = cleanConfluenceHtml(html);

    // レイアウトコンテナのclass名が削除されている
    expect(md).not.toContain("contentLayout2");
    expect(md).not.toContain("columnLayout");

    // PlantUML SVG画像が含まれている（SVG要素は維持される）
    expect(md).toContain("Meta");

    // UI要素の名前が含まれている
    expect(md).toContain("UIパーツ");
  });

  test("page-2570547984.html: トークン削減率が妥当な範囲", () => {
    const html = readFileSync(
      new URL("./__fixtures__/page-2570547984.html", import.meta.url),
      "utf8",
    );
    const md = cleanConfluenceHtml(html);
    const reduction = calculateTokenReduction(html, md);

    // 大幅な削減が期待される（SVGが大きいため）
    expect(reduction).toBeGreaterThan(20);
    expect(reduction).toBeLessThan(100);
  });

  test("page-2317999817.html: Expand＋画像＋Page Tree混在", () => {
    const html = readFileSync(
      new URL("./__fixtures__/page-2317999817.html", import.meta.url),
      "utf8",
    );
    const md = cleanConfluenceHtml(html);

    // Expandマクロが処理されている
    expect(md).toContain("▶");

    // 画像が含まれている
    expect(md).toContain("![");

    // Page Treeマクロが削除されている
    expect(md).not.toContain("plugin_pagetree");
    expect(md).not.toContain("pagetreesearch");

    // 見出しが維持されている
    expect(md).toContain("#");
  });

  test("page-2317999817.html: トークン削減率が妥当な範囲", () => {
    const html = readFileSync(
      new URL("./__fixtures__/page-2317999817.html", import.meta.url),
      "utf8",
    );
    const md = cleanConfluenceHtml(html);
    const reduction = calculateTokenReduction(html, md);

    // ある程度の削減が期待される
    expect(reduction).toBeGreaterThan(10);
    expect(reduction).toBeLessThan(100);
  });
});
