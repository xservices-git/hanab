import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { ApiResponse } from '@vay365/shared';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  const payload = await verifyToken(token);
  if (!payload) return res.status(401).json({ ok: false, error: 'Invalid token' });

  const userId = payload.id as string;
  const isAdmin = payload.role === 'admin';

  const [totalLoans, totalAmount, pendingLoans] = await Promise.all([
    prisma.loan.count({ where: isAdmin ? {} : { userId } }),
    prisma.loan.aggregate({ _sum: { amount: true }, where: isAdmin ? {} : { userId } }),
    prisma.loan.count({ where: { ...(isAdmin ? {} : { userId }), status: { in: ['submitted', 'reviewing'] } } }),
  ]);

  return res.status(200).json({ ok: true, data: { totalLoans, totalAmount: totalAmount._sum.amount || 0, pendingLoans } });
}
