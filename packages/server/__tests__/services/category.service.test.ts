import { describe, it, expect } from "bun:test";

describe("Category Service - Pure Logic", () => {
  describe("Tree building", () => {
    interface FlatCategory {
      id: number;
      name: string;
      slug: string;
      parentId: number | null;
      sortOrder: number;
    }

    interface TreeCategory extends FlatCategory {
      children: TreeCategory[];
    }

    function buildTree(cats: FlatCategory[]): TreeCategory[] {
      const map = new Map<number, TreeCategory>();
      const roots: TreeCategory[] = [];

      for (const cat of cats) {
        map.set(cat.id, { ...cat, children: [] });
      }

      for (const cat of cats) {
        const node = map.get(cat.id)!;
        if (cat.parentId && map.has(cat.parentId)) {
          map.get(cat.parentId)!.children.push(node);
        } else {
          roots.push(node);
        }
      }

      return roots;
    }

    it("should build tree from flat list", () => {
      const flat: FlatCategory[] = [
        { id: 1, name: "Docs", slug: "docs", parentId: null, sortOrder: 0 },
        { id: 2, name: "API", slug: "api", parentId: null, sortOrder: 1 },
        { id: 3, name: "Get Started", slug: "docs/start", parentId: 1, sortOrder: 0 },
        { id: 4, name: "Config", slug: "docs/config", parentId: 1, sortOrder: 1 },
      ];

      const tree = buildTree(flat);
      expect(tree).toHaveLength(2);
      expect(tree[0].name).toBe("Docs");
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].name).toBe("Get Started");
      expect(tree[0].children[1].name).toBe("Config");
    });

    it("should handle empty list", () => {
      expect(buildTree([])).toEqual([]);
    });

    it("should handle all top-level categories", () => {
      const flat: FlatCategory[] = [
        { id: 1, name: "A", slug: "a", parentId: null, sortOrder: 0 },
        { id: 2, name: "B", slug: "b", parentId: null, sortOrder: 1 },
        { id: 3, name: "C", slug: "c", parentId: null, sortOrder: 2 },
      ];
      const tree = buildTree(flat);
      expect(tree).toHaveLength(3);
      tree.forEach((t) => expect(t.children).toEqual([]));
    });

    it("should handle deep nesting", () => {
      const flat: FlatCategory[] = [
        { id: 1, name: "L1", slug: "l1", parentId: null, sortOrder: 0 },
        { id: 2, name: "L2", slug: "l1/l2", parentId: 1, sortOrder: 0 },
        { id: 3, name: "L3", slug: "l1/l2/l3", parentId: 2, sortOrder: 0 },
      ];
      const tree = buildTree(flat);
      expect(tree[0].children[0].children[0].name).toBe("L3");
    });
  });

  describe("Sort ordering", () => {
    function sortByOrder<T extends { sortOrder: number; name: string }>(items: T[]): T[] {
      return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    }

    it("should sort by sortOrder ascending", () => {
      const items = [
        { sortOrder: 3, name: "C" },
        { sortOrder: 1, name: "A" },
        { sortOrder: 2, name: "B" },
      ];
      const sorted = sortByOrder(items);
      expect(sorted[0].name).toBe("A");
      expect(sorted[1].name).toBe("B");
      expect(sorted[2].name).toBe("C");
    });

    it("should fallback to name sort when orders equal", () => {
      const items = [
        { sortOrder: 0, name: "B" },
        { sortOrder: 0, name: "A" },
      ];
      expect(sortByOrder(items)[0].name).toBe("A");
    });
  });

  describe("Visibility filtering", () => {
    interface VisibleItem {
      id: number;
      isVisible: boolean;
    }

    function filterVisible(items: VisibleItem[]): VisibleItem[] {
      return items.filter((i) => i.isVisible);
    }

    it("should filter out hidden items", () => {
      const items = [
        { id: 1, isVisible: true },
        { id: 2, isVisible: false },
        { id: 3, isVisible: true },
      ];
      expect(filterVisible(items)).toHaveLength(2);
      expect(filterVisible(items).map((i) => i.id)).toEqual([1, 3]);
    });

    it("should return all when all visible", () => {
      const items = [
        { id: 1, isVisible: true },
        { id: 2, isVisible: true },
      ];
      expect(filterVisible(items)).toHaveLength(2);
    });

    it("should return empty when none visible", () => {
      expect(filterVisible([{ id: 1, isVisible: false }])).toEqual([]);
    });
  });
});
