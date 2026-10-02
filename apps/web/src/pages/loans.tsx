import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, FileText, X } from 'lucide-react';
import MobileBottomNav from '@/components/MobileBottomNav';

function money(v: number) {
  return new Intl.NumberFormat('ko-KR').format(Number(v || 0)) + ' KRW';
}

function dt(v?: string) {
  if (!v) return '-';
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(v));
}

export default function LoansPage() {
  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    fetch('/api/loans', { credentials: 'include' })
      .then((r) => r.status === 401 ? (location.href = '/login', null) : r.json())
      .then((j) => setLoan(j?.data?.[0] || null))
      .finally(() => setLoading(false));
  }, []);

  const bank = useMemo(() => loan?.user?.profile?.bankAccounts?.[0] || null, [loan]);
  const isApproved = ['approved', 'disbursed', 'closed'].includes(String(loan?.status || '').toLowerCase());
  const approvedTime = loan?.approvedAt || loan?.updatedAt || loan?.createdAt;
  const saleLink = loan?.assignedAgent?.telegramLink;

  function contactSale() {
    if (saleLink) window.location.href = saleLink;
  }

  return (
    <main className="min-h-screen bg-[#142014] text-[#333]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] bg-slate-50 pb-24">
        <header className="relative flex h-[58px] items-center justify-center bg-[#2AAD69] text-white">
          <Link href="/dashboard" className="absolute left-4 rounded-full p-1 active:bg-white/10"><ArrowLeft className="h-6 w-6" /></Link>
          <h1 className="text-[20px] font-bold">Ví tiền</h1>
        </header>

        {loading ? <section className="p-5 text-center text-sm text-slate-500">Đang tải...</section> : !loan ? (
          <section className="min-h-[calc(100vh-58px-96px)] bg-slate-50 px-4 pt-8">
            <div className="flex flex-col items-center rounded-3xl bg-white px-4 py-10 shadow-sm ring-1 ring-slate-100">
              <div className="flex h-[105px] w-[105px] items-center justify-center rounded-full bg-[#f4f6fb] text-[#d9dde8]"><FileText className="h-14 w-14" /></div>
              <p className="mt-3 text-center text-[15px] text-slate-700">Bạn chưa có hồ sơ vay nào</p>
              <Link href="/choose-loan" className="mt-6 flex h-[40px] w-[227px] items-center justify-center rounded-[10px] bg-[#2AAD69] text-[18px] font-bold text-white shadow-[0_10px_22px_rgba(20,30,210,0.22)]">Đăng ký ngay</Link>
            </div>
          </section>
        ) : (
          <section className="space-y-4 p-4">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#2AAD69] p-5 text-white shadow-[0_18px_35px_rgba(15,23,42,0.28)]">
              <div className="flex items-center justify-between">
                <div className="text-[21px] font-black">{bank?.bankName || 'Ngân hàng liên kết'}</div>
              </div>
              <div className="mt-7 text-[12px] text-white/65">Chủ tài khoản</div>
              <div className="mt-1 text-[17px] font-black">{bank?.accountName || loan?.user?.profile?.fullName || loan?.user?.name || '-'}</div>
              <div className="mt-4 text-[12px] text-white/65">Số tài khoản</div>
              <div className="mt-1 font-mono text-[21px] font-black tracking-[0.12em]">{bank?.accountNumber || '************'}</div>
            </div>

            <a href={`/contract/${loan.id}`} target="_blank" rel="noreferrer" className="block text-[15px] font-bold text-[#2AAD69] underline">Hồ sơ vay</a>

            <div>
              <div className="mb-2 text-[15px] font-bold text-[#2AAD69] underline">Biến động số dư</div>
              <div className="rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-100">
                {loan.status === 'approved' || loan.status === 'disbursed' ? (
                  <div className="flex justify-between"><span>Giải ngân khoản vay</span><b className="text-emerald-600">+{money(loan.amount)}</b></div>
                ) : <span className="text-slate-500">Chưa có biến động số dư</span>}
              </div>
            </div>

            <button onClick={() => setModal(true)} className="flex h-12 w-full items-center justify-between rounded-2xl bg-[#2AAD69] px-5 text-[16px] font-bold text-white shadow-[0_10px_22px_rgba(20,30,210,0.22)] transition active:scale-95">
              Rút tiền về tài khoản liên kết <Download className="h-6 w-6" />
            </button>

            <div className="overflow-hidden rounded-3xl bg-white pb-3 shadow-sm ring-1 ring-slate-100">
              <div className="py-4 text-center text-[21px] font-black">Chi Tiết Giải Ngân</div>
              <table className="w-full border-collapse text-[14px]">
                <tbody>
                  <Row k="Thời gian rút tiền" v={isApproved ? dt(approvedTime) : 'Đang cập nhật'} />
                  <Row k="Thực rút về tài khoản" v={money(loan.amount)} />
                  <Row k="Trạng thái rút tiền" v={isApproved ? 'Bị Từ chối' : 'Đợi duyệt'} />
                  <Row k="Ghi chú" v={isApproved ? 'Sai thông tin liên kết ví' : 'Liên hệ CSKH'} />
                </tbody>
              </table>
            </div>
          </section>
        )}
        {modal && <RejectModal isApproved={isApproved} onClose={() => setModal(false)} onContact={contactSale} />}
        <MobileBottomNav active="wallet" />
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <tr><td className="w-[42%] border border-slate-200 px-3 py-3 text-slate-600">{k}</td><td className="border border-slate-200 px-3 py-3 text-center font-semibold">{v}</td></tr>;
}

function RejectModal({ isApproved, onClose, onContact }: { isApproved: boolean; onClose: () => void; onContact: () => void }) {
  return <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/45 pt-32"><div className="relative w-[360px] rounded-3xl bg-white p-8 text-center shadow-xl"><button onClick={onClose} className="absolute right-4 top-4 text-slate-400"><X /></button><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#d43b52] text-[34px] font-bold text-[#d43b52]">!</div>{isApproved ? <><div className="mt-4 text-[22px] text-slate-500">Từ chối yêu cầu</div><div className="mt-2 text-[22px] text-slate-500">Sai thông tin liên kết ví</div><div className="mt-3 text-[18px] text-slate-500">Liên hệ CSKH trực tuyến để được hỗ trợ</div></> : <div className="mt-5 text-[22px] leading-snug text-slate-500">Liên hệ CSKH để được duyệt nhanh hơn</div>}<button onClick={onContact} className="mt-8 h-12 w-full rounded-2xl bg-[#2AAD69] text-[18px] font-bold text-white">Liên hệ CSKH</button></div></div>;
}

