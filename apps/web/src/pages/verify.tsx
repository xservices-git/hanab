import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, ChevronDown, CircleDollarSign, Contact, MapPin, Phone, ScanLine, Target, UsersRound } from 'lucide-react';
import Link from 'next/link';
import MobileBottomNav from '../components/MobileBottomNav';

const inputCls = 'h-[39px] w-full rounded-[2px] border-0 bg-white px-2 text-[16px] outline-none placeholder:text-[#b9b9b9] focus:ring-0';
const selectCls = `${inputCls} appearance-none text-[#777]`;

const genderOptions = ['Giới tính', 'Nam', 'Nữ', 'Khác'];
const incomeOptions = ['Chọn thu nhập của bạn', 'Dưới 5 triệu', '5 - 10 triệu', '10 - 20 triệu', '20 - 50 triệu', 'Trên 50 triệu'];
const purposeOptions = ['Mục đích vay', 'Tiêu dùng cá nhân', 'Kinh doanh', 'Thanh toán hóa đơn', 'Mua sắm', 'Khác'];
const relationOptions = ['Quan Hệ', 'Cha/Mẹ', 'Vợ/Chồng', 'Anh/Chị/Em', 'Bạn bè', 'Khác'];

export default function VerifyPage() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const set = (name: string, value: string) => setForm((old) => ({ ...old, [name]: value }));
  const required = ['name','id','gender','birthday','job','income','purpose','address','relativeName','relativePhone','relation'];
  const missing = (name: string) => submitted && !form[name];
  const goNext = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (required.every((name) => form[name])) {
      window.localStorage.setItem('loanProfile', JSON.stringify(form));
      router.push('/kyc');
    }
  };

  return (
    <main className="min-h-screen bg-[#142014] text-[#333]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] bg-white">
        <Header title="Xác minh" />
        <h1 className="mt-[19px] text-center text-[18px] font-bold">Thông tin cá nhân</h1>
        <form className="mx-[17px] mt-[12px] space-y-[18px]" onSubmit={goNext}>
          <Field name="name" placeholder="Họ tên" icon={<Contact />} value={form.name || ''} onChange={set} error={missing('name')} />
          <Field name="id" placeholder="Số Hộ chiếu/CCCD" icon={<ScanLine />} value={form.id || ''} onChange={set} error={missing('id')} />
          <SelectField name="gender" options={genderOptions} value={form.gender || ''} onChange={set} error={missing('gender')} />
          <BirthdayField value={form.birthday || ''} onChange={set} error={missing('birthday')} />
          <Field name="job" placeholder="Nghề nghiệp" icon={<BriefcaseBusiness />} value={form.job || ''} onChange={set} error={missing('job')} />
          <SelectField name="income" options={incomeOptions} icon={<CircleDollarSign />} value={form.income || ''} onChange={set} error={missing('income')} />
          <SelectField name="purpose" options={purposeOptions} icon={<Target />} value={form.purpose || ''} onChange={set} error={missing('purpose')} />
          <Field name="address" placeholder="Địa chỉ" icon={<MapPin />} value={form.address || ''} onChange={set} error={missing('address')} />
          <Field name="relativeName" placeholder="Tên người thân" icon={<UsersRound />} value={form.relativeName || ''} onChange={set} error={missing('relativeName')} />
          <Field name="relativePhone" placeholder="SĐT người thân" icon={<Phone />} value={form.relativePhone || ''} onChange={set} error={missing('relativePhone')} />
          <SelectField name="relation" options={relationOptions} icon={<UsersRound />} value={form.relation || ''} onChange={set} error={missing('relation')} blue />
          <div className="flex justify-center pt-1">
            <button className="flex h-[52px] w-[104px] items-center justify-center rounded-full bg-[#2AAD69] text-[20px] font-bold text-white">Tiếp tục</button>
          </div>
        </form>
        <MobileBottomNav active="plus" />
      </div>
    </main>
  );
}

