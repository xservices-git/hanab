import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { ApiResponse } from '@vay365/shared';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') return res.status(403).json({ ok: false, error: 'Forbidden' });
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  return res.status(200).json({ ok: true, data: users });
}
