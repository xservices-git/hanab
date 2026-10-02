import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { RegisterSchema, ApiResponse } from '@vay365/shared';
import { hashPassword } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Dữ liệu không hợp lệ' });
  }

  const { phone, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return res.status(409).json({ ok: false, error: 'Số điện thoại đã được đăng ký' });
  }

  const sanitizedName = name?.trim().replace(/<[^>]*>/g, '') || null;
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { phone, passwordHash, name: sanitizedName },
  });

  const token = await signToken({ id: user.id, email: user.email, phone: user.phone, role: user.role });

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    `token=${token}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
  ]);

  return res.status(201).json({
    ok: true,
    data: {
      user: { id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role },
      token,
    },
  });
}
