import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import MobileBottomNav from '../components/MobileBottomNav';

const terms = [12, 24, 36, 60];

export default function ChooseLoanPage() {
  const router = useRouter();
  const [amount, setAmount] = useState(100000000);
  const [term, setTerm] = useState(60);
  const [open, setOpen] = useState(false);
  const [termOpen, setTermOpen] = useState(false);
  const [toast, setToast] = useState('');
  const firstPay = Math.round((amount / term) * 1.01);
  const schedule = useMemo(() => Array.from({ length: term }, (_, i) => ({
    index: i + 1,
    amount: Math.round((amount / term) * (1.01 - i * 0.0001)),
    date: `2 - ${((7 + i - 1) % 30) + 1}`,
  })), [amount, term]);

  useEffect(() => {
    let alive = true;
    const deny = (message: string) => {
      if (!alive) return;
      setToast(message);
      window.setTimeout(() => router.replace('/dashboard'), 1200);
    };

    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('unauthorized');
        return fetch('/api/loans');
      })
      .then((res) => {
        if (!res.ok) throw new Error('unauthorized');
        return res.json();
      })
      .then((json) => {
        if (Array.isArray(json?.data) && json.data.length > 0) deny('Bạn có hồ sơ đang đợi, vui lòng liên hệ CSKH');
      })
      .catch(() => { if (alive) router.replace('/login'); });

    return () => { alive = false; };
  }, [router]);

  return (
    <main className="min-h-screen bg-[#142014] text-[#333]">
      <div className="relative mx-auto min-h-screen w-full max-w-[390px] overflow-hidden bg-white pb-[82px]">
        <div className="h-[288px] bg-gradient-to-b from-[#12159b] via-[#2AAD69] to-white">
          <header className="relative flex h-[52px] items-center justify-center text-white">
            <Link href="/loans" className="absolute left-4"><ArrowLeft className="h-7 w-7" /></Link>
            <h1 className="text-[20px] font-bold">Chọn khoản vay</h1>
          </header>
          <section className="px-5 pt-8 text-white">
            <div className="flex items-center justify-between">
              <label className="text-[17px] font-bold">Số tiền vay (KRW)</label>
              <div className="rounded-[6px] bg-white px-3 py-1 text-[17px] font-bold text-[#2AAD69]">{amount.toLocaleString('ko-KR')} KRW</div>
            </div>
            <input
              type="range"
              min={2000000}
              max={500000000}
              step={1000000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-5 w-full accent-[#e11d48]"
            />
            <div className="mt-3 flex justify-between px-2 text-[14px] font-bold text-[#222]"><span>Từ 2,000,000 KRW</span><span>Đến 500,000,000 KRW</span></div>
            <div className="mt-5 flex items-center justify-between text-[#222]">
              <span className="text-[16px] font-medium">Chọn thời hạn vay</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTermOpen((v) => !v)}
                  className="flex h-[38px] w-[148px] items-center justify-between rounded-[6px] border border-[#2AAD69] bg-white px-3 text-left text-[16px] font-semibold text-[#2AAD69] shadow-[0_3px_10px_rgba(20,30,210,0.12)] outline-none"
                >
                  <span>{term} tháng</span>
                  <ChevronDown className={`h-4 w-4 text-[#2AAD69] transition ${termOpen ? 'rotate-180' : ''}`} />
                </button>
                {termOpen && (
                  <div className="absolute right-0 top-[44px] z-20 w-[148px] overflow-hidden rounded-[10px] border border-[#dfe3ff] bg-white shadow-[0_12px_28px_rgba(20,30,210,0.22)]">
                    {terms.map((x) => (
                      <button
                        key={x}
                        type="button"
                        onClick={() => {
                          setTerm(x);
                          setTermOpen(false);
                        }}
                        className={`block h-[42px] w-full px-3 text-left text-[15px] font-semibold ${term === x ? 'bg-[#2AAD69] text-white' : 'text-[#202124] hover:bg-[#f1f3ff]'}`}
                      >
                        {x} tháng
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <section className="mx-7 -mt-[2px] rounded-[7px] bg-white shadow-[0_5px_11px_rgba(0,0,0,0.25)]">
          <h2 className="rounded-t-[7px] bg-gradient-to-b from-[#2AAD69] to-[#777bf2] py-3 text-center text-[22px] font-bold text-white">Thông tin khoản vay</h2>
          <div className="space-y-[10px] px-7 py-4 text-[14px]">
            <Row l="Số tiền" r={`${amount.toLocaleString('ko-KR')} KRW`} />
            <Row l="Thời hạn vay" r={`${term} tháng`} />
            <Row l="Ngày vay" r="2/6/2026" />
            <Row l="Hình thức thanh toán" r="Trả góp mỗi tháng" />
          </div>
        </section>

        <section className="mx-8 mt-7 space-y-6 text-[16px]"><Row l="Trả nợ kì đầu" r={`${firstPay.toLocaleString('ko-KR')} KRW`} /><Row l="Lãi suất hàng tháng" r="1%" /><button onClick={() => setOpen(true)} className="text-[#0b7f9f]">Chi tiết trả nợ</button></section>
        <div className="mt-8 flex justify-center"><Link href={`/verify?amount=${amount}&term=${term}`} onClick={() => { window.localStorage.setItem('loanAmount', String(amount)); window.localStorage.setItem('loanTerm', String(term)); }} className="flex h-[58px] w-[215px] items-center justify-center rounded-full bg-[#2AAD69] text-[20px] font-bold text-white">Xác nhận khoản vay</Link></div>

        {toast && <div className="fixed left-1/2 top-4 z-50 w-[340px] -translate-x-1/2 rounded-[10px] bg-[#202124] px-4 py-3 text-center text-[14px] font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)]">{toast}</div>}

        <MobileBottomNav active="plus" />

        {open && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#07118a]/35 px-4 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
            <div className="w-full max-w-[348px] overflow-hidden rounded-[18px] bg-white shadow-[0_18px_50px_rgba(20,30,210,0.28)]" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-[#2AAD69] to-[#5961ff] px-5 py-4 text-white">
                <p className="text-[13px] font-medium opacity-85">Chi tiết trả nợ</p>
                <h3 className="mt-1 text-[20px] font-bold">Lịch thanh toán hàng tháng</h3>
              </div>
              <div className="max-h-[430px] overflow-auto px-4">
                <table className="w-full text-left text-[14px] text-[#202124]">
                  <thead className="sticky top-0 bg-white">
                    <tr className="h-[48px] border-b border-[#eef0ff] text-[#5f6475]">
                      <th className="font-semibold">Kỳ</th>
                      <th className="text-right font-semibold">Số tiền</th>
                      <th className="text-right font-semibold">Ngày đóng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => (
                      <tr key={row.index} className="h-[54px] border-b border-[#f0f2f8] last:border-b-0">
                        <td className="text-[#4a4f5f]">Kì thứ {row.index}</td>
                        <td className="text-right font-bold text-[#2AAD69]">{row.amount.toLocaleString('ko-KR')} KRW</td>
                        <td className="text-right font-bold text-[#202124]">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-[#eef0ff] bg-[#f8f9ff] px-4 py-4">
                <button onClick={() => setOpen(false)} className="h-11 w-full rounded-full bg-[#2AAD69] text-[16px] font-bold text-white shadow-[0_8px_18px_rgba(20,30,210,0.25)]">Đã hiểu</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ l, r }: { l: string; r: string }) { return <div className="flex justify-between gap-4"><span>{l}</span><span className="font-medium">{r}</span></div>; }


