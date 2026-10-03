import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { ApiResponse } from '@vay365/shared';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const payload = await verifyToken(token);
    if (!payload) return res.status(401).json({ ok: false, error: 'Invalid token' });

    if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const items = await prisma.transaction.findMany({
      where: { userId: String(payload.id) },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { createdBy: { select: { id: true, name: true, phone: true } } },
    });
    return res.status(200).json({ ok: true, data: items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e instanceof Error ? e.message : 'Internal error' });
  }
}