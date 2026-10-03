import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Banknote, CheckCircle2 } from 'lucide-react';
import MobileBottomNav from '@/components/MobileBottomNav';

type Bank = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isPrimary: boolean;
};

export default function BankInfoPage() {
  const [data, setData] = useState<{ fullName: string | null; phone: string | null; banks: Bank[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/profile/bank', { credentials: 'include' });
      if (res.status === 401) { window.location.href = '/login'; return; }
      const json = await res.json();
      if (json?.ok) setData(json.data);
      setLoading(false);
    })();
  }, []);

  const bank = data?.banks?.[0];

  return (
    <main className="min-h-screen bg-[#142014] text-[#333]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] bg-slate-50 pb-24">
        <header className="relative flex h-[58px] items-center justify-center bg-[#2AAD69] text-white">
          <Link href="/profile" className="absolute left-4 rounded-full p-1 active:bg-white/10"><ArrowLeft className="h-6 w-6" /></Link>
          <h1 className="text-[20px] font-bold">Thông tin ngân hàng</h1>
        </header>

        {loading ? (
          <section className="p-5 text-center text-sm text-slate-500">Đang tải...</section>
        ) : (
          <section className="space-y-4 p-4">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#2AAD69] p-5 text-white shadow-[0_18px_35px_rgba(15,23,42,0.28)]">
              <div className="flex items-center gap-2 text-[15px] font-bold opacity-90">
                <Banknote className="h-5 w-5" />
                Ngân hàng liên kết
              </div>

              <div className="mt-6 text-[12px] text-white/65">Tên ngân hàng</div>
              <div className="mt-1 text-[21px] font-black">{bank?.bankName || 'Chưa liên kết'}</div>

              <div className="mt-4 text-[12px] text-white/65">Chủ tài khoản</div>
              <div className="mt-1 text-[17px] font-black">{bank?.accountName || data?.fullName || '-'}</div>

              <div className="mt-4 text-[12px] text-white/65">Số tài khoản</div>
              <div className="mt-1 font-mono text-[21px] font-black tracking-[0.12em]">
                {bank?.accountNumber
                  ? `**** **** **** ${bank.accountNumber.slice(-4)}`
                  : '************'}
              </div>

              {bank?.isPrimary && (
                <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold">
                  <CheckCircle2 className="h-4 w-4" /> Tài khoản chính
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-4 text-[13px] leading-relaxed text-slate-500 shadow-sm ring-1 ring-slate-100">
              Số tài khoản được dùng để nhận giải ngân. Nếu cần thay đổi, vui lòng liên hệ CSKH.
            </div>
          </section>
        )}
        <MobileBottomNav active="profile" />
      </div>
    </main>
  );
}