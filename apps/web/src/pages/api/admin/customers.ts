import type { NextApiRequest, NextApiResponse } from 'next';
import type { ApiResponse } from '@vay365/shared';
import { prisma } from '@/lib/prisma';
import { requireRole, writeActivity } from '@/lib/api-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const actor = await requireRole(req, ['admin', 'agent']);
  if (!actor) return res.status(403).json({ ok: false, error: 'Forbidden' });
  if (!['GET', 'PATCH'].includes(req.method || '')) return res.status(405).json({ ok: false, error: 'Method not allowed' });

  if (req.method === 'PATCH') {
    if (actor.role !== 'admin') return res.status(403).json({ ok: false, error: 'Forbidden' });
    const { customerId, locked } = req.body || {};
    if (!customerId) return res.status(400).json({ ok: false, error: 'Thiếu customerId' });
    const existing = await prisma.user.findFirst({ where: { id: customerId, role: 'user' } });
    if (!existing) return res.status(404).json({ ok: false, error: 'Không tìm thấy khách hàng' });
    const customer = await prisma.user.update({
      where: { id: customerId },
      data: { lockedUntil: locked ? new Date('9999-12-31T23:59:59.000Z') : null },
      select: { id: true, name: true, phone: true, lockedUntil: true },
    });
    await writeActivity(req, { userId: actor.id, action: locked ? 'customer.lock' : 'customer.unlock', resource: 'user', resourceId: customer.id, metadata: { phone: customer.phone } });
    return res.status(200).json({ ok: true, data: customer });
  }

  const where = actor.role === 'admin'
    ? { role: 'user' as const }
    : { role: 'user' as const, loans: { some: { assignedAgentId: actor.id } } };

  const customers = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      lockedUntil: true,
      lastLoginAt: true,
      createdAt: true,
      profile: {
        include: { kycs: { orderBy: { createdAt: 'desc' }, take: 1 }, bankAccounts: true },
      },
      loans: {
        where: actor.role === 'admin' ? {} : { assignedAgentId: actor.id },
        include: { assignedAgent: { select: { id: true, name: true, phone: true } }, contracts: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return res.status(200).json({ ok: true, data: customers });
}
