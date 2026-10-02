import { z } from 'zod';

export const LoginSchema = z.object({
  phone: z.string().min(8, 'Số điện thoại không hợp lệ').max(15),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
});

export const RegisterSchema = z.object({
  phone: z.string().min(8, 'Số điện thoại không hợp lệ').max(15),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  name: z.string().min(1, 'Tên không được để trống').max(100).optional(),
});

export const LoanCreateSchema = z.object({
  amount: z.number().min(1000000, 'Số tiền tối thiểu 1,000,000đ'),
  termMonths: z.number().int().min(1).max(60),
  interestRate: z.number().min(0).max(10).optional(),
  notes: z.string().max(500).optional(),
});

export const CustomerProfileSchema = z.object({
  fullName: z.string().max(100).optional(),
  citizenId: z.string().max(20).optional(),
  address: z.string().max(1000).optional(),
  jobTitle: z.string().max(100).optional(),
  employerName: z.string().max(100).optional(),
  monthlyIncome: z.number().min(0).optional(),
  emergencyName: z.string().max(100).optional(),
  emergencyPhone: z.string().max(20).optional(),
});
