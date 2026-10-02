import type { UserRole as PrismaUserRole, LoanStatus as PrismaLoanStatus, KycStatus as PrismaKycStatus, NotificationType as PrismaNotificationType } from '@prisma/client';

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export type UserRole = PrismaUserRole;
export type LoanStatus = PrismaLoanStatus;
export type KycStatus = PrismaKycStatus;
export type NotificationType = PrismaNotificationType;

export interface JwtPayload {
  id: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RealtimeEnvelope<T = unknown> {
  v: 1;
  event: string;
  ts: number;
  nonce: string;
  payload: T;
}
