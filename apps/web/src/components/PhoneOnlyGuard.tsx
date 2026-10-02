import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Smartphone } from 'lucide-react';

const ALLOW_DESKTOP_PATHS = ['/admin', '/agent'];

function isAllowedDesktopPath(pathname: string) {
  return ALLOW_DESKTOP_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isPhoneDevice() {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const mobileUa = /Android.*Mobile|iPhone|iPod|Windows Phone|IEMobile|Opera Mini/i.test(ua);
  const tabletUa = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua);
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const narrowScreen = window.matchMedia?.('(max-width: 767px)').matches ?? window.innerWidth <= 767;

  return mobileUa && !tabletUa && coarsePointer && narrowScreen;
}

export default function PhoneOnlyGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    if (isAllowedDesktopPath(router.pathname)) {
      setAllowed(true);
      return;
    }

    setAllowed(isPhoneDevice());
  }, [router.isReady, router.pathname]);

  if (allowed === null) {
    return <main className="min-h-screen bg-white" />;
  }

  if (allowed) return <>{children}</>;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
      <section className="w-full max-w-sm rounded-3xl bg-white p-8 text-center text-slate-900 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#2AAD69]/10 text-[#2AAD69]">
          <Smartphone className="h-9 w-9" />
        </div>
        <h1 className="mt-5 text-2xl font-black">Thiết bị không phù hợp</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Vui lòng truy cập bằng điện thoại để tiếp tục.</p>
      </section>
    </main>
  );
}
