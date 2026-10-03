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
    if (payload.role !== 'admin') return res.status(403).json({ ok: false, error: 'Chỉ admin' });

    if (req.method === 'POST') {
      const { customerId, type, amount, reason } = req.body || {};
      if (!customerId) return res.status(400).json({ ok: false, error: 'Thiếu khách hàng' });
      if (!['credit', 'debit'].includes(type)) return res.status(400).json({ ok: false, error: 'Loại giao dịch không hợp lệ' });
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ ok: false, error: 'Số tiền phải > 0' });
      if (!reason || !String(reason).trim()) return res.status(400).json({ ok: false, error: 'Vui lòng nhập lý do' });

      const user = await prisma.user.findUnique({ where: { id: String(customerId) } });
      if (!user) return res.status(404).json({ ok: false, error: 'Không tìm thấy khách hàng' });

      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: type === 'credit' ? 'credit' : 'debit',
          amount: amt,
          reason: String(reason).trim(),
          createdById: String(payload.id),
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: String(payload.id),
          action: 'transaction.create',
          resource: 'Transaction',
          resourceId: tx.id,
          metadata: { customerId: user.id, type: tx.type, amount: tx.amount, reason: tx.reason },
        },
      });

      return res.status(200).json({ ok: true, data: tx });
    }

    if (req.method === 'GET') {
      const { customerId } = req.query;
      if (!customerId) return res.status(400).json({ ok: false, error: 'Thiếu customerId' });
      const items = await prisma.transaction.findMany({
        where: { userId: String(customerId) },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: { createdBy: { select: { id: true, name: true, phone: true } } },
      });
      return res.status(200).json({ ok: true, data: items });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e instanceof Error ? e.message : 'Internal error' });
  }
}
