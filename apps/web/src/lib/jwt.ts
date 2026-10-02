import * as jose from 'jose';
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'vay365-secret-key-change-in-production');
const alg = 'HS256';
export async function signToken(payload: Record<string, any>, expiresIn = '7d') {
  return await new jose.SignJWT(payload).setProtectedHeader({ alg }).setIssuedAt().setExpirationTime(expiresIn).sign(secret);
}
export async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch { return null; }
}
