import type { NextApiRequest, NextApiResponse } from 'next';
import type { ApiResponse } from '@vay365/shared';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/api-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ ok: false, error: 'Unauthorized' });

  if (req.method === 'GET') {
    const notifications = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
    return res.status(200).json({ ok: true, data: notifications });
  }

  if (req.method === 'PATCH') {
    const { notificationId } = req.body || {};
    await prisma.notification.updateMany({
      where: { userId: user.id, ...(notificationId ? { id: notificationId } : {}) },
      data: { readAt: new Date() },
    });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
