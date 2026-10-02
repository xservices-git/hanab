import { useRouter } from 'next/router';
import { useState } from 'react';
import { ArrowLeft, ChevronDown, CircleUserRound, Globe2 } from 'lucide-react';
import Link from 'next/link';
import MobileBottomNav from '../components/MobileBottomNav';

type Bank = { name: string; code: string; color: string };

const banks: Bank[] = [
  { name: 'Vietcombank', code: 'VCB', color: '#007a3d' },
  { name: 'VietinBank', code: 'ICB', color: '#0066b3' },
  { name: 'BIDV', code: 'BIDV', color: '#0b7a38' },
  { name: 'Agribank', code: 'VBA', color: '#b91c1c' },
  { name: 'KEB Hana Bank', code: 'MB', color: '#2AAD69' },
  { name: 'Techcombank', code: 'TCB', color: '#ef233c' },
  { name: 'ACB', code: 'ACB', color: '#2563eb' },
  { name: 'Sacombank', code: 'STB', color: '#f97316' },
  { name: 'VPBank', code: 'VPB', color: '#16a34a' },
  { name: 'TPBank', code: 'TPB', color: '#7c3aed' },
  { name: 'HDBank', code: 'HDB', color: '#0ea5e9' },
  { name: 'VIB', code: 'VIB', color: '#ef4444' },
  { name: 'SHB', code: 'SHB', color: '#15803d' },
  { name: 'OCB', code: 'OCB', color: '#2563eb' },
  { name: 'MSB', code: 'MSB', color: '#1d4ed8' },
  { name: 'SeABank', code: 'SEAB', color: '#ef4444' },
  { name: 'LienVietPostBank', code: 'LPB', color: '#2563eb' },
  { name: 'Eximbank', code: 'EIB', color: '#f97316' },
  { name: 'Nam A Bank', code: 'NAB', color: '#16a34a' },
  { name: 'ABBank', code: 'ABB', color: '#7c3aed' },
  { name: 'Bac A Bank', code: 'BAB', color: '#0f766e' },
  { name: 'BaoViet Bank', code: 'BVB', color: '#0284c7' },
  { name: 'KienlongBank', code: 'KLB', color: '#dc2626' },
  { name: 'NCB', code: 'NCB', color: '#7c3aed' },
  { name: 'PGBank', code: 'PGB', color: '#f97316' },
  { name: 'PVcomBank', code: 'PVCB', color: '#0f766e' },
  { name: 'Saigonbank', code: 'SGB', color: '#2563eb' },
  { name: 'SCB', code: 'SCB', color: '#be123c' },
  { name: 'VietABank', code: 'VAB', color: '#16a34a' },
  { name: 'VietBank', code: 'VIETBANK', color: '#0ea5e9' },
  { name: 'CBBank', code: 'CBB', color: '#dc2626' },
  { name: 'GPBank', code: 'GPB', color: '#16a34a' },
  { name: 'OceanBank', code: 'OCEANBANK', color: '#2563eb' },
  { name: 'Woori Bank', code: 'WVN', color: '#2563eb' },
  { name: 'Shinhan Bank', code: 'SHBVN', color: '#1d4ed8' },
  { name: 'HSBC', code: 'HSBC', color: '#dc2626' },
  { name: 'Standard Chartered', code: 'SCVN', color: '#0f766e' },
  { name: 'UOB', code: 'UOB', color: '#1d4ed8' },
  { name: 'Public Bank', code: 'PBVN', color: '#dc2626' },
  { name: 'CIMB', code: 'CIMB', color: '#be123c' },
];

