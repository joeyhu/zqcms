import { describe, it, expect } from "bun:test";
import { BlockType } from "@zqcms/shared/types";
import { BLOCK_TYPE_LABELS } from "@zqcms/shared/constants";

describe("Block Registry", () => {
  describe("BlockType enum", () => {
    it("should have all expected block types", () => {
      const types = Object.values(BlockType);
      expect(types).toContain("HERO");
      expect(types).toContain("FEATURES");
      expect(types).toContain("CTA");
      expect(types).toContain("POST_LIST");
      expect(types).toContain("CATEGORY_LIST");
      expect(types).toContain("FAQ");
      expect(types).toContain("MARKDOWN");
    });

    it("should have labels for all block types", () => {
      for (const type of Object.values(BlockType)) {
        expect(BLOCK_TYPE_LABELS[type]).toBeString();
      }
    });
  });

  describe("Block config validation", () => {
    interface BlockConfig {
      pageType: string;
      blockType: string;
      title?: string | null;
      config?: Record<string, unknown>;
      sortOrder?: number;
      isVisible?: boolean;
    }

    function validateBlockConfig(config: BlockConfig): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      if (!config.pageType || config.pageType.trim().length === 0) {
        errors.push("pageType is required");
      }

      if (!config.blockType || !Object.values(BlockType).includes(config.blockType as BlockType)) {
        errors.push(`Invalid blockType: ${config.blockType}`);
      }

      return { valid: errors.length === 0, errors };
    }

    it("should validate correct HERO config", () => {
      const config: BlockConfig = {
        pageType: "home",
        blockType: "HERO",
        config: { title: "Welcome" },
      };
      expect(validateBlockConfig(config).valid).toBe(true);
    });

    it("should reject missing pageType", () => {
      const config: BlockConfig = { pageType: "", blockType: "HERO" };
      expect(validateBlockConfig(config).valid).toBe(false);
    });

    it("should reject invalid blockType", () => {
      const config: BlockConfig = { pageType: "home", blockType: "INVALID" };
      expect(validateBlockConfig(config).valid).toBe(false);
    });

    it("should validate all valid block types", () => {
      for (const type of Object.values(BlockType)) {
        const config: BlockConfig = { pageType: "home", blockType: type };
        expect(validateBlockConfig(config).valid).toBe(true);
      }
    });
  });

  describe("Default config generation", () => {
    function getDefaultConfig(blockType: string): Record<string, unknown> {
      switch (blockType) {
        case "HERO":
          return { title: "", subtitle: "", ctaText: "", ctaLink: "/" };
        case "FEATURES":
          return { columns: 3, items: [] };
        case "POST_LIST":
          return { limit: 6, layout: "grid", columns: 3 };
        case "FAQ":
          return { items: [] };
        case "MARKDOWN":
          return { content: "" };
        default:
          return {};
      }
    }

    it("should return hero defaults", () => {
      const cfg = getDefaultConfig("HERO");
      expect(cfg).toHaveProperty("title");
      expect(cfg).toHaveProperty("ctaLink");
    });

    it("should return features defaults", () => {
      const cfg = getDefaultConfig("FEATURES");
      expect(cfg.columns).toBe(3);
      expect(Array.isArray(cfg.items)).toBe(true);
    });

    it("should return post list defaults", () => {
      const cfg = getDefaultConfig("POST_LIST");
      expect(cfg.limit).toBe(6);
      expect(cfg.layout).toBe("grid");
    });

    it("should return FAQ defaults", () => {
      expect(getDefaultConfig("FAQ")).toEqual({ items: [] });
    });

    it("should return empty for unknown type", () => {
      expect(getDefaultConfig("UNKNOWN")).toEqual({});
    });
  });
});
