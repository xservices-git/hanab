import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Banknote, CheckCircle2, Edit2, Save } from 'lucide-react';
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ bankName: '', accountNumber: '', accountName: '' });

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/profile/bank', { credentials: 'include' });
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    const json = await res.json();
    if (json?.ok) {
      setData(json.data);
      const b = json.data?.banks?.[0];
      if (b) setForm({ bankName: b.bankName, accountNumber: b.accountNumber, accountName: b.accountName });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.bankName || !form.accountNumber || !form.accountName) return;
    setSaving(true);
    const res = await fetch('/api/profile/bank', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      load();
    }
  };

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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[15px] font-bold opacity-90">
                  <Banknote className="h-5 w-5" />
                  {editing ? 'Cập nhật ngân hàng' : 'Ngân hàng liên kết'}
                </div>
                {!editing && bank && (
                  <button onClick={() => setEditing(true)} className="rounded-full bg-white/15 px-3 py-1 text-[13px] font-semibold">
                    <Edit2 className="mr-1 inline h-4 w-4" />Sửa
                  </button>
                )}
              </div>

              <div className="mt-6 text-[12px] text-white/65">Tên ngân hàng</div>
              {editing ? (
                <input
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg bg-white/15 px-3 text-[16px] font-bold text-white placeholder-white/40 outline-none focus:bg-white/25"
                  placeholder="VD: KB Kookmin"
                />
              ) : (
                <div className="mt-1 text-[21px] font-black">{bank?.bankName || 'Chưa liên kết'}</div>
              )}

              <div className="mt-4 text-[12px] text-white/65">Chủ tài khoản</div>
              {editing ? (
                <input
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg bg-white/15 px-3 text-[16px] font-bold text-white placeholder-white/40 outline-none focus:bg-white/25"
                  placeholder="NGUYEN VAN A"
                />
              ) : (
                <div className="mt-1 text-[17px] font-black">{bank?.accountName || data?.fullName || '-'}</div>
              )}

              <div className="mt-4 text-[12px] text-white/65">Số tài khoản</div>
              {editing ? (
                <input
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })}
                  className="mt-1 h-10 w-full rounded-lg bg-white/15 px-3 font-mono text-[18px] font-black tracking-[0.08em] text-white placeholder-white/40 outline-none focus:bg-white/25"
                  placeholder="1234567890"
                  inputMode="numeric"
                />
              ) : (
                <div className="mt-1 font-mono text-[21px] font-black tracking-[0.12em]">{bank?.accountNumber || '************'}</div>
              )}

              {bank?.isPrimary && (
                <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold">
                  <CheckCircle2 className="h-4 w-4" /> Tài khoản chính
                </div>
              )}
            </div>

            {editing ? (
              <div className="flex gap-3">
                <button onClick={() => setEditing(false)} className="h-12 flex-1 rounded-2xl bg-slate-200 text-[16px] font-bold text-slate-700">Huỷ</button>
                <button onClick={save} disabled={saving} className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-[#2AAD69] text-[16px] font-bold text-white shadow-[0_10px_22px_rgba(20,30,210,0.18)] disabled:opacity-60">
                  <Save className="h-5 w-5" />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            ) : !bank ? (
              <button onClick={() => setEditing(true)} className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#2AAD69] text-[16px] font-bold text-white shadow-[0_10px_22px_rgba(20,30,210,0.22)]">
                Thêm tài khoản ngân hàng
              </button>
            ) : null}

            <div className="rounded-2xl bg-white p-4 text-[13px] leading-relaxed text-slate-500 shadow-sm ring-1 ring-slate-100">
              Số tài khoản được dùng để nhận giải ngân. Vui lòng kiểm tra kỹ trước khi lưu.
            </div>
          </section>
        )}
        <MobileBottomNav active="profile" />
      </div>
    </main>
  );
}