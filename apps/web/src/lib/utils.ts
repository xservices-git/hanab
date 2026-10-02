import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// UI chuyển sang tiền Hàn Quốc (KRW). Số trong DB vẫn là VND-like (1 đơn vị = 1 KRW hiển thị).
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(Number(amount || 0));
}

export function formatKRW(amount: number) {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(Number(amount || 0)) + ' KRW';
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('ko-KR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}
