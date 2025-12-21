import * as cheerio from "cheerio";

/**
 * PlantUML SVGをMermaid flowchartに変換
 * @param svgHtml SVG要素のHTML文字列
 * @returns Mermaidコード（変換失敗時は空文字列）
 */
export function processSvgToMermaid(svgHtml: string): string {
  try {
    const $ = cheerio.load(svgHtml, { xml: true });

    // ノード情報を抽出
    interface Node {
      id: string; // SVG要素のid属性（例: node1, node2）
      title: string; // <title>のテキスト（例: Meta, /-PC）
      label: string; // 表示ラベル（例: Meta, /-PC）
    }
    const nodes: Node[] = [];
    $("g.node").each((_, el) => {
      const nodeId = $(el).attr("id"); // SVGのid属性を取得
      const title = $(el).find("title").first().text().trim();
      const text = $(el).find("text").first().text().trim();
      if (nodeId && title) {
        nodes.push({ id: nodeId, title, label: text || title });
      }
    });

    // タイトルからノードIDへのマップを作成
    const titleToIdMap = new Map<string, string>();
    for (const node of nodes) {
      titleToIdMap.set(node.title, node.id);
    }

    // エッジ情報を抽出
    interface Edge {
      from: string; // ノードID（例: node1）
      to: string; // ノードID（例: node2）
    }
    const edges: Edge[] = [];
    $("g.edge").each((_, el) => {
      const title = $(el).find("title").first().text().trim();
      // タイトル形式: "A->B" または "A-->B"
      const match = title.match(/^(.+?)-+>(.+)$/);
      if (match) {
        const fromTitle = match[1].trim();
        const toTitle = match[2].trim();
        const fromId = titleToIdMap.get(fromTitle);
        const toId = titleToIdMap.get(toTitle);
        if (fromId && toId) {
          edges.push({ from: fromId, to: toId });
        }
      }
    });

    // ノードやエッジがない場合は変換しない
    if (nodes.length === 0 && edges.length === 0) {
      return "";
    }

    // Mermaid flowchart生成
    const lines: string[] = ["flowchart LR"];

    // ノード定義
    for (const node of nodes) {
      // ラベルに特殊文字が含まれる場合は["..."]で囲む
      const label = node.label.includes('"')
        ? node.label.replace(/"/g, "&quot;")
        : node.label;
      lines.push(`    ${node.id}["${label}"]`);
    }

    // エッジ定義
    for (const edge of edges) {
      lines.push(`    ${edge.from} --> ${edge.to}`);
    }

    return lines.join("\n");
  } catch (error) {
    console.warn("Failed to convert SVG to Mermaid:", error);
    return "";
  }
}
