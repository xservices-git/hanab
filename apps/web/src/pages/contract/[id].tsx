import type { GetServerSideProps } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

type Props = { loan: any };

export default function ContractPdfPage({ loan }: Props) {
  const user = loan.user;
  const p = user.profile;
  const contract = loan.contracts?.[0];
  const bank = p?.bankAccounts?.find((b: any) => b.isPrimary) || p?.bankAccounts?.[0];
  const customerName = user.name || p?.fullName || '-';
  const contractNo = `MBV-${String(loan.id).slice(0, 8).toUpperCase()}`;

  return <main className="min-h-screen bg-slate-200 p-4 print:bg-white print:p-0">
    <div className="mx-auto mb-4 flex max-w-[820px] justify-end print:hidden">
      <button onClick={() => window.print()} className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white">In / Lưu PDF</button>
    </div>

    <article className="relative mx-auto max-w-[820px] overflow-hidden bg-white p-10 text-[14.5px] leading-7 text-slate-950 shadow-xl print:shadow-none">
      <img src="/mb-bank-logo.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 w-[430px] -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] opacity-[0.055]" />

      <header className="relative border-b-4 border-blue-700 pb-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <img src="/mb-bank-logo.jpg" alt="KEB Hana Bank" className="h-12 w-auto object-contain" />
              <div>
                <div className="text-3xl font-black tracking-tight text-blue-700">KEB Hana Bank</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Hợp đồng tín dụng điện tử</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 text-right text-xs leading-5">
            <div><b>Số hợp đồng:</b> {contractNo}</div>
            <div><b>Mã hồ sơ:</b> #{String(loan.id).slice(0, 8)}</div>
            <div><b>Ngày ký:</b> {date(contract?.signedAt)}</div>
          </div>
        </div>
      </header>

      <section className="relative mt-6 text-center">
        <h1 className="text-sm font-black">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />Độc lập - Tự do - Hạnh phúc</h1>
        <h2 className="mt-6 text-2xl font-black uppercase">Hợp đồng tín dụng kiêm xác nhận giải ngân</h2>
        <p className="mt-2 text-xs text-slate-500">Áp dụng cho khoản vay đăng ký qua hệ thống điện tử</p>
      </section>

      <section className="relative mt-8">
        <Title>I. Thông tin các bên</Title>
        <div className="rounded-2xl border border-slate-200 p-4">
          <Row label="Bên cho vay" value="KEB Hana Bank - khối dịch vụ tín dụng số" />
          <Row label="Đại diện" value="Bộ phận phê duyệt khoản vay trực tuyến" />
          <Row label="Bên vay" value={customerName} />
          <Row label="CCCD" value={p?.citizenId || '-'} />
          <Row label="SĐT" value={user.phone || '-'} />
          <Row label="Tên người thân" value={p?.emergencyName || '-'} />
          <Row label="Số điện thoại người thân" value={p?.emergencyPhone || '-'} />
          <Row label="Quan hệ" value={p?.emergencyRelation || '-'} />
        </div>
      </section>

      <section className="relative mt-7">
        <Title>II. Thông tin khoản vay</Title>
        <div className="rounded-2xl border border-slate-200 p-4">
          <Row label="Số tiền vay" value={`${money(loan.amount)} VND`} strong />
          <Row label="Thời hạn vay" value={`${loan.termMonths || 0} tháng`} />
          <Row label="Lãi suất" value={`${loan.interestRate || 0}%/tháng`} />
          <Row label="Ngày tạo hồ sơ" value={date(loan.createdAt)} />
          <Row label="Trạng thái" value={statusLabel(loan.status)} />
        </div>
      </section>

      <section className="relative mt-7">
        <Title>III. Thông tin giải ngân</Title>
        <div className="rounded-2xl border border-slate-200 p-4">
          <Row label="Ngân hàng nhận" value={bank?.bankName || '-'} />
          <Row label="Số tài khoản" value={bank?.accountNumber || '-'} />
          <Row label="Chủ tài khoản" value={bank?.accountName || customerName} />
        </div>
      </section>

      <section className="relative mt-7 space-y-3 text-justify">
        <Title>IV. Điều khoản xác nhận</Title>
        <p>Bên vay xác nhận đã đọc, hiểu và đồng ý toàn bộ nội dung hợp đồng tín dụng này, bao gồm số tiền vay, thời hạn vay, lãi suất, phí phát sinh nếu có, phương thức giải ngân, phương thức thu nợ và nghĩa vụ thanh toán đúng hạn.</p>
        <p>Bên vay cam kết thông tin cá nhân, số CCCD, số điện thoại, địa chỉ cư trú, thông tin tài khoản nhận tiền và thông tin người thân liên hệ là chính xác. Bên vay chịu trách nhiệm trước pháp luật nếu cung cấp thông tin sai lệch, giả mạo hoặc sử dụng tài khoản không thuộc quyền quản lý hợp pháp.</p>
        <p>Khoản vay được giải ngân vào tài khoản do bên vay cung cấp sau khi hồ sơ được phê duyệt. Kể từ thời điểm giải ngân thành công, bên vay có nghĩa vụ hoàn trả đầy đủ nợ gốc, lãi và các khoản phí liên quan theo lịch thanh toán đã được hệ thống thông báo.</p>
        <p>Trường hợp bên vay thanh toán chậm, bên vay đồng ý chịu lãi chậm trả, phí nhắc nợ và các biện pháp xử lý khoản vay theo quy định của bên cho vay. Bên cho vay có quyền liên hệ bên vay và người thân được cung cấp để xác minh, nhắc lịch thanh toán và đối soát nghĩa vụ trả nợ.</p>
        <p>Bên vay đồng ý sử dụng chữ ký điện tử/ảnh chữ ký tay được ghi nhận trên hệ thống để xác nhận hợp đồng. Chữ ký này có giá trị xác nhận ý chí giao kết, chấp thuận khoản vay và được lưu cùng hồ sơ điện tử của bên vay.</p>
      </section>

      <section className="relative mt-10 grid grid-cols-2 gap-8 text-center">
        <div className="min-h-[190px] p-4">
          <div className="font-black uppercase">Bên vay</div>
          <div className="text-xs text-slate-500">Ký và ghi rõ họ tên</div>
          {contract?.signatureImage ? <img src={contract.signatureImage} alt="Chữ ký người vay" className="mx-auto mt-3 h-24 w-full object-contain" /> : <div className="mt-12 text-slate-400">Chưa có chữ ký</div>}
          <div className="mt-2 font-bold">{customerName}</div>
          <div className="mt-1 text-[11px] text-slate-500">Ký lúc: {dateTime(contract?.signedAt)}</div>
        </div>

        <div className="min-h-[190px] p-4">
          <div className="font-black uppercase">Đại diện KEB Hana Bank</div>
          <div className="text-xs text-slate-500">Xác nhận hệ thống</div>
          <div className="relative mx-auto mt-5 h-32 w-44">
            <img src="/mb-bank-logo.jpg" alt="KEB Hana Bank" className="mx-auto h-14 w-auto object-contain" />
            <svg viewBox="0 0 160 160" className="absolute left-1/2 top-7 h-24 w-24 -translate-x-1/2 rotate-[-9deg] opacity-90">
              <circle cx="80" cy="80" r="66" fill="none" stroke="#dc2626" strokeWidth="5" strokeDasharray="3 2" />
              <circle cx="80" cy="80" r="51" fill="none" stroke="#dc2626" strokeWidth="2" opacity="0.75" />
              <text x="80" y="48" textAnchor="middle" fontSize="14" fontWeight="800" fill="#dc2626">KEB Hana Bank</text>
              <text x="80" y="84" textAnchor="middle" fontSize="18" fontWeight="900" fill="#dc2626">ĐÃ KÝ</text>
              <text x="80" y="108" textAnchor="middle" fontSize="10" fontWeight="700" fill="#dc2626">XÁC NHẬN ĐIỆN TỬ</text>
              <path d="M49 119c18 8 43 8 62 0" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            </svg>
          </div>
        </div>
      </section>


    </article>
  </main>;
}

