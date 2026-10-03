import MobileBottomNav from '../components/MobileBottomNav';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { BadgeDollarSign, Banknote, CircleUserRound, Headphones, LogOut } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [phone, setPhone] = useState('');

  useEffect(() => {
    setPhone(window.localStorage.getItem('phone') || '');
  }, []);

  async function handleSupport() {
    const res = await fetch('/api/loans', { credentials: 'include' });
    if (res.status === 401) { router.push('/login'); return; }
    if (!res.ok) return;
    const json = await res.json();
    const loan = json?.data?.[0];
    if (!loan) { showToast('Bạn chưa đăng kí khoản vay'); return; }
    const link = loan.assignedAgent?.telegramLink;
    if (link) window.location.href = link;
    else showToast('Hồ sơ vay đã được tạo', 'Chưa có link sale, vui lòng chờ CS liên hệ');
  }

  return (
    <main className="min-h-screen bg-[#142014] text-[#333]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] bg-white pb-[61px]">
        <header className="flex h-[50px] items-center justify-center bg-[#2AAD69] text-white"><h1 className="text-[20px] font-bold">Hồ sơ</h1></header>
        <section className="flex flex-col items-center pt-5">
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="avatar" className="h-[110px] w-[110px] rounded-full object-cover" />
          <p className="mt-1 text-[17px] font-bold text-[#666]">{phone}</p>
        </section>
        <section className="mx-[22px] mt-[25px] bg-[#dceefa] p-3">
          <h2 className="border-b border-[#9fb4c3] pb-2 text-[17px] font-bold">Xác thực tài khoản</h2>
          <div className="flex items-center gap-6 py-6"><span className="text-[#d62244]">⚠</span><p className="text-[16px] leading-6">Bổ sung Hộ chiếu/CCCD và<br/>chân dung để hoàn tất định<br/>danh</p></div>
          <Link href="/verify" className="block text-right text-[17px] font-bold text-[#d62244]">Xác thực ngay</Link>
        </section>
        <section className="mx-[22px] mt-[24px] space-y-[11px]">
          <Menu href="/loans" icon={<BadgeDollarSign />} label="Hồ Sơ Vay" />
          <Menu href="/verify" icon={<CircleUserRound />} label="Thông tin cá nhân" />
          <Menu href="/bank-info2" icon={<Banknote />} label="Thông tin ngân hàng" />
          <MenuButton onClick={handleSupport} icon={<Headphones />} label="Liên hệ tư vấn - hỗ trợ" />
          <Menu href="/login" icon={<LogOut />} label="Đăng xuất" pill />
        </section>
        <MobileBottomNav active="profile" />
      </div>
    </main>
  );
}

function Menu({ href, icon, label, pill = false }: { href: string; icon: React.ReactNode; label: string; pill?: boolean }) {
  return <Link href={href} className={`flex h-[48px] items-center gap-4 bg-[#2AAD69] px-4 text-[22px] text-white ${pill ? 'rounded-full' : 'rounded-[4px]'}`}><span className="h-6 w-6">{icon}</span>{label}</Link>;
}

function MenuButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button type="button" onClick={onClick} className="flex h-[48px] w-full items-center gap-4 rounded-[4px] bg-[#2AAD69] px-4 text-left text-[22px] text-white"><span className="h-6 w-6">{icon}</span>{label}</button>;
}
