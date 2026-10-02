import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

function BrandLogo() {
  return (
    <div className="brand-auth-logo" aria-label="KEB Hana Bank">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="KEB Hana Bank" className="brand-auth-logo-img" />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.error || 'Đăng nhập thất bại');
        return;
      }

      window.localStorage.setItem('phone', phone);
      router.push(['admin', 'agent'].includes(json.data.user.role) ? '/admin' : '/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mb-auth-page">
      <section className="mb-auth-shell">
        <BrandLogo />

        <form className="mb-auth-form" onSubmit={handleSubmit}>
          <input
            className="mb-auth-input"
            inputMode="tel"
            placeholder="Số điện thoại"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <input
            className="mb-auth-input"
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button className="mb-auth-button" type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <Link href="/signup" className="mb-auth-link">
          Chưa có tài khoản ? 👉 Đăng ký tài khoản mới
        </Link>
      </section>
    </main>
  );
}

