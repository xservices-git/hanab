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

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      include: { profile: true },
    });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    return res.status(200).json({
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        fullName: user.profile?.fullName || user.name || null,
        citizenId: user.profile?.citizenId || null,
        address: user.profile?.address || null,
        birthDate: user.profile?.dateOfBirth || null,
        gender: user.profile?.gender || null,
        job: user.profile?.jobTitle || null,
        income: user.profile?.monthlyIncome || null,
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e instanceof Error ? e.message : 'Internal error' });
  }
}