/**
 * ツリー構築ヘルパー
 *
 * CQL検索結果からページツリーを構築します。
 */

import type { Ancestor, SearchResult } from "./confluence-api.ts";

/**
 * ページツリーのノード
 */
export interface PageNode {
  id: string;
  title: string;
  description?: string;
  excerpt?: string;
  children: PageNode[];
}

/**
 * 親子関係マップを作成
 *
 * ancestors配列から親子関係を抽出します。
 * ancestorsの最後の要素が直接の親ページです。
 */
function buildParentMap(
  results: SearchResult[],
): Map<string, string | undefined> {
  const parentMap = new Map<string, string | undefined>();

  for (const result of results) {
    const pageId = result.content.id;
    const ancestors = result.content.ancestors || [];

    // ancestorsの最後の要素が直接の親
    const directParent =
      ancestors.length > 0 ? ancestors[ancestors.length - 1] : undefined;
    parentMap.set(pageId, directParent?.id);
  }

  return parentMap;
}

/**
 * SearchResultからPageNodeを作成
 */
function createPageNode(result: SearchResult): PageNode {
  return {
    id: result.content.id,
    title: result.title,
    excerpt: result.excerpt,
    children: [],
  };
}

/**
 * SearchResult配列からページツリーを構築
 *
 * @param results - CQL検索結果
 * @returns ルートノードの配列
 */
export function buildPageTree(results: SearchResult[]): PageNode[] {
  // PageNodeマップを作成
  const nodeMap = new Map<string, PageNode>();
  for (const result of results) {
    nodeMap.set(result.content.id, createPageNode(result));
  }

  // 親子関係マップを作成
  const parentMap = buildParentMap(results);

  // ルートノードの配列
  const rootNodes: PageNode[] = [];

  // 各ノードを親にぶら下げる、または ルートに追加
  for (const [pageId, parentId] of parentMap.entries()) {
    const node = nodeMap.get(pageId);
    if (!node) continue;

    if (!parentId) {
      // 親がいない → ルートノード
      rootNodes.push(node);
    } else {
      // 親がいる → 親の children に追加
      const parent = nodeMap.get(parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // 親が検索結果に含まれていない → ルートとして扱う
        rootNodes.push(node);
      }
    }
  }

  return rootNodes;
}

/**
 * 特定のページ配下のサブツリーを抽出
 *
 * @param tree - ページツリー
 * @param pageId - 起点となるページID
 * @returns サブツリー、またはページが見つからない場合は null
 */
export function extractSubTree(
  tree: PageNode[],
  pageId: string,
): PageNode | null {
  for (const node of tree) {
    if (node.id === pageId) {
      return node;
    }

    // 子ノードを再帰的に検索
    const found = extractSubTree(node.children, pageId);
    if (found) {
      return found;
    }
  }

  return null;
}