export default function BankInfoPage() {
  const router = useRouter();
  const [form, setForm] = useState({ account: '', owner: '', bank: '' });
  const [submitted, setSubmitted] = useState(false);
  const [open, setOpen] = useState(false);
  const selected = banks.find((b) => b.name === form.bank);
  const missing = (key: keyof typeof form) => submitted && !form[key];
  const next = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (form.account && form.owner && form.bank) {
      window.localStorage.setItem('loanBank', JSON.stringify(form));
      router.push('/confirm-loan');
    }
  };

  return (
    <main className="min-h-screen bg-[#142014] text-[#333]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] bg-white pb-[82px]">
        <header className="relative flex h-[50px] items-center justify-center bg-[#2AAD69] text-white">
          <Link href="/kyc" className="absolute left-4"><ArrowLeft className="h-7 w-7" /></Link>
          <h1 className="text-[21px] font-bold">Xác minh</h1>
        </header>
        <h2 className="mt-[14px] text-center text-[18px] font-bold">Thông tin ngân hàng thụ hưởng</h2>
        <section className="bank-card mx-[26px] mt-1 h-[200px] rounded-[8px] p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-[21px]">{form.bank || 'Chọn ngân hàng'}</div>
            <BankIcon bank={selected || banks[4]} />
          </div>
          <div className="mt-7 h-9 w-12 rounded-[6px] bg-gradient-to-br from-[#f5c36c] to-[#a86920]" />
          <div className="mt-9 text-[22px] tracking-[4px]">{form.account ? form.account.replace(/.(?=.{4})/g, '•') : '••••••••••••'}</div>
          <div className="mt-1 text-[18px] tracking-[2px]">{form.owner || '*********'}</div>
        </section>
        <form className="mx-[26px] mt-[32px] space-y-[18px]" onSubmit={next}>
          <Field icon={<Globe2 />} placeholder="Số tài khoản" value={form.account} error={missing('account')} onChange={(v) => setForm({ ...form, account: v })} />
          <Field icon={<CircleUserRound />} placeholder="Tên chủ tài khoản" value={form.owner} error={missing('owner')} onChange={(v) => setForm({ ...form, owner: v })} />
          <div className="relative">
            <button type="button" onClick={() => setOpen(!open)} className={`flex h-[42px] w-full items-center justify-between border bg-white px-3 text-[16px] outline-none ${missing('bank') ? 'border-[#c92232]' : 'border-[#ddd]'} ${form.bank ? 'text-[#333]' : 'text-[#999]'}`}>
              <span className="flex items-center gap-2">{selected && <BankIcon bank={selected} small />}{form.bank || 'Chọn ngân hàng thụ hưởng'}</span>
              <ChevronDown className="h-5 w-5 text-[#999]" />
            </button>
            {open && (
              <div className="absolute z-30 mt-1 max-h-[260px] w-full overflow-y-auto rounded-[4px] border border-[#ddd] bg-white shadow-xl">
                {banks.map((bank) => (
                  <button key={bank.code} type="button" onClick={() => { setForm({ ...form, bank: bank.name }); setOpen(false); }} className="flex w-full items-center gap-3 px-3 py-2 text-left text-[15px] hover:bg-[#f3f5ff]">
                    <BankIcon bank={bank} small />
                    <span>{bank.name}</span>
                  </button>
                ))}
              </div>
            )}
            {missing('bank') && <p className="text-[13px] text-[#c92232]">Vui lòng chọn ngân hàng</p>}
          </div>
          <div className="grid grid-cols-5 gap-x-2 gap-y-3">
            {banks.slice(0,20).map((bank) => <button type="button" key={bank.code} onClick={() => setForm({ ...form, bank: bank.name })} className="flex flex-col items-center gap-1 text-[10px]"><BankIcon bank={bank} /><span className="line-clamp-1 w-full text-center">{bank.name}</span></button>)}
          </div>
          <div className="flex justify-center pt-[10px]"><button className="flex h-[57px] w-[139px] items-center justify-center rounded-full bg-[#2AAD69] text-[20px] font-bold text-white">Gửi yêu cầu</button></div>
        </form>
        <MobileBottomNav active="plus" />
      </div>
    </main>
  );
}

function BankIcon({ bank, small = false }: { bank: Bank; small?: boolean }) {
  const size = small ? 'h-7 w-7' : 'h-8 w-8';
  const font = small ? 'text-[9px]' : 'text-[10px]';
  return (
    <span className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5`}>
      <img src={`https://api.vietqr.io/img/${bank.code}.png`} alt={bank.name} className="h-full w-full object-contain p-[2px]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      <span className={`absolute inset-0 -z-10 flex items-center justify-center rounded-full font-black text-white ${font}`} style={{ backgroundColor: bank.color }}>{bank.code.slice(0, 3)}</span>
    </span>
  );
}

function Field({ icon, placeholder, value, error, onChange }: { icon: React.ReactNode; placeholder: string; value: string; error?: boolean; onChange: (v: string) => void }) {
  return <div className="relative"><span className="absolute left-3 top-[10px] h-5 w-5 text-[#555]">{icon}</span><input className={`h-[42px] w-full border pl-12 pr-3 text-[16px] outline-none placeholder:text-[#bbb] ${error ? 'border-[#c92232]' : 'border-[#ddd]'}`} placeholder={placeholder} value={value} onChange={(e)=>onChange(e.target.value)} />{error && <p className="text-[13px] text-[#c92232]">Vui lòng nhập {placeholder.toLowerCase()}</p>}</div>;
}
