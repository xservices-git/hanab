'use client';
import { useAuthStore } from '@/store/auth';
import { Bell } from 'lucide-react';

export default function Header({ title }: { title: string }) {
  const { user } = useAuthStore();
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-muted rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <span className="text-sm text-muted-foreground">{user?.role === 'admin' ? 'Admin' : user?.role === 'agent' ? 'Sale' : 'User'}</span>
      </div>
    </header>
  );
}
