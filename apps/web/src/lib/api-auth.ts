import type { NextApiRequest } from 'next';
import { prisma } from './prisma';
import { verifyToken } from './jwt';
import type { UserRole } from '@vay365/shared';

export async function getCurrentUser(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.id) return null;

  return prisma.user.findUnique({
    where: { id: payload.id as string },
    select: { id: true, email: true, phone: true, name: true, role: true },
  });
}

export async function requireRole(req: NextApiRequest, roles: UserRole[]) {
  const user = await getCurrentUser(req);
  if (!user || !roles.includes(user.role as UserRole)) return null;
  return user;
}

export function requestIp(req: NextApiRequest) {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}

export async function writeActivity(req: NextApiRequest, input: { userId: string; action: string; resource?: string; resourceId?: string; metadata?: unknown }) {
  return prisma.activityLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      metadata: input.metadata as any,
      ip: requestIp(req),
    },
  });
}
