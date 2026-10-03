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

    if (req.method === 'GET') {
      const profile = await prisma.customerProfile.findUnique({
        where: { userId: payload.id as string },
        include: { bankAccounts: { orderBy: { isPrimary: 'desc' } } },
      });
      const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        select: { name: true, phone: true },
      });
      return res.status(200).json({
        ok: true,
        data: {
          fullName: profile?.fullName || user?.name || null,
          phone: user?.phone || null,
          banks: profile?.bankAccounts || [],
        },
      });
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('profile bank api error', error);
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
}