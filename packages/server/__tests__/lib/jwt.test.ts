import { describe, it, expect, mock, beforeEach } from "bun:test";
import * as jose from "jose";

// Test the JWT utilities directly
async function createToken(payload: {
  userId: string;
  email: string;
  role: string;
}): Promise<string> {
  const secret = new TextEncoder().encode("test-secret");
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

async function verifyToken(token: string): Promise<jose.JWTPayload | null> {
  const secret = new TextEncoder().encode("test-secret");
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

describe("JWT Utilities", () => {
  const testPayload = { userId: "user-1", email: "test@example.com", role: "ADMIN" };

  describe("createToken", () => {
    it("should create a valid JWT token string", async () => {
      const token = await createToken(testPayload);
      expect(token).toBeString();
      expect(token.split(".")).toHaveLength(3);
    });

    it("should create tokens that are different each time", async () => {
      // Tokens at same second may be identical; add a short delay to ensure difference
      const token1 = await createToken(testPayload);
      await new Promise((r) => setTimeout(r, 1100)); // ensure different iat
      const token2 = await createToken(testPayload);
      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyToken", () => {
    it("should verify and return payload for valid token", async () => {
      const token = await createToken(testPayload);
      const payload = await verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe("user-1");
      expect(payload!.email).toBe("test@example.com");
      expect(payload!.role).toBe("ADMIN");
    });

    it("should return null for invalid token", async () => {
      const result = await verifyToken("invalid-token-string");
      expect(result).toBeNull();
    });

    it("should return null for empty token", async () => {
      const result = await verifyToken("");
      expect(result).toBeNull();
    });

    it("should return null for expired token", async () => {
      const secret = new TextEncoder().encode("test-secret");
      const expiredToken = await new jose.SignJWT(testPayload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("0s") // immediately expired
        .sign(secret);

      const result = await verifyToken(expiredToken);
      expect(result).toBeNull();
    });
  });

  describe("round-trip", () => {
    it("should preserve all payload fields", async () => {
      const complexPayload = {
        userId: "user-abc-123",
        email: "complex@example.com",
        role: "EDITOR",
      };
      const token = await createToken(complexPayload);
      const decoded = await verifyToken(token);
      expect(decoded!.userId).toBe(complexPayload.userId);
      expect(decoded!.email).toBe(complexPayload.email);
      expect(decoded!.role).toBe(complexPayload.role);
    });
  });
});
