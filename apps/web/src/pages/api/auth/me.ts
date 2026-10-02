import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { ApiResponse } from '@vay365/shared';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
  if (!token) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const payload = await verifyToken(token);
  if (!payload || !payload.id) {
    return res.status(401).json({ ok: false, error: 'Invalid token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id as string },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }

  return res.status(200).json({ ok: true, data: user });
}
