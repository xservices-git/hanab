import type { NextApiRequest, NextApiResponse } from 'next';
import type { ApiResponse } from '@vay365/shared';
import { prisma } from '@/lib/prisma';
import { requireRole, writeActivity } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const actor = await requireRole(req, ['admin']);
  if (!actor) return res.status(403).json({ ok: false, error: 'Forbidden' });

  if (req.method === 'GET') {
    const agents = await prisma.user.findMany({
      where: { role: 'agent' },
      select: { id: true, name: true, phone: true, telegramLink: true, role: true, lockedUntil: true, lastLoginAt: true, createdAt: true, _count: { select: { assignedLoans: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ ok: true, data: agents });
  }

  if (req.method === 'POST') {
    const { name, phone, telegramLink, password } = req.body || {};
    if (!phone || !password) return res.status(400).json({ ok: false, error: 'Thiếu phone/password' });
    const agent = await prisma.user.create({
      data: { name, phone, telegramLink: telegramLink || null, passwordHash: await hashPassword(password), role: 'agent' },
      select: { id: true, name: true, phone: true, telegramLink: true, role: true, lockedUntil: true, createdAt: true },
    });
    await writeActivity(req, { userId: actor.id, action: 'agent.create', resource: 'user', resourceId: agent.id, metadata: { phone } });
    return res.status(201).json({ ok: true, data: agent });
  }

  if (req.method === 'PATCH') {
    const { agentId, name, phone, telegramLink, password, locked } = req.body || {};
    if (!agentId) return res.status(400).json({ ok: false, error: 'Thiếu agentId' });

    const existing = await prisma.user.findFirst({ where: { id: agentId, role: 'agent' } });
    if (!existing) return res.status(404).json({ ok: false, error: 'Không tìm thấy nhân viên' });

    const data: any = {};
    if (name !== undefined) data.name = name || null;
    if (phone !== undefined) data.phone = phone || null;
    if (telegramLink !== undefined) data.telegramLink = telegramLink || null;
    if (password) data.passwordHash = await hashPassword(password);
    if (locked !== undefined) data.lockedUntil = locked ? new Date('9999-12-31T23:59:59.000Z') : null;

    const agent = await prisma.user.update({
      where: { id: agentId },
      data,
      select: { id: true, name: true, phone: true, telegramLink: true, role: true, lockedUntil: true, createdAt: true },
    });

    await writeActivity(req, { userId: actor.id, action: 'agent.update', resource: 'user', resourceId: agent.id, metadata: { phone: agent.phone } });
    return res.status(200).json({ ok: true, data: agent });
  }

  if (req.method === 'DELETE') {
    const { agentId } = req.body || {};
    if (!agentId) return res.status(400).json({ ok: false, error: 'Thiếu agentId' });

    const existing = await prisma.user.findFirst({ where: { id: agentId, role: 'agent' }, include: { _count: { select: { assignedLoans: true } } } });
    if (!existing) return res.status(404).json({ ok: false, error: 'Không tìm thấy nhân viên' });
    if (existing._count.assignedLoans > 0) return res.status(400).json({ ok: false, error: 'Nhân viên đang có hồ sơ. Gỡ/gán lại hồ sơ trước khi xoá.' });

    await prisma.user.delete({ where: { id: agentId } });
    await writeActivity(req, { userId: actor.id, action: 'agent.delete', resource: 'user', resourceId: agentId, metadata: { phone: existing.phone } });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}

