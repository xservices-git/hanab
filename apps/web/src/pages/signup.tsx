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

export default function SignupPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp');
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    try {
      setLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({ phone, password }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.error || 'Đăng ký thất bại');
        return;
      }

      window.localStorage.setItem('phone', phone);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof DOMException && err.name === 'AbortError' ? 'Kết nối quá lâu, thử lại' : 'Không thể đăng ký lúc này');
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <main className="mb-auth-page">
      <section className="mb-auth-shell">
        <BrandLogo />

        <form className="mb-auth-form mb-auth-form-register" onSubmit={handleSubmit}>
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
          <input
            className="mb-auth-input"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          {error && <p className="text-center text-sm text-red-600">{error}</p>}

          <button className="mb-auth-button" type="submit" disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <div className="mb-auth-help">
          <p>Độ dài mật khẩu từ 6 - 20 ký tự</p>
          <p>Ví dụ mật khẩu: 123456</p>
        </div>

        <Link href="/login" className="mb-auth-link mb-auth-link-register">
          Đã có tài khoản? Đăng nhập ngay
        </Link>
      </section>
    </main>
  );
}
