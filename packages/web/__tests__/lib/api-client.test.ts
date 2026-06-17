import { describe, it, expect } from "bun:test";

describe("API Client - Web", () => {
  describe("URL construction", () => {
    const API_BASE = "http://localhost:11003/api";

    function buildUrl(endpoint: string, params?: Record<string, string>): string {
      const url = `${API_BASE}${endpoint}`;
      if (!params) return url;
      const qs = new URLSearchParams(params).toString();
      return qs ? `${url}?${qs}` : url;
    }

    it("should build base URL correctly", () => {
      expect(buildUrl("/posts")).toBe("http://localhost:11003/api/posts");
    });

    it("should append query parameters", () => {
      expect(buildUrl("/posts", { page: "1", status: "PUBLISHED" }))
        .toBe("http://localhost:11003/api/posts?page=1&status=PUBLISHED");
    });

    it("should handle empty params", () => {
      expect(buildUrl("/categories", {})).toBe("http://localhost:11003/api/categories");
    });

    it("should handle nested paths", () => {
      expect(buildUrl("/posts/docs/getting-started"))
        .toBe("http://localhost:11003/api/posts/docs/getting-started");
    });

    it("should URL-encode special characters", () => {
      const result = buildUrl("/search", { q: "hello world & more" });
      expect(result).toContain("hello+world+%26+more");
    });
  });

  describe("Response handling", () => {
    function parseApiResponse(body: unknown): { success: boolean; data?: unknown } {
      if (typeof body === "object" && body !== null && "success" in body) {
        return body as { success: boolean; data?: unknown };
      }
      return { success: false };
    }

    it("should parse success response", () => {
      const res = parseApiResponse({ success: true, data: { id: 1 } });
      expect(res.success).toBe(true);
      expect(res.data).toEqual({ id: 1 });
    });

    it("should parse error response", () => {
      const res = parseApiResponse({ success: false, error: "Not found" });
      expect(res.success).toBe(false);
    });

    it("should handle non-standard response", () => {
      const res = parseApiResponse("plain text");
      expect(res.success).toBe(false);
    });

    it("should handle null response", () => {
      const res = parseApiResponse(null);
      expect(res.success).toBe(false);
    });
  });

  describe("Pagination response parsing", () => {
    function parsePageParams(page?: string, pageSize?: string): { page: number; pageSize: number } {
      return {
        page: page ? Math.max(1, parseInt(page, 10) || 1) : 1,
        pageSize: pageSize ? Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20)) : 20,
      };
    }

    it("should use defaults", () => {
      expect(parsePageParams()).toEqual({ page: 1, pageSize: 20 });
    });

    it("should parse valid numbers", () => {
      expect(parsePageParams("3", "10")).toEqual({ page: 3, pageSize: 10 });
    });

    it("should clamp page to minimum 1", () => {
      expect(parsePageParams("-1", "20")).toEqual({ page: 1, pageSize: 20 });
    });

    it("should clamp pageSize to maximum 100", () => {
      expect(parsePageParams("1", "200")).toEqual({ page: 1, pageSize: 100 });
    });

    it("should handle invalid strings", () => {
      expect(parsePageParams("abc", "xyz")).toEqual({ page: 1, pageSize: 20 });
    });
  });
});
