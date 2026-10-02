import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { LoginSchema, ApiResponse } from '@vay365/shared';
import { comparePassword } from '@/lib/auth';

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  entry.count++;
  return entry.count > 5;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (checkRateLimit(ip)) {
    return res.status(429).json({ ok: false, error: 'Quá nhiều lần đăng nhập. Thử lại sau 15 phút.' });
  }

  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Số điện thoại hoặc mật khẩu không hợp lệ' });
  }

  const { phone, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Số điện thoại hoặc mật khẩu không đúng' });
  }

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    return res.status(423).json({ ok: false, error: 'Tài khoản bị khóa tạm thời. Thử lại sau.' });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    const failedCount = (user.failedLoginAttempts || 0) + 1;
    const updateData: any = { failedLoginAttempts: failedCount };
    if (failedCount >= 5) {
      updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
    await prisma.user.update({ where: { id: user.id }, data: updateData });
    return res.status(401).json({ ok: false, error: 'Số điện thoại hoặc mật khẩu không đúng' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const token = await signToken({ id: user.id, email: user.email, phone: user.phone, role: user.role });

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    `token=${token}; Path=/; HttpOnly${secure}; SameSite=Strict; Max-Age=${7 * 24 * 3600}`,
  ]);

  return res.status(200).json({
    ok: true,
    data: {
      user: { id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role },
      token,
    },
  });
}
