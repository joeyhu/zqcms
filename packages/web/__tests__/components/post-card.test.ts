import { describe, it, expect } from "bun:test";

describe("PostCard Component Logic", () => {
  interface PostCardData {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    coverImage?: string | null;
    publishedAt?: string | null;
    category?: { name: string; slug: string } | null;
  }

  function formatPostDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  }

  function getPostUrl(post: PostCardData): string {
    return `/${post.category?.slug || "uncategorized"}/${post.slug}`;
  }

  function truncateExcerpt(excerpt: string | null | undefined, maxLength = 120): string {
    if (!excerpt) return "";
    return excerpt.length > maxLength ? excerpt.slice(0, maxLength) + "..." : excerpt;
  }

  describe("Date formatting", () => {
    it("should format valid date", () => {
      const result = formatPostDate("2024-06-15T10:00:00.000Z");
      expect(result).toBeString();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return empty for null date", () => {
      expect(formatPostDate(null)).toBe("");
    });

    it("should return empty for undefined date", () => {
      expect(formatPostDate(undefined)).toBe("");
    });
  });

  describe("URL generation", () => {
    it("should generate URL with category", () => {
      const post: PostCardData = {
        id: 1, title: "Test", slug: "test-post",
        category: { name: "Docs", slug: "docs" },
      };
      expect(getPostUrl(post)).toBe("/docs/test-post");
    });

    it("should use fallback when no category", () => {
      const post: PostCardData = {
        id: 1, title: "Test", slug: "test-post", category: null,
      };
      expect(getPostUrl(post)).toBe("/uncategorized/test-post");
    });
  });

  describe("Excerpt truncation", () => {
    it("should return empty for null", () => {
      expect(truncateExcerpt(null)).toBe("");
    });

    it("should return full short excerpt", () => {
      expect(truncateExcerpt("Short excerpt")).toBe("Short excerpt");
    });

    it("should truncate long excerpt", () => {
      const long = "A".repeat(200);
      const truncated = truncateExcerpt(long);
      expect(truncated.endsWith("...")).toBe(true);
      expect(truncated.length).toBe(123); // 120 + "..."
    });

    it("should respect custom maxLength", () => {
      expect(truncateExcerpt("Hello World", 5)).toBe("Hello...");
    });
  });
});
