import type { NextApiRequest, NextApiResponse } from 'next';
import type { ApiResponse } from '@vay365/shared';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const actor = await requireRole(req, ['admin']);
  if (!actor) return res.status(403).json({ ok: false, error: 'Forbidden' });
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const logs = await prisma.activityLog.findMany({
    include: { user: { select: { id: true, name: true, phone: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return res.status(200).json({ ok: true, data: logs });
}
