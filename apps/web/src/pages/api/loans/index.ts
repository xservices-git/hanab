import type { NextApiRequest, NextApiResponse } from 'next';
import { KycStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { ApiResponse } from '@vay365/shared';
import { notifyNewLoan } from '@/lib/telegram';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const payload = await verifyToken(token);
    if (!payload) return res.status(401).json({ ok: false, error: 'Invalid token' });

    if (req.method === 'GET') {
      const loans = await prisma.loan.findMany({
        where: payload.role === 'admin' ? {} : { userId: payload.id as string },
        include: {
          assignedAgent: { select: { id: true, name: true, phone: true, telegramLink: true } },
          user: { select: { name: true, phone: true, profile: { include: { bankAccounts: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      return res.status(200).json({ ok: true, data: loans });
    }

    if (req.method === 'POST') {
      const { amount, termMonths, interestRate, notes, profile, bank, kyc, signatureImage } = req.body;
      const existingLoan = await prisma.loan.findFirst({ where: { userId: payload.id as string }, select: { id: true } });
      if (existingLoan) return res.status(409).json({ ok: false, error: 'Bạn đã có hồ sơ vay' });
      if (!amount || amount < 1000000) return res.status(400).json({ ok: false, error: 'Số tiền tối thiểu 1,000,000 KRW' });
      if (!termMonths || termMonths < 1 || termMonths > 60) return res.status(400).json({ ok: false, error: 'Kỳ hạn 1-60 tháng' });
      const agent = await prisma.user.findFirst({
        where: { role: 'agent' },
        orderBy: { assignedLoans: { _count: 'asc' } },
        select: { id: true },
      });

      const profileData = profile ? {
        fullName: profile.name || null,
        citizenId: profile.id || null,
        dateOfBirth: parseDate(profile.birthday),
        gender: profile.gender || null,
        address: profile.address || null,
        jobTitle: profile.job || null,
        monthlyIncome: parseIncome(profile.income),
        emergencyName: profile.relativeName || null,
        emergencyPhone: profile.relativePhone || null,
        emergencyRelation: profile.relation || null,
      } : null;

      const bankData = (profileRecord: any) => profileRecord && bank?.account && bank?.owner && bank?.bank ? {
        customerProfileId: profileRecord.id as string,
        bankName: bank.bank,
        accountNumber: bank.account,
        accountName: bank.owner,
        isPrimary: true,
      } : null;

      const kycData = (profileRecord: any) => profileRecord && kyc ? {
        customerProfileId: profileRecord.id as string,
        status: KycStatus.submitted,
        frontIdUrl: safeKycImage(kyc.front),
        backIdUrl: safeKycImage(kyc.back),
        selfieUrl: safeKycImage(kyc.face),
      } : null;

      const signatureData = safeSignature(signatureImage);
      const signatureIp = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || null;

      // Use transaction to keep a single DB connection alive
      const loan = await prisma.$transaction(async (tx) => {
        // Re-check inside transaction to prevent race-condition duplicates
        const dup = await tx.loan.findFirst({ where: { userId: payload.id as string }, select: { id: true } });
        if (dup) throw new Error('DUPLICATE_LOAN');

        const profileRecord = profileData
          ? await tx.customerProfile.upsert({
              where: { userId: payload.id as string },
              create: { userId: payload.id as string, ...profileData },
              update: profileData,
            })
          : null;

        if (profile?.name) {
          await tx.user.update({ where: { id: payload.id as string }, data: { name: profile.name } });
        }

        const profileId = profileRecord?.id as string | undefined;

        if (bankData(profileRecord)) {
          const existingBank = await tx.bankAccount.findFirst({ where: { customerProfileId: profileId } });
          if (existingBank) {
            await tx.bankAccount.update({ where: { id: existingBank.id }, data: bankData(profileRecord)! });
          } else {
            await tx.bankAccount.create({ data: bankData(profileRecord)! });
          }
        }

        if (kycData(profileRecord)) {
          const existingKyc = await tx.kycProfile.findFirst({ where: { customerProfileId: profileId } });
          if (existingKyc) {
            await tx.kycProfile.update({ where: { id: existingKyc.id }, data: kycData(profileRecord)! });
          } else {
            await tx.kycProfile.create({ data: kycData(profileRecord)! });
          }
        }

        return tx.loan.create({
          data: {
            userId: payload.id as string,
            assignedAgentId: agent?.id || null,
            amount: parseFloat(amount),
            termMonths: parseInt(termMonths),
            interestRate: parseFloat(interestRate) || 1.5,
            status: 'submitted',
            notes: notes?.trim() || profile?.purpose || null,
            contracts: {
              create: {
                status: 'signed',
                signedAt: new Date(),
                signatureImage: signatureData,
                signatureIp,
              },
            },
          },
          include: {
            assignedAgent: { select: { id: true, name: true, phone: true, telegramLink: true } },
            contracts: true,
          },
        });
      });

      await notifyNewLoan({ loan, profile, bank, kyc, assignedAgent: loan.assignedAgent, signatureImage }).catch((error) => console.error('notify loan telegram error', error));
      return res.status(201).json({ ok: true, data: loan });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('loans api error', error);
    if (error instanceof Error && error.message === 'DUPLICATE_LOAN') {
      return res.status(409).json({ ok: false, error: 'Bạn đã có hồ sơ vay' });
    }
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
}

function parseIncome(value?: string) {
  if (!value) return null;
  if (value.includes('Dưới 5')) return 4000000;
  if (value.includes('5 - 10')) return 7000000;
  if (value.includes('10 - 20')) return 15000000;
  if (value.includes('20 - 50')) return 30000000;
  if (value.includes('Trên 50')) return 50000000;
  return Number(String(value).replace(/\D/g, '')) || null;
}

function parseDate(value?: string) {
  if (!value) return null;
  const parts = value.split(/[\/.-]/).map((x) => Number(x.trim()));
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (day && month && year) return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function safeKycImage(value?: string) {
  if (!value) return null;
  const text = String(value);
  if (text.length > 900_000) return null;
  return text;
}

function safeSignature(value?: string) {
  if (!value) return null;
  const text = String(value);
  if (!text.startsWith('data:image/png;base64,')) return null;
  if (text.length > 500_000) return null;
  return text;
}
