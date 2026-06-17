import { describe, it, expect, beforeEach } from "bun:test";

describe("Admin Auth Utilities", () => {
  // Mock localStorage
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
  });

  const getItem = (key: string): string | null => storage.get(key) ?? null;
  const setItem = (key: string, value: string) => storage.set(key, value);
  const removeItem = (key: string) => storage.delete(key);

  const TOKEN_KEY = "zqcms_token";
  const USER_KEY = "zqcms_user";

  function getToken(): string | null {
    return getItem(TOKEN_KEY);
  }

  function getUser(): { email: string; role: string } | null {
    const raw = getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function isAuthenticated(): boolean {
    return !!getToken();
  }

  function isAdmin(): boolean {
    const user = getUser();
    return user?.role === "ADMIN";
  }

  function login(token: string, user: { email: string; role: string }) {
    setItem(TOKEN_KEY, token);
    setItem(USER_KEY, JSON.stringify(user));
  }

  function logout() {
    removeItem(TOKEN_KEY);
    removeItem(USER_KEY);
  }

  describe("Token management", () => {
    it("should return null when no token stored", () => {
      expect(getToken()).toBeNull();
    });

    it("should store and retrieve token", () => {
      setItem(TOKEN_KEY, "test-jwt-token");
      expect(getToken()).toBe("test-jwt-token");
    });

    it("should remove token on logout", () => {
      setItem(TOKEN_KEY, "test-token");
      logout();
      expect(getToken()).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("should return false without token", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("should return true with token", () => {
      setItem(TOKEN_KEY, "some-token");
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe("isAdmin", () => {
    it("should return false without user", () => {
      expect(isAdmin()).toBe(false);
    });

    it("should return true for ADMIN role", () => {
      setItem(USER_KEY, JSON.stringify({ email: "a@b.com", role: "ADMIN" }));
      expect(isAdmin()).toBe(true);
    });

    it("should return false for EDITOR role", () => {
      setItem(USER_KEY, JSON.stringify({ email: "e@b.com", role: "EDITOR" }));
      expect(isAdmin()).toBe(false);
    });
  });

  describe("login/logout flow", () => {
    it("should store token and user on login", () => {
      login("jwt-token-123", { email: "admin@test.com", role: "ADMIN" });
      expect(getToken()).toBe("jwt-token-123");
      expect(getUser()?.email).toBe("admin@test.com");
    });

    it("should clear everything on logout", () => {
      login("token", { email: "a@b.com", role: "ADMIN" });
      logout();
      expect(getToken()).toBeNull();
      expect(getUser()).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe("getUser safety", () => {
    it("should handle corrupted JSON", () => {
      setItem(USER_KEY, "not-valid-json{{{");
      expect(getUser()).toBeNull();
    });

    it("should handle empty user data", () => {
      setItem(USER_KEY, "");
      expect(getUser()).toBeNull();
    });
  });
});
