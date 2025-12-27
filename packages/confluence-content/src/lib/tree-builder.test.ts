/**
 * Tree Builder - Unit Tests
 *
 * ツリー構築ヘルパーの単体テスト
 */

import { describe, expect, test } from "bun:test";
import type { SearchResult } from "./confluence-api.js";
import { buildPageTree, extractSubTree } from "./tree-builder.js";

describe("Tree Builder", () => {
  describe("buildPageTree", () => {
    test("空の配列からは空のツリーを返す", () => {
      const results: SearchResult[] = [];
      const tree = buildPageTree(results);

      expect(tree).toEqual([]);
    });

    test("親のないページはルートノードになる", () => {
      const results: SearchResult[] = [
        {
          content: {
            id: "1",
            type: "page",
            title: "Root Page",
            ancestors: [],
          },
          title: "Root Page",
          excerpt: "Root excerpt",
        },
      ];

      const tree = buildPageTree(results);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe("1");
      expect(tree[0].title).toBe("Root Page");
      expect(tree[0].excerpt).toBe("Root excerpt");
      expect(tree[0].children).toEqual([]);
    });

    test("親子関係を正しく構築する", () => {
      const results: SearchResult[] = [
        {
          content: {
            id: "1",
            type: "page",
            title: "Root",
            ancestors: [],
          },
          title: "Root",
        },
        {
          content: {
            id: "2",
            type: "page",
            title: "Child",
            ancestors: [{ id: "1", type: "page", title: "Root" }],
          },
          title: "Child",
        },
      ];

      const tree = buildPageTree(results);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe("1");
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].id).toBe("2");
      expect(tree[0].children[0].title).toBe("Child");
    });

    test("複数階層のツリーを構築する", () => {
      const results: SearchResult[] = [
        {
          content: {
            id: "1",
            type: "page",
            title: "Root",
            ancestors: [],
          },
          title: "Root",
        },
        {
          content: {
            id: "2",
            type: "page",
            title: "Child",
            ancestors: [{ id: "1", type: "page", title: "Root" }],
          },
          title: "Child",
        },
        {
          content: {
            id: "3",
            type: "page",
            title: "Grandchild",
            ancestors: [
              { id: "1", type: "page", title: "Root" },
              { id: "2", type: "page", title: "Child" },
            ],
          },
          title: "Grandchild",
        },
      ];

      const tree = buildPageTree(results);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe("1");
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].id).toBe("2");
      expect(tree[0].children[0].children).toHaveLength(1);
      expect(tree[0].children[0].children[0].id).toBe("3");
    });

    test("バラバラな順序でもツリーを構築する", () => {
      // 子、親、孫の順で提供
      const results: SearchResult[] = [
        {
          content: {
            id: "2",
            type: "page",
            title: "Child",
            ancestors: [{ id: "1", type: "page", title: "Root" }],
          },
          title: "Child",
        },
        {
          content: {
            id: "1",
            type: "page",
            title: "Root",
            ancestors: [],
          },
          title: "Root",
        },
        {
          content: {
            id: "3",
            type: "page",
            title: "Grandchild",
            ancestors: [
              { id: "1", type: "page", title: "Root" },
              { id: "2", type: "page", title: "Child" },
            ],
          },
          title: "Grandchild",
        },
      ];

      const tree = buildPageTree(results);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe("1");
      expect(tree[0].children[0].id).toBe("2");
      expect(tree[0].children[0].children[0].id).toBe("3");
    });

    test("親が検索結果に含まれない場合、ルートとして扱う", () => {
      const results: SearchResult[] = [
        {
          content: {
            id: "2",
            type: "page",
            title: "Orphan",
            ancestors: [{ id: "999", type: "page", title: "Missing Parent" }],
          },
          title: "Orphan",
        },
      ];

      const tree = buildPageTree(results);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe("2");
      expect(tree[0].title).toBe("Orphan");
    });

    test("複数のルートノードを持つツリーを構築する", () => {
      const results: SearchResult[] = [
        {
          content: {
            id: "1",
            type: "page",
            title: "Root1",
            ancestors: [],
          },
          title: "Root1",
        },
        {
          content: {
            id: "2",
            type: "page",
            title: "Root2",
            ancestors: [],
          },
          title: "Root2",
        },
      ];

      const tree = buildPageTree(results);

      expect(tree).toHaveLength(2);
      expect(tree[0].id).toBe("1");
      expect(tree[1].id).toBe("2");
    });
  });

  describe("extractSubTree", () => {
    test("ルートノードから取得できる", () => {
      const tree = [
        {
          id: "1",
          title: "Root",
          children: [
            {
              id: "2",
              title: "Child",
              children: [],
            },
          ],
        },
      ];

      const subTree = extractSubTree(tree, "1");

      expect(subTree).not.toBeNull();
      if (subTree) {
        expect(subTree.id).toBe("1");
        expect(subTree.children).toHaveLength(1);
      }
    });

    test("子ノードから取得できる", () => {
      const tree = [
        {
          id: "1",
          title: "Root",
          children: [
            {
              id: "2",
              title: "Child",
              children: [
                {
                  id: "3",
                  title: "Grandchild",
                  children: [],
                },
              ],
            },
          ],
        },
      ];

      const subTree = extractSubTree(tree, "2");

      expect(subTree).not.toBeNull();
      if (subTree) {
        expect(subTree.id).toBe("2");
        expect(subTree.title).toBe("Child");
        expect(subTree.children).toHaveLength(1);
      }
    });

    test("存在しないIDの場合、nullを返す", () => {
      const tree = [
        {
          id: "1",
          title: "Root",
          children: [],
        },
      ];

      const subTree = extractSubTree(tree, "999");

      expect(subTree).toBeNull();
    });

    test("深い階層からも取得できる", () => {
      const tree = [
        {
          id: "1",
          title: "Root",
          children: [
            {
              id: "2",
              title: "Child",
              children: [
                {
                  id: "3",
                  title: "Grandchild",
                  children: [
                    {
                      id: "4",
                      title: "Great-grandchild",
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const subTree = extractSubTree(tree, "4");

      expect(subTree).not.toBeNull();
      if (subTree) {
        expect(subTree.id).toBe("4");
        expect(subTree.title).toBe("Great-grandchild");
      }
    });
  });
});
