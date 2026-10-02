import type { NextApiRequest, NextApiResponse } from 'next';
import type { ApiResponse, LoanStatus } from '@vay365/shared';
import { prisma } from '@/lib/prisma';
import { requireRole, writeActivity } from '@/lib/api-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const actor = await requireRole(req, ['admin', 'agent']);
  if (!actor) return res.status(403).json({ ok: false, error: 'Forbidden' });

  if (req.method === 'GET') {
    const loans = await prisma.loan.findMany({
      where: actor.role === 'admin' ? {} : { assignedAgentId: actor.id },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, profile: { include: { kycs: { orderBy: { createdAt: 'desc' }, take: 1 }, bankAccounts: true } } } },
        assignedAgent: { select: { id: true, name: true, phone: true } },
        contracts: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return res.status(200).json({ ok: true, data: loans });
  }

  if (req.method === 'PATCH') {
    const { loanId, status, assignedAgentId, rejectionReason } = req.body || {};
    if (!loanId) return res.status(400).json({ ok: false, error: 'Thiếu loanId' });

    const existing = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!existing) return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ vay' });
    if (actor.role !== 'admin' && existing.assignedAgentId !== actor.id) return res.status(403).json({ ok: false, error: 'Forbidden' });

    const data: any = {};
    if (status) {
      data.status = status as LoanStatus;
      if (status === 'approved') { data.approvedBy = actor.id; data.approvedAt = new Date(); }
      if (status === 'rejected') { data.rejectedBy = actor.id; data.rejectedAt = new Date(); data.rejectionReason = rejectionReason || null; }
      if (status === 'disbursed') data.disbursedAt = new Date();
    }
    if (actor.role === 'admin' && assignedAgentId !== undefined) data.assignedAgentId = assignedAgentId || null;

    const loan = await prisma.loan.update({
      where: { id: loanId },
      data,
      include: { user: { select: { id: true, name: true, phone: true } }, assignedAgent: { select: { id: true, name: true, phone: true } } },
    });

    await prisma.notification.create({
      data: { userId: loan.userId, type: 'loan', title: 'Hồ sơ vay cập nhật', body: `Trạng thái mới: ${loan.status}`, metadata: { loanId: loan.id } },
    });
    await writeActivity(req, { userId: actor.id, action: 'loan.update', resource: 'loan', resourceId: loan.id, metadata: data });

    return res.status(200).json({ ok: true, data: loan });
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
