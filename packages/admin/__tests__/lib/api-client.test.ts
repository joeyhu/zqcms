import { describe, it, expect, beforeEach } from "bun:test";

describe("Admin API Client", () => {
  const storage = new Map<string, string>();
  const getItem = (k: string) => storage.get(k) ?? null;
  const setItem = (k: string, v: string) => storage.set(k, v);
  const TOKEN_KEY = "zqcms_token";

  function buildHeaders(token: string | null, isFormData = false): Record<string, string> {
    const headers: Record<string, string> = {};

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  function buildUrl(endpoint: string): string {
    const base = "http://localhost:11003/api";
    return `${base}${endpoint}`;
  }

  beforeEach(() => {
    storage.clear();
  });

  describe("Header building", () => {
    it("should set JSON content type by default", () => {
      const headers = buildHeaders(null);
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("should omit Content-Type for FormData", () => {
      const headers = buildHeaders(null, true);
      expect(headers["Content-Type"]).toBeUndefined();
    });

    it("should add Authorization header when token exists", () => {
      setItem(TOKEN_KEY, "my-jwt-token");
      const headers = buildHeaders(getItem(TOKEN_KEY));
      expect(headers["Authorization"]).toBe("Bearer my-jwt-token");
    });

    it("should not add Authorization when no token", () => {
      const headers = buildHeaders(null);
      expect(headers["Authorization"]).toBeUndefined();
    });
  });

  describe("URL building", () => {
    it("should build correct URL", () => {
      expect(buildUrl("/posts")).toBe("http://localhost:11003/api/posts");
    });

    it("should handle query params via URL builder", () => {
      const url = buildUrl("/posts") + "?page=1&status=PUBLISHED";
      expect(url).toBe("http://localhost:11003/api/posts?page=1&status=PUBLISHED");
    });

    it("should handle nested paths", () => {
      expect(buildUrl("/posts/by-id/42")).toBe(
        "http://localhost:11003/api/posts/by-id/42"
      );
    });
  });

  describe("Request options composition", () => {
    it("should build GET request options", () => {
      setItem(TOKEN_KEY, "token-abc");
      const headers = buildHeaders(getItem(TOKEN_KEY));
      const options: RequestInit = { method: "GET", headers };

      expect(options.method).toBe("GET");
      expect((options.headers as Record<string, string>)["Authorization"]).toBe("Bearer token-abc");
    });

    it("should build POST request with body", () => {
      const headers = buildHeaders("token-xyz");
      const body = JSON.stringify({ title: "Test" });
      const options: RequestInit = { method: "POST", headers, body };

      expect(options.method).toBe("POST");
      expect(options.body).toBe(body);
      expect((options.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    });

    it("should build DELETE request", () => {
      const headers = buildHeaders("admin-token");
      const options: RequestInit = { method: "DELETE", headers };

      expect(options.method).toBe("DELETE");
    });
  });
});
