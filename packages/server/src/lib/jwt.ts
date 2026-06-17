import * as jose from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'zqcms-jwt-secret-change-in-production-2024'
);

export async function createToken(payload: { userId: string; email: string; role: string }): Promise<string> {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<jose.JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
