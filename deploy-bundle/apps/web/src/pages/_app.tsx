import type { AppProps } from 'next/app';
import { SWRConfig } from 'swr';
import '@/styles/globals.css';
import { ToastProvider } from '@/components/ui/toast';
import PhoneOnlyGuard from '@/components/PhoneOnlyGuard';

async function fetcher(url: string) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : { ok: false, error: await res.text() };

  if (!res.ok) {
    const error = new Error(payload?.error || `HTTP ${res.status}`) as Error & { status?: number; payload?: unknown };
    error.status = res.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: false }}>
      <ToastProvider>
        <PhoneOnlyGuard>
          <Component {...pageProps} />
        </PhoneOnlyGuard>
      </ToastProvider>
    </SWRConfig>
  );
}
