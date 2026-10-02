import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Building2, FileText, LogOut, Menu, Search, Shield, Users, X } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Nhân viên', icon: Shield, roles: ['admin'] },
  { href: '/admin?tab=customers', label: 'Khách hàng', icon: Users, roles: ['admin'] },
  { href: '/admin?tab=loans', label: 'Hồ sơ vay', icon: FileText, roles: ['admin'] },
  { href: '/admin?focus=search', label: 'Tìm kiếm thông minh', icon: Search, roles: ['admin'] },
];

export default function Layout({ children, user }: { children: React.ReactNode; user: any }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role || 'user'));

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 hover:bg-gray-100">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="ml-3 text-lg font-bold text-blue-700">KEB Hana  Bank Online</span>
      </div>

      <aside className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
          <Building2 className="h-6 w-6 text-blue-700" />
          <div>
            <div className="text-xl font-bold text-blue-700">KEB Hana  Bank Online</div>
            <div className="text-xs text-gray-500">Quản trị hồ sơ vay</div>
          </div>
        </div>

        <nav className="space-y-1 p-4">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = router.asPath === item.href || (item.href === '/admin' && router.pathname === '/admin' && !router.asPath.includes('?'));
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
              {user?.name?.charAt(0) || (user?.phone || user?.email)?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
              <p className="truncate text-xs text-gray-500">{user?.phone || user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      <main className="min-h-screen pt-16 lg:ml-64 lg:pt-0">
        <div className="p-4 lg:p-8">{children}</div>
      </main>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
