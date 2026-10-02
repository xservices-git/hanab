import * as Toast from '@radix-ui/react-toast';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastItem = { id: number; title: string; description?: string };
type ToastContextValue = { showToast: (title: string, description?: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast = useCallback((title: string, description?: string) => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, title, description }]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <Toast.Provider swipeDirection="right" duration={3200}>
      <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
      {items.map((item) => (
        <Toast.Root
          key={item.id}
          className="mx-auto w-[calc(100%-24px)] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-slate-900 shadow-[0_12px_35px_rgba(15,23,42,0.18)] data-[state=closed]:animate-out data-[state=open]:animate-in"
          onOpenChange={(open: boolean) => {
            if (!open) setItems((current) => current.filter((x) => x.id !== item.id));
          }}
        >
          <Toast.Title className="text-sm font-bold">{item.title}</Toast.Title>
          {item.description && <Toast.Description className="mt-1 text-xs text-slate-500">{item.description}</Toast.Description>}
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed left-1/2 top-4 z-[100] flex w-full max-w-[390px] -translate-x-1/2 flex-col gap-2 px-3 outline-none" />
    </Toast.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
