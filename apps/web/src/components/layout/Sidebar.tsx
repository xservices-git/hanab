'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, LogOut, Search, Shield, Users } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const navItems = [
  { href: '/admin', label: 'Nh?n vi?n', icon: Shield, roles: ['admin'] },
  { href: '/admin?tab=customers', label: 'Kh?ch h?ng', icon: Users, roles: ['admin'] },
  { href: '/admin?tab=loans', label: 'H? s? vay', icon: FileText, roles: ['admin'] },
  { href: '/admin?focus=search', label: 'T?m ki?m th?ng minh', icon: Search, roles: ['admin'] },
];

export default function Sidebar() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const filteredItems = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-slate-200 bg-white/95 shadow-xl shadow-slate-200/50 backdrop-blur">
      <div className="border-b border-slate-200 p-6">
        <Link href="/admin" prefetch={false} className="text-xl font-black text-blue-800">KEB Hana  Bank Online</Link>
        <p className="mt-1 text-xs font-medium text-slate-500">Qu?n tr? h? s? vay</p>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === '/admin' && item.href === '/admin';
          return (
            <Link key={item.href} href={item.href} prefetch={false} className={cn('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font700 transition-all', active ? 'bg-blue-700 text-white shadow-lg shadow-blue-200' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700')}>
              <Icon className="h-5 w-5" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <button onClick={() => { logout(); router.push('/login'); }} className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-4 w-4" /> ??ng xu?t
        </button>
      </div>
    </aside>
  );
}
