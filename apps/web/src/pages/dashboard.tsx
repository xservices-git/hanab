import Image from 'next/image';
import MobileBottomNav from '../components/MobileBottomNav';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, BookOpenText, Gauge, Newspaper, ShieldCheck, SlidersHorizontal, User } from 'lucide-react';
import { useToast } from '@/components/ui/toast';


const promoSlides = [
  { src: '/keb-hana-slide-1.png', title: 'KEB Hana Bank Online đồng hành cùng bạn', text: 'Tư vấn hồ sơ vay trực tuyến, xét duyệt nhanh, bảo mật thông tin.' },
  { src: '/keb-hana-slide-2.jpg', title: 'KEB Hana Bank đồng hành tài chính', text: 'Dịch vụ vay online nhanh, tiện lợi, hỗ trợ khách hàng mọi lúc.' },
  { src: '/keb-hana-slide-3.jpg', title: 'Hệ thống chi nhánh KEB Hana', text: 'Mạng lưới chi nhánh và ATM rộng khắp, sẵn sàng phục vụ khách hàng 24/7.' },
  { src: '/keb-hana-slide-4.jpg', title: 'Hỗ trợ khách hàng tận nơi', text: 'CSKH tư vấn hồ sơ, hỗ trợ giải ngân về tài khoản liên kết.' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [phone, setPhone] = useState('0559922189');
  const [checkingLoan, setCheckingLoan] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [withdrawNotice, setWithdrawNotice] = useState('078***1 đã rút 130,000,000 KRW');
  const withdrawNoticeIndex = useRef(0);

  useEffect(() => {
    setPhone(window.localStorage.getItem('phone') || '0559922189');
    const updateNotice = () => {
      withdrawNoticeIndex.current += 1;
      setWithdrawNotice(createWithdrawNotice(withdrawNoticeIndex.current));
    };
    updateNotice();
    const noticeTimer = window.setInterval(updateNotice, 2600);
    const slideTimer = window.setInterval(() => setActiveSlide((current) => (current + 1) % promoSlides.length), 3200);
    return () => {
      window.clearInterval(noticeTimer);
      window.clearInterval(slideTimer);
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 text-[#333]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] bg-white pb-[82px] shadow-sm">
        <header className="flex h-[66px] items-start justify-between bg-[#2AAD69] px-4 pt-3 text-white">
          <div className="flex items-center gap-2 leading-[21px]">
            <User className="h-5 w-5 text-white" strokeWidth={2} />
            <div>
              <div className="text-[15px] opacity-95">Xin chào,</div>
              <div className="text-[15px] font-semibold">{phone}</div>
            </div>
          </div>
          <button aria-label="Thông báo" className="mt-1 rounded-full p-2 active:bg-white/10">
            <Bell className="h-5 w-5 text-white" strokeWidth={2} />
          </button>
        </header>

        <div className="mx-5 mt-3 flex h-9 items-center justify-center rounded-xl bg-[#f1f3f7] text-[14px] text-slate-700 shadow-inner">
          {withdrawNotice}
        </div>

        <section className="mx-5 mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#2AAD69] via-[#2330ef] to-[#071066] p-5 text-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <div className="text-[15px] font-medium opacity-90">KEB Hana  Bank Online</div>
          <div className="mt-2 text-[24px] font-bold leading-tight">Vay tiền nhanh</div>
          <div className="mt-1 text-[15px] opacity-90">Hạn mức lên đến 500,000,000 KRW</div>
          <div className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-[#2AAD69]">Đăng ký ngay</div>
        </section>

        <div className="mt-5 flex justify-center">
          <button
            onClick={async () => {
              if (checkingLoan) return;
              setCheckingLoan(true);
              try {
                const res = await fetch('/api/loans', { credentials: 'include' });
                if (res.status === 401) {
                  router.push('/login');
                  return;
                }
                const json = await res.json();
                const loan = json?.data?.[0];
                if (!loan) {
                  router.push('/choose-loan');
                  return;
                }
                showToast('Bạn có hồ sơ đang đợi, vui lòng liên hệ CSKH');
              } finally {
                setCheckingLoan(false);
              }
            }}
            className="flex h-[55px] w-[214px] items-center justify-center rounded-xl bg-[#2AAD69] text-[20px] font-semibold text-white shadow-[0_10px_22px_rgba(20,30,210,0.25)] transition active:scale-95"
          >
            {checkingLoan ? 'Đang kiểm tra...' : 'Đăng ký khoản vay'}
          </button>
        </div>

        <section className="mt-7 space-y-[10px]">
          <Benefit text="Thủ tục vay nhanh chóng, đơn giản" icon={<AlertTriangle className="h-5 w-5 text-[#ff7323]" />} />
          <Benefit text="Hạn mức vay lên đến 500tr KRW" icon={<Gauge className="h-5 w-5 text-[#008f50]" />} />
          <Benefit text="Nhận tiền chỉ sau 30 phút làm hồ sơ" icon={<SlidersHorizontal className="h-5 w-5 text-[#2AAD69]" />} />
        </section>

        <section className="mx-5 mt-7 overflow-hidden rounded-2xl bg-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <div className="relative h-[190px] w-full overflow-hidden">
            {promoSlides.map((slide, index) => (
              <Image
                key={slide.src}
                src={slide.src}
                alt={slide.title}
                width={700}
                height={420}
                sizes="390px"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${index === activeSlide ? 'opacity-100' : 'opacity-0'}`}
                priority={index === 0}
              />
            ))}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {promoSlides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  aria-label={`Chọn slide ${index + 1}`}
                  onClick={() => setActiveSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${index === activeSlide ? 'w-7 bg-white' : 'w-3 bg-white/55'}`}
                />
              ))}
            </div>
          </div>
          <div className="bg-white p-4">
            <div className="text-[17px] font-bold text-slate-900">{promoSlides[activeSlide].title}</div>
            <div className="mt-1 text-[13px] leading-5 text-slate-500">{promoSlides[activeSlide].text}</div>
          </div>
        </section>

        <section className="mx-5 mt-4 grid gap-3">
          <Article icon={<ShieldCheck className="h-5 w-5 text-[#2AAD69]" />} title="Vay online an toàn" text="Xác minh CCCD, chữ ký điện tử, bảo mật thông tin khách hàng." />
          <Article icon={<Newspaper className="h-5 w-5 text-[#008f50]" />} title="Duyệt hồ sơ nhanh" text="Hồ sơ đầy đủ được CS kiểm tra và phản hồi trong thời gian ngắn." />
          <Article icon={<BookOpenText className="h-5 w-5 text-[#ff7323]" />} title="Kinh nghiệm vay phù hợp" text="Chọn khoản vay theo thu nhập để giữ lịch trả nợ ổn định." />
        </section>

        <footer className="mt-2 h-[92px] pt-5 text-center">
          <Image src="https://i.imgur.com/KTvuiwM.png" alt="Bộ Công Thương" width={100} height={32} sizes="100px" className="mx-auto h-8 w-[100px] object-contain" />
          <div className="mx-auto mt-1 w-[275px] text-[14px] leading-5 text-[#555]">
            Bản quyền thuộc về<br />Ngân hàng Thương mại Cổ phần KEB Hana Bank
          </div>
        </footer>

        <MobileBottomNav active="home" />
      </div>
    </main>
  );
}


function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function createWithdrawNotice(index = 0) {
  const now = new Date();
  const timeSeed = now.getTime() + index * 7919;
  const prefixOptions = ['032', '033', '034', '035', '036', '037', '038', '039', '052', '056', '058', '070', '076', '077', '078', '079', '081', '082', '083', '084', '085', '086', '088', '089', '090', '091', '092', '093', '094', '096', '097', '098'];
  const prefix = prefixOptions[Math.floor(seededRandom(timeSeed + 11) * prefixOptions.length)];
  const maskedMiddle = String(Math.floor(seededRandom(timeSeed + 17) * 900) + 100);
  const last = Math.floor(seededRandom(timeSeed + 23) * 10);
  const amountSteps = [30, 40, 50, 60, 70, 80, 90, 100, 120, 130, 150, 180, 200, 220, 250, 280, 300, 350, 400, 450, 500];
  const amount = amountSteps[Math.floor(seededRandom(timeSeed + 37) * amountSteps.length)] * 1000000;
  return `${prefix}***${maskedMiddle}${last} đã rút ${amount.toLocaleString('ko-KR')} KRW`;
}

function Article({ title, text, icon }: { title: string; text: string; icon: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50">{icon}</div>
      <div>
        <div className="text-[15px] font-bold text-slate-900">{title}</div>
        <div className="mt-1 text-[13px] leading-5 text-slate-500">{text}</div>
      </div>
    </div>
  );
}

function Benefit({ text, icon }: { text: string; icon: React.ReactNode }) {
  return (
    <div className="mx-5 flex h-[42px] items-center justify-between rounded-xl border border-[#2AAD69]/20 bg-white px-4 shadow-sm">
      <span className="text-[15px] font-medium text-[#2AAD69]">{text}</span>
      {icon}
    </div>
  );
}