function Title({ children }: any) { return <h3 className="mb-3 text-[15px] font-black uppercase text-blue-800">{children}</h3>; }
function Row({ label, value, strong }: any) {
  return <div className="grid grid-cols-[170px_1fr] border-b border-slate-100 py-2 last:border-b-0"><b>{label}</b><span className={strong ? 'font-black text-blue-700' : ''}>{value}</span></div>;
}
function money(v: number) { return new Intl.NumberFormat('vi-VN').format(Number(v || 0)); }
function statusLabel(v: string) {
  const labels: Record<string, string> = { submitted: 'Đã gửi', draft: 'Nháp', reviewing: 'Đang duyệt', approved: 'Đã duyệt', disbursed: 'Đã giải ngân', closed: 'Đã tất toán', rejected: 'Từ chối' };
  return labels[v] || v || '-';
}
function date(v: any) { return v ? new Date(v).toLocaleDateString('vi-VN') : '-'; }
function dateTime(v: any) { return v ? new Date(v).toLocaleString('vi-VN') : '-'; }

export const getServerSideProps: GetServerSideProps = async ({ req, params }) => {
  const token = req.cookies?.token;
  const payload = token ? await verifyToken(token) : null;
  if (!payload?.id) return { redirect: { destination: '/login', permanent: false } };
  const loan = await prisma.loan.findUnique({
    where: { id: String(params?.id) },
    include: { user: { include: { profile: { include: { bankAccounts: true } } } }, contracts: true },
  });
  if (!loan) return { notFound: true };
  const allowed = payload.role === 'admin' || payload.role === 'agent' || loan.userId === payload.id;
  if (!allowed) return { redirect: { destination: '/login', permanent: false } };
  return { props: { loan: JSON.parse(JSON.stringify(loan)) } };
};
