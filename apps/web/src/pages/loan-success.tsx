import MobileBottomNav from '../components/MobileBottomNav';
import CustomerFooter from '../components/CustomerFooter';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';

const DEFAULT_TELEGRAM = 'https://t.me/your_sale';

export default function LoanSuccessPage() {
  const [telegramLink, setTelegramLink] = useState(DEFAULT_TELEGRAM);

  useEffect(() => {
    const cached = window.localStorage.getItem('assignedSaleTelegram');
    if (cached) setTelegramLink(cached);

    fetch('/api/loans')
      .then((res) => res.json())
      .then((json) => {
        const latestLoanId = window.localStorage.getItem('latestLoanId');
        const loans = Array.isArray(json.data) ? json.data : [];
        const loan = loans.find((item: any) => item.id === latestLoanId) || loans[0];
        const link = loan?.assignedAgent?.telegramLink;
        if (link) {
          window.localStorage.setItem('assignedSaleTelegram', link);
          setTelegramLink(link);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-[#142014] text-[#333]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] bg-white pb-[61px]">
        <header className="relative flex h-[46px] items-center justify-center bg-[#2AAD69] text-white"><Link href="/confirm-loan" className="absolute left-4"><ArrowLeft className="h-7 w-7" /></Link><h1 className="text-[21px] font-bold">Xác nhận vay</h1></header>
        <section className="flex flex-col items-center px-6 pt-[82px] text-center">
          <div className="mt-[42px] flex h-[118px] w-[118px] items-center justify-center rounded-full border-[7px] border-[#39c52f] text-[#39c52f]"><Check className="h-10 w-10" /></div>
          <h2 className="mt-5 text-[18px]">Chúc mừng</h2>
          <p className="mt-1 text-[17px] leading-6">Hợp đồng vay của bạn đã được đăng ký<br/>thành công.</p>
          <div className="mt-7 flex w-full items-center justify-center gap-4 text-[#d91d2b]"><span className="text-[28px]">→</span><a href={telegramLink} target="_blank" rel="noreferrer" className="rounded-[5px] bg-[#2AAD69] px-3 py-2 text-[18px] font-bold text-white">Liên hệ CSKH để duyệt hồ sơ</a><span className="text-[28px]">←</span></div>
        </section>
        <CustomerFooter />
        <MobileBottomNav active="home" />
      </div>
    </main>
  );
}
