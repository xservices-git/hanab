import Link from 'next/link';
import { useRouter } from 'next/router';
import { Headphones, Home, Plus, User, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

type NavKey = 'home' | 'wallet' | 'support' | 'profile' | 'plus';

export default function MobileBottomNav({ active = 'home' }: { active?: NavKey }) {
  const router = useRouter();
  const { showToast } = useToast();

  async function getLoan() {
    const res = await fetch('/api/loans', { credentials: 'include' });
    if (res.status === 401) { router.push('/login'); return null; }
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.[0] || null;
  }

  async function handlePlus() {
    const loan = await getLoan();
    if (loan) { showToast('Bạn có hồ sơ đang đợi, vui lòng liên hệ CSKH'); return; }
    router.push('/choose-loan');
  }

  async function handleSupport() {
    const loan = await getLoan();
    if (!loan) { showToast('Bạn chưa đăng kí khoản vay'); return; }
    const link = loan.assignedAgent?.telegramLink;
    if (link) window.location.href = link;
    else showToast('Hồ sơ vay đã được tạo', 'Chưa có link sale, vui lòng chờ CS liên hệ');
  }

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 h-[66px] w-full max-w-[390px] -translate-x-1/2 border-t border-[#d8d8d8] bg-white/95 shadow-[0_-8px_22px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="grid h-full grid-cols-5 items-center text-[12px]">
        <NavItem href="/dashboard" label="Trang chủ" active={active === 'home'} icon={<Home className="h-6 w-6" />} />
        <NavItem href="/loans" label="Ví tiền" active={active === 'wallet'} icon={<Wallet className="h-6 w-6" />} />
        <button type="button" onClick={handlePlus} aria-label="Đăng ký khoản vay" className="relative -mt-8 flex flex-col items-center justify-center text-[#2AAD69]">
          <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#2AAD69] text-white shadow-[0_10px_22px_rgba(20,30,210,0.28)] ring-[7px] ring-white transition active:scale-95">
            <Plus className="h-9 w-9" strokeWidth={2.8} />
          </span>
        </button>
        <button type="button" onClick={handleSupport} className={`flex h-full flex-col items-center justify-center gap-[3px] transition active:scale-95 ${active === 'support' ? 'text-[#2AAD69]' : 'text-[#8f8f8f]'}`}>
          <Headphones className="h-6 w-6" />
          <span className="text-[12px] leading-none">Hỗ trợ</span>
        </button>
        <NavItem href="/profile" label="Hồ sơ" active={active === 'profile'} icon={<User className="h-6 w-6" />} />
      </div>
    </nav>
  );
}

function NavItem({ href, label, icon, active = false }: { href: string; label: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <Link href={href} prefetch={false} className={`flex h-full flex-col items-center justify-center gap-[3px] transition active:scale-95 ${active ? 'text-[#2AAD69]' : 'text-[#8f8f8f]'}`}>
      <div>{icon}</div>
      <span className="text-[12px] leading-none">{label}</span>
    </Link>
  );
}
