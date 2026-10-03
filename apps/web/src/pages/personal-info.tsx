import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, User, Phone, Mail, CreditCard, MapPin, Cake, Briefcase, CircleDollarSign, CalendarDays } from 'lucide-react';
import MobileBottomNav from '@/components/MobileBottomNav';

type Profile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
  fullName: string | null;
  citizenId: string | null;
  address: string | null;
  birthDate: string | null;
  gender: string | null;
  job: string | null;
  income: number | null;
};

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#2AAD69]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-slate-500">{label}</div>
        <div className="mt-0.5 break-words text-[15px] font-bold text-slate-800">{value || '-'}</div>
      </div>
    </div>
  );
}

function dt(v?: string | null) {
  if (!v) return '-';
  try {
    return new Intl.DateTimeFormat('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(v));
  } catch {
    return '-';
  }
}

export default function PersonalInfoPage() {
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/profile/me', { credentials: 'include' });
      if (res.status === 401) { window.location.href = '/login'; return; }
      const json = await res.json();
      if (json?.ok) setData(json.data);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-[#142014] text-[#333]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] bg-slate-50 pb-24">
        <header className="relative flex h-[58px] items-center justify-center bg-[#2AAD69] text-white">
          <Link href="/profile" className="absolute left-4 rounded-full p-1 active:bg-white/10"><ArrowLeft className="h-6 w-6" /></Link>
          <h1 className="text-[20px] font-bold">Thông tin cá nhân</h1>
        </header>

        {loading ? (
          <section className="p-5 text-center text-sm text-slate-500">Đang tải...</section>
        ) : !data ? (
          <section className="p-5 text-center text-sm text-slate-500">Không có dữ liệu</section>
        ) : (
          <section className="space-y-3 p-4">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#2AAD69] p-5 text-white shadow-[0_18px_35px_rgba(15,23,42,0.28)]">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
                  <User className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[19px] font-black">{data.fullName || data.name || 'Khách hàng'}</div>
                  <div className="text-[12px] text-white/70">ID: {data.id.slice(0, 8)}</div>
                </div>
              </div>
            </div>

            <Field icon={<User className="h-5 w-5" />} label="Họ và tên" value={data.fullName} />
            <Field icon={<Phone className="h-5 w-5" />} label="Số điện thoại" value={data.phone} />
            <Field icon={<Mail className="h-5 w-5" />} label="Email" value={data.email} />
            <Field icon={<CreditCard className="h-5 w-5" />} label="CMND/CCCD" value={data.citizenId} />
            <Field icon={<Cake className="h-5 w-5" />} label="Ngày sinh" value={data.birthDate ? dt(data.birthDate) : null} />
            <Field icon={<User className="h-5 w-5" />} label="Giới tính" value={data.gender} />
            <Field icon={<MapPin className="h-5 w-5" />} label="Địa chỉ" value={data.address} />
            <Field icon={<Briefcase className="h-5 w-5" />} label="Nghề nghiệp" value={data.job} />
            <Field icon={<CircleDollarSign className="h-5 w-5" />} label="Thu nhập" value={data.income ? new Intl.Num