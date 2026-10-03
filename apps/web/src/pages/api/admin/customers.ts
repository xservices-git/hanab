import type { NextApiRequest, NextApiResponse } from 'next';
import type { ApiResponse } from '@vay365/shared';
import { prisma } from '@/lib/prisma';
import { requireRole, writeActivity } from '@/lib/api-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const actor = await requireRole(req, ['admin', 'agent']);
  if (!actor) return res.status(403).json({ ok: false, error: 'Forbidden' });
  if (!['GET', 'PATCH'].includes(req.method || '')) return res.status(405).json({ ok: false, error: 'Method not allowed' });

  if (req.method === 'PATCH') {
    if (actor.role !== 'admin') return res.status(403).json({ ok: false, error: 'Chỉ admin được sửa' });
    const {
      customerId,
      locked,
      // User fields
      name,
      phone,
      email,
      telegramLink,
      password,
      // Profile fields
      fullName,
      citizenId,
      dateOfBirth,
      gender,
      address,
      jobTitle,
      employerName,
      monthlyIncome,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      withdrawViolation,
      // Bank account fields (replace if provided)
      bankName,
      accountNumber,
      accountName,
      // KYC images (replace if provided)
      frontIdUrl,
      backIdUrl,
      selfieUrl,
      kycStatus,
      kycRejectionReason,
    } = req.body || {};

    if (!customerId) return res.status(400).json({ ok: false, error: 'Thiếu customerId' });

    const existing = await prisma.user.findFirst({
      where: { id: customerId, role: 'user' },
      include: { profile: true },
    });
    if (!existing) return res.status(404).json({ ok: false, error: 'Không tìm thấy khách hàng' });

    // Validate uniqueness on phone/email/citizenId if changing
    if (phone && phone !== existing.phone) {
      const dup = await prisma.user.findFirst({ where: { phone, NOT: { id: customerId } } });
      if (dup) return res.status(409).json({ ok: false, error: 'SĐT đã được sử dụng' });
    }
    if (email && email !== existing.email) {
      const dup = await prisma.user.findFirst({ where: { email, NOT: { id: customerId } } });
      if (dup) return res.status(409).json({ ok: false, error: 'Email đã được sử dụng' });
    }

    // Build update data
    const userData: any = {};
    if (name !== undefined) userData.name = name?.trim() || null;
    if (phone !== undefined) userData.phone = phone?.trim() || null;
    if (email !== undefined) userData.email = email?.trim() || null;
    if (telegramLink !== undefined) userData.telegramLink = telegramLink?.trim() || null;
    if (locked !== undefined) {
      userData.lockedUntil = locked ? new Date('9999-12-31T23:59:59.000Z') : null;
    }

    // Update password (hash) if provided
    if (password && String(password).length >= 4) {
      const bcrypt = await import('bcryptjs');
      userData.passwordHash = await bcrypt.hash(String(password), 10);
    }

    // Run user update first (must succeed before touching profile/loans)
    await prisma.user.update({ where: { id: customerId }, data: userData });

    // Profile upsert
    const profileData: any = {};
    if (fullName !== undefined) profileData.fullName = fullName?.trim() || null;
    if (citizenId !== undefined) {
      const next = citizenId?.trim() || null;
      if (next && next !== existing.profile?.citizenId) {
        const dup = await prisma.customerProfile.findFirst({
          where: { citizenId: next, NOT: { userId: customerId } },
        });
        if (dup) return res.status(409).json({ ok: false, error: 'CCCD đã được sử dụng' });
      }
      profileData.citizenId = next;
    }
    if (dateOfBirth !== undefined) {
      profileData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (gender !== undefined) profileData.gender = gender?.trim() || null;
    if (address !== undefined) profileData.address = address?.trim() || null;
    if (jobTitle !== undefined) profileData.jobTitle = jobTitle?.trim() || null;
    if (employerName !== undefined) profileData.employerName = employerName?.trim() || null;
    if (monthlyIncome !== undefined) {
      profileData.monthlyIncome = monthlyIncome === '' || monthlyIncome === null ? null : Number(monthlyIncome);
    }
    if (emergencyName !== undefined) profileData.emergencyName = emergencyName?.trim() || null;
    if (emergencyPhone !== undefined) profileData.emergencyPhone = emergencyPhone?.trim() || null;
    if (emergencyRelation !== undefined) profileData.emergencyRelation = emergencyRelation?.trim() || null;
    if (withdrawViolation !== undefined) profileData.withdrawViolation = Boolean(withdrawViolation);

    if (Object.keys(profileData).length) {
      await prisma.customerProfile.upsert({
        where: { userId: customerId },
        update: profileData,
        create: { userId: customerId, ...profileData },
      });
    }

    // Bật "Rút tiền vi phạm" => approve tất cả loan đang chờ duyệt
    if (withdrawViolation === true) {
      const pendingLoans = await prisma.loan.findMany({
        where: { userId: customerId, status: { in: ['draft', 'submitted', 'reviewing'] } },
        select: { id: true },
      });
      if (pendingLoans.length) {
        await prisma.loan.updateMany({
          where: { id: { in: pendingLoans.map((l) => l.id) } },
          data: {
            status: 'approved',
            approvedBy: actor.id,
            approvedAt: new Date(),
          },
        });
        await prisma.notification.createMany({
          data: pendingLoans.map((l) => ({
            userId: customerId,
            type: 'loan',
            title: 'Hồ sơ vay được duyệt',
            body: 'Tài khoản đã duyệt rút tiền',
            metadata: { loanId: l.id },
          })),
        });
      }
    }

    // Bỏ "Rút tiền vi phạm" => reset tất cả loan approved/rejected về draft (chờ duyệt lại)
    if (withdrawViolation === false) {
      const blockedLoans = await prisma.loan.findMany({
        where: { userId: customerId, status: { in: ['approved', 'rejected'] } },
        select: { id: true },
      });
      if (blockedLoans.length) {
        await prisma.loan.updateMany({
          where: { id: { in: blockedLoans.map((l) => l.id) } },
          data: {
            status: 'draft',
            approvedBy: null,
            approvedAt: null,
            rejectedBy: null,
            rejectedAt: null,
            rejectionReason: null,
          },
        });
        await prisma.notification.createMany({
          data: blockedLoans.map((l) => ({
            userId: customerId,
            type: 'loan',
            title: 'Hồ sơ vay trở về chờ duyệt',
            body: 'Tài khoản đã được gỡ rút tiền vi phạm',
            metadata: { loanId: l.id },
          })),
        });
      }
    }

    // Bank account: upsert primary
    if (bankName || accountNumber || accountName) {
      const profile = await prisma.customerProfile.findUnique({ where: { userId: customerId } });
      if (profile) {
        const primary = await prisma.bankAccount.findFirst({
          where: { customerProfileId: profile.id, isPrimary: true },
        });
        const bankData = {
          bankName: bankName?.trim() || primary?.bankName || '',
          accountNumber: accountNumber?.trim() || primary?.accountNumber || '',
          accountName: accountName?.trim() || primary?.accountName || '',
          isPrimary: true,
        };
        if (primary) {
          await prisma.bankAccount.update({ where: { id: primary.id }, data: bankData });
        } else {
          await prisma.bankAccount.create({
            data: { customerProfileId: profile.id, ...bankData },
          });
        }
      }
    }

    // KYC: create new record if any image provided (or update latest pending)
    const hasKycImage = frontIdUrl || backIdUrl || selfieUrl;
    if (hasKycImage) {
      const profile = await prisma.customerProfile.findUnique({ where: { userId: customerId } });
      if (profile) {
        const kycData: any = {};
        if (frontIdUrl !== undefined) kycData.frontIdUrl = frontIdUrl || null;
        if (backIdUrl !== undefined) kycData.backIdUrl = backIdUrl || null;
        if (selfieUrl !== undefined) kycData.selfieUrl = selfieUrl || null;
        if (kycStatus) kycData.status = kycStatus;
        if (kycRejectionReason !== undefined) kycData.rejectionReason = kycRejectionReason || null;
        if (kycStatus === 'verified' || kycStatus === 'rejected') {
          kycData.reviewedBy = actor.id;
          kycData.reviewedAt = new Date();
        }
        const latest = await prisma.kycProfile.findFirst({
          where: { customerProfileId: profile.id },
          orderBy: { createdAt: 'desc' },
        });
        if (latest) {
          await prisma.kycProfile.update({ where: { id: latest.id }, data: kycData });
        } else {
          await prisma.kycProfile.create({
            data: {
              customerProfileId: profile.id,
              status: kycStatus || 'submitted',
              ...kycData,
            },
          });
        }
      }
    } else if (kycStatus) {
      // Only status update on latest KYC
      const profile = await prisma.customerProfile.findUnique({ where: { userId: customerId } });
      if (profile) {
        const latest = await prisma.kycProfile.findFirst({
          where: { customerProfileId: profile.id },
          orderBy: { createdAt: 'desc' },
        });
        if (latest) {
          await prisma.kycProfile.update({
            where: { id: latest.id },
            data: {
              status: kycStatus,
              reviewedBy: actor.id,
              reviewedAt: new Date(),
              ...(kycRejectionReason !== undefined && { rejectionReason: kycRejectionReason || null }),
            },
          });
        }
      }
    }

    await writeActivity(req, {
      userId: actor.id,
      action: 'customer.update',
      resource: 'user',
      resourceId: customerId,
      metadata: { fields: Object.keys({ ...userData, ...profileData }) },
    });

    // Return updated record
    const updated = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        profile: {
          include: {
            kycs: { orderBy: { createdAt: 'desc' }, take: 5 },
            bankAccounts: true,
          },
        },
      },
    });
    return res.status(200).json({ ok: true, data: updated });
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
        select: {
          withdrawViolation: true,
          fullName: true,
          citizenId: true,
          dateOfBirth: true,
          gender: true,
          address: true,
          jobTitle: true,
          employerName: true,
          monthlyIncome: true,
          emergencyName: true,
          emergencyPhone: true,
          emergencyRelation: true,
          kycs: { orderBy: { createdAt: 'desc' }, take: 1 },
          bankAccounts: true,
        },
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

  // Tính số dư ví cho từng khách hàng (giống /loans: loại trừ 'Số dư ví')
  const customerIds = customers.map((c) => c.id);
  const allTx = customerIds.length
    ? await prisma.transaction.findMany({
        where: { userId: { in: customerIds } },
        select: { userId: true, type: true, amount: true, reason: true },
      })
    : [];
  console.log('[admin/customers] customers:', customers.length, 'firstIds:', customers.slice(0, 3).map((c) => ({ id: c.id, name: c.name, type: typeof c.id })), 'transactions:', allTx.length, 'sampleTx:', allTx.slice(0, 5));
  const balanceByUser: Record<string, number> = {};
  for (const t of allTx) {
    if (t.reason === 'Số dư ví') continue;
    balanceByUser[t.userId] = (balanceByUser[t.userId] || 0) + (t.type === 'credit' ? Number(t.amount) : -Number(t.amount));
  }
  console.log('[admin/customers] balanceByUser:', balanceByUser);
  for (const c of customers) (c as any).balance = balanceByUser[c.id] || 0;

  return res.status(200).json({ ok: true, data: customers });
}
