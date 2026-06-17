import { describe, it, expect, beforeEach } from "bun:test";
import bcrypt from "bcryptjs";

// Mock auth service logic (避免 prisma 依赖)
async function loginLogic(
  findUser: (email: string) => Promise<{
    id: string;
    email: string;
    password: string;
    name: string | null;
    role: string;
  } | null>,
  email: string,
  password: string
) {
  const user = await findUser(email);
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  return {
    token: "mock-jwt-token",
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

describe("Auth Service", () => {
  let mockPassword: string;

  beforeEach(async () => {
    mockPassword = await bcrypt.hash("correct-password", 4);
  });

  it("should login successfully with correct credentials", async () => {
    const findUser = async () => ({
      id: "user-1", email: "admin@test.com", password: mockPassword,
      name: "Admin", role: "ADMIN",
    });

    const result = await loginLogic(findUser, "admin@test.com", "correct-password");
    expect(result.user.id).toBe("user-1");
    expect(result.user.role).toBe("ADMIN");
    expect(result.token).toBeString();
  });

  it("should throw with wrong password", async () => {
    const findUser = async () => ({
      id: "user-1", email: "admin@test.com", password: mockPassword,
      name: "Admin", role: "ADMIN",
    });

    await expect(loginLogic(findUser, "admin@test.com", "wrong-password"))
      .rejects.toThrow("Invalid credentials");
  });

  it("should throw with non-existent user", async () => {
    const findUser = async () => null;
    await expect(loginLogic(findUser, "nobody@test.com", "any"))
      .rejects.toThrow("Invalid credentials");
  });

  it("should not expose password in response", async () => {
    const findUser = async () => ({
      id: "u2", email: "e@t.com", password: mockPassword,
      name: "Ed", role: "EDITOR",
    });

    const result = await loginLogic(findUser, "e@t.com", "correct-password");
    expect(result.user).not.toHaveProperty("password");
  });
});