export function Header({ title }: { title: string }) {
  return <header className="relative flex h-[46px] items-center justify-center bg-[#2AAD69] text-white"><Link href="/dashboard" className="absolute left-3 top-[11px]"><ArrowLeft className="h-6 w-6" /></Link><div className="text-[20px] font-bold">{title}</div></header>;
}

function Field({ name, placeholder, icon, value, onChange, error }: { name: string; placeholder: string; icon?: React.ReactNode; value: string; onChange: (n: string, v: string) => void; error?: boolean }) {
  return <div className="relative"><input className={`${inputCls} ${error ? 'border-[#c63049]' : ''}`} placeholder={placeholder} value={value} onChange={(e) => onChange(name, e.target.value)} />{icon && <span className="absolute right-2 top-[9px] h-5 w-5 text-[#666]">{icon}</span>}{error && <p className="text-[13px] leading-[16px] text-[#c92232]">Vui lòng nhập {placeholder.toLowerCase()}</p>}</div>;
}

function BirthdayField({ value, onChange, error }: { value: string; onChange: (n: string, v: string) => void; error?: boolean }) {
  const [parts, setParts] = useState(() => {
    const [day = '', month = '', year = ''] = value.split('/');
    return { day, month, year };
  });
  const { day, month, year } = parts;
  const years = Array.from({ length: 66 }, (_, i) => String(new Date().getFullYear() - 18 - i));

  useEffect(() => {
    const [nextDay = '', nextMonth = '', nextYear = ''] = value.split('/');
    if (value && (nextDay !== day || nextMonth !== month || nextYear !== year)) setParts({ day: nextDay, month: nextMonth, year: nextYear });
  }, [value]);

  const setPart = (nextDay: string, nextMonth: string, nextYear: string) => {
    setParts({ day: nextDay, month: nextMonth, year: nextYear });
    onChange('birthday', nextDay && nextMonth && nextYear ? `${nextDay}/${nextMonth}/${nextYear}` : '');
  };

  return (
    <div>
      <div className="mb-1 text-[14px] font-medium text-[#555]">Ngày sinh</div>
      <div className="grid grid-cols-3 gap-2">
        <MiniSelect label="Ngày" value={day} options={Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))} onChange={(v) => setPart(v, month, year)} error={error} />
        <MiniSelect label="Tháng" value={month} options={Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))} onChange={(v) => setPart(day, v, year)} error={error} />
        <MiniSelect label="Năm" value={year} options={years} onChange={(v) => setPart(day, month, v)} error={error} />
      </div>
      {error && <p className="text-[13px] leading-[16px] text-[#c92232]">Vui lòng chọn sinh nhật</p>}
    </div>
  );
}

function MiniSelect({ label, value, options, onChange, error }: { label: string; value: string; options: string[]; onChange: (v: string) => void; error?: boolean }) {
  return (
    <label className="relative block">
      <select
        className={`${selectCls} h-[39px] rounded-[2px] pr-7 text-[#333] ${!value ? 'text-[#b9b9b9]' : ''} ${error ? 'border border-[#c63049]' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>{label}</option>
        {options.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-[10px] h-5 w-5 text-[#2AAD69]" />
    </label>
  );
}

function SelectField({ name, options, icon, value, onChange, error, blue }: { name: string; options: string[]; icon?: React.ReactNode; value: string; onChange: (n: string, v: string) => void; error?: boolean; blue?: boolean }) {
  return <div className="relative"><select className={`${selectCls} ${error ? 'border border-[#c63049]' : ''}`} value={value} onChange={(e) => onChange(name, e.target.value)}><option value="" disabled>{options[0]}</option>{options.slice(1).map((x) => <option key={x} value={x}>{x}</option>)}</select><span className="pointer-events-none absolute right-2 top-[9px] h-5 w-5 text-[#666]">{icon ?? <ChevronDown />}</span>{error && <p className="text-[13px] leading-[16px] text-[#c92232]">Vui lòng chọn {options[0].toLowerCase()}</p>}</div>;
}

