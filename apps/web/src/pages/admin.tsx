import type { GetServerSideProps } from 'next';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { Activity, AlertTriangle, Banknote, Bell, Briefcase, Building2, CheckCircle2, ChevronRight, ClipboardList, Clock3, CreditCard, Download, ExternalLink, Facebook, Headphones, History, LayoutDashboard, LogOut, MapPin, Menu, MessageCircle, MinusCircle, Phone, Plus, PlusCircle, Search, Send, ShieldCheck, UserRound, Users, X, XCircle } from 'lucide-react';
import * as Recharts from 'recharts';
import { useToast } from '@/components/ui/toast';

type Tab = 'overview' | 'customers' | 'loans' | 'agents';
type AdminProps = { user: any; agents: any[]; customers: any[]; loans: any[]; logs: any[] };

const { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } = Recharts as any;

const nav = [
  { id: 'overview' as const, label: 'Tổng quan', icon: LayoutDashboard, adminOnly: false },
  { id: 'customers' as const, label: 'Khách hàng', icon: Users, adminOnly: false },
  { id: 'loans' as const, label: 'Hồ sơ vay', icon: ClipboardList, adminOnly: false },
  { id: 'agents' as const, label: 'CS team', icon: Headphones, adminOnly: true },
];

export default function AdminPage({ user, agents, customers, loans, logs }: AdminProps) {
  const router = useRouter();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState<Tab>((router.query.tab as Tab) || 'customers');
  const [sidebar, setSidebar] = useState(false);
  const { showToast } = useToast();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loanFilterCustomer, setLoanFilterCustomer] = useState<string>('');
  const [page, setPage] = useState<Record<string, number>>({ customers: 1, loans: 1, agents: 1 });
  useEffect(() => setPage({ customers: 1, loans: 1, agents: 1 }), [q, tab, statusFilter, dateFrom, dateTo, loanFilterCustomer]);
  useEffect(() => { if (!isAdmin && tab === 'agents') setTab('overview'); }, [isAdmin, tab]);
  useEffect(() => { if (tab !== 'loans') setLoanFilterCustomer(''); }, [tab]);

  const search = q.trim().toLowerCase();
  const pending = loans.filter((l) => ['draft', 'submitted', 'reviewing'].includes(l.status));
  const approved = loans.filter((l) => ['approved', 'disbursed', 'closed'].includes(l.status));
  const filteredCustomers = customers.filter((c) => has(search, [c.name, c.phone, c.email, c.profile?.fullName, c.profile?.citizenId, accountLabel(c)]) && inDateRange(c.createdAt, dateFrom, dateTo));
  const filteredLoans = loans.filter((l) => has(search, [l.id, l.status, loanLabel(l.status), l.user?.name, l.user?.phone, l.user?.profile?.citizenId, l.assignedAgent?.name]) && (statusFilter === 'all' || l.status === statusFilter) && (!loanFilterCustomer || l.userId === loanFilterCustomer) && inDateRange(l.createdAt, dateFrom, dateTo));
  const filteredAgents = agents.filter((a) => has(search, [a.name, a.phone, a.email, a.telegramLink, accountLabel(a)]) && inDateRange(a.createdAt, dateFrom, dateTo));
  const totalAmount = useMemo(() => loans.reduce((sum, l) => sum + Number(l.amount || 0), 0), [loans]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
  }

  function reloadAdmin() {
    router.replace(router.asPath, undefined, { scroll: false });
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-[#0f172a] text-white transition-transform lg:translate-x-0 ${sidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600"><ShieldCheck size={22} /></div>
          <div><div className="text-lg font-black">MB CSM</div></div>
        </div>
        <nav className="space-y-1 p-3">
          {nav.filter((item) => isAdmin || !item.adminOnly).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return <button key={item.id} onClick={() => { setTab(item.id); setSidebar(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold transition ${active ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><span className="flex items-center gap-3"><Icon size={18} />{item.label}</span>{active && <ChevronRight size={16} />}</button>;
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <div className="mb-3 rounded-2xl bg-white/5 p-4">
            <div className="text-sm font-bold">{user?.name || 'Admin'}</div>
            <div className="mt-1 text-xs text-slate-400">{user?.phone || user?.email}</div>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-red-500/10 hover:text-red-300"><LogOut size={17} /> Đăng xuất</button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-5">
            <button onClick={() => setSidebar(true)} className="rounded-xl border border-slate-200 p-2 lg:hidden"><Menu size={20} /></button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-black lg:text-2xl">{title(tab)}</h1>
            </div>
            <div className="relative hidden w-[380px] md:block">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} className="rounded-2xl border-slate-200 bg-slate-50 pl-10" placeholder="Tìm khách, SĐT, CCCD, mã hồ sơ..." />
            </div>
            <button className="rounded-2xl border border-slate-200 bg-white p-3"><Bell size={18} /></button>
          </div>
          <div className="px-4 pb-4 md:hidden"><Input value={q} onChange={(e) => setQ(e.target.value)} className="rounded-2xl border-slate-200 bg-slate-50" placeholder="Tìm kiếm..." /></div>
        </header>

        <main className="space-y-4 p-3 lg:p-5">
          {tab !== 'overview' && <FilterBar statusFilter={statusFilter} onStatus={setStatusFilter} dateFrom={dateFrom} onDateFrom={setDateFrom} dateTo={dateTo} onDateTo={setDateTo} showStatus={tab === 'loans'} onClear={() => { setQ(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); }} />}
          {tab === 'overview' && <Overview loans={loans} customers={customers} agents={agents} pending={pending} approved={approved} totalAmount={totalAmount} isAdmin={isAdmin} />}
          {tab === 'customers' && <Customers customers={filteredCustomers} isAdmin={isAdmin} page={page.customers || 1} onPage={(n: number) => setPage((p) => ({ ...p, customers: n }))} onOpenLoan={(loan: any, customer: any) => { setTab('loans'); setLoanFilterCustomer(customer?.id || loan?.userId || ''); setQ(''); }} />}
          {tab === 'loans' && <div className="space-y-3"><Loans loans={filteredLoans} agents={agents} isAdmin={isAdmin} page={page.loans || 1} onPage={(n: number) => setPage((p) => ({ ...p, loans: n }))} loanFilterCustomer={loanFilterCustomer} onClearCustomerFilter={() => setLoanFilterCustomer('')} customers={customers} /></div>}
          {isAdmin && tab === 'agents' && <Agents agents={filteredAgents} loans={loans} logs={logs} page={page.agents || 1} onPage={(n: number) => setPage((p) => ({ ...p, agents: n }))} />}
        </main>
      </div>

      {sidebar && <button aria-label="close sidebar" className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebar(false)}><X className="absolute right-4 top-4 text-white" /></button>}
    </div>
  );
}


function FilterBar({ statusFilter, onStatus, dateFrom, onDateFrom, dateTo, onDateTo, showStatus, onClear }: any) {
  return <Card className="rounded-2xl border-slate-200 bg-white shadow-sm"><CardContent className="grid gap-3 p-4 md:grid-cols-4 lg:grid-cols-5">
    {showStatus && <select value={statusFilter} onChange={(e) => onStatus(e.target.value)} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold"><option value="all">Tất cả trạng thái</option><option value="draft">Chờ duyệt</option><option value="submitted">Chờ duyệt</option><option value="reviewing">Đang duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Từ chối</option><option value="disbursed">Giải ngân</option><option value="closed">Đóng</option><option value="defaulted">Quá hạn</option></select>}
    <Input type="date" value={dateFrom} onChange={(e) => onDateFrom(e.target.value)} className="rounded-2xl" />
    <Input type="date" value={dateTo} onChange={(e) => onDateTo(e.target.value)} className="rounded-2xl" />
    <Button variant="outline" onClick={onClear}>Xoá lọc</Button>
  </CardContent></Card>;
}

function Overview({ loans, customers, agents, pending, approved, totalAmount, isAdmin }: any) {
  const recent = loans.slice(0, 7);
  const totalBalance = useMemo(() => customers.reduce((sum: number, c: any) => sum + Number(c.balance || 0), 0), [customers]);
  return <>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Metric icon={ClipboardList} label={isAdmin ? 'Tổng hồ sơ' : 'Hồ sơ của tôi'} value={loans.length} />
      <Metric icon={Clock3} label="Chờ xử lý" value={pending.length} tone="amber" />
      <Metric icon={CheckCircle2} label="Đã duyệt" value={approved.length} tone="green" />
      <Metric icon={CreditCard} label="Tổng nhu cầu" value={money(totalAmount)} tone="blue" />
      {isAdmin && <Metric icon={Banknote} label="Tổng số dư KH" value={money(totalBalance)} tone={totalBalance >= 0 ? 'green' : 'blue'} />}
    </div>
    <OverviewCharts loans={loans} />
    <TelegramHookCard />
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <DataCard title="Hồ sơ mới nhất">
        <LoanTable loans={recent} agents={agents} compact />
      </DataCard>
      <Card className="rounded-2xl border-slate-200"><CardContent className="p-4"><div className="text-lg font-black">Health</div><div className="mt-5 space-y-4"><Health label="Khách hàng" value={customers.length} />{isAdmin && <Health label="CS team" value={agents.length} />}<Health label="Tỉ lệ duyệt" value={`${loans.length ? Math.round((approved.length / loans.length) * 100) : 0}%`} />{isAdmin && <Health label="Tổng số dư" value={money(totalBalance)} />}</div></CardContent></Card>
    </div>
  </>;
}


function TelegramHookCard() {
  return <Card className="rounded-2xl border-slate-200 bg-white shadow-sm"><CardContent className="p-4">
    <div className="text-lg font-black">Telegram bot</div>
    <div className="mt-2 text-sm text-slate-500">Hồ sơ vay mới sẽ gửi về Telegram nếu cấu hình đủ biến môi trường.</div>
    <div className="mt-4 grid gap-2 text-sm">
      <code className="rounded-xl bg-slate-50 p-3">TELEGRAM_BOT_TOKEN=...</code>
      <code className="rounded-xl bg-slate-50 p-3">TELEGRAM_LOAN_CHAT_ID=...</code>
    </div>
    <div className="mt-3 text-xs text-slate-500">Nội dung gồm: khách, SĐT, CCCD, ngày sinh, địa chỉ, thu nhập, khoản vay, ngân hàng, ảnh CCCD/selfie, chữ ký, sale được phân bổ.</div>
  </CardContent></Card>;
}

function OverviewCharts({ loans }: any) {
  const statusData = Object.entries(loans.reduce((acc: any, loan: any) => { acc[loanLabel(loan.status)] = (acc[loanLabel(loan.status)] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value }));
  const monthly = loans.reduce((acc: any, loan: any) => { const d = new Date(loan.createdAt); const key = `${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`; acc[key] = (acc[key] || 0) + Number(loan.amount || 0); return acc; }, {});
  const amountData = Object.entries(monthly).slice(-6).map(([name, value]) => ({ name, value: Math.round(Number(value) / 1000000) }));
  const colors = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#7c3aed', '#0891b2'];
  return <div className="grid gap-4 xl:grid-cols-2">
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm"><CardContent className="p-4"><div className="mb-4 text-lg font-black">Trạng thái hồ sơ</div><div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>{statusData.map((_: any, i: number) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></CardContent></Card>
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm"><CardContent className="p-4"><div className="mb-4 text-lg font-black">Giá trị vay theo tháng</div><div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={amountData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v: any) => `${v} triệu`} /><Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#2563eb" /></BarChart></ResponsiveContainer></div></CardContent></Card>
  </div>;
}

function Customers({ customers, isAdmin, page, onPage, onOpenLoan }: any) {
  const router = useRouter();
  const { showToast } = useToast();
  const reloadAdmin = () => router.replace(router.asPath, undefined, { scroll: false });
  const [contract, setContract] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [txFor, setTxFor] = useState<any>(null);
  const [historyFor, setHistoryFor] = useState<any>(null);
  async function toggleCustomer(c: any) {
    const locked = isLocked(c);
    const res = await fetch('/api/admin/customers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: c.id, locked: !locked }) });
    if (!res.ok) return showToast((await res.json()).error || 'Không cập nhật được trạng thái tài khoản');
    reloadAdmin();
  }
  async function toggleWithdrawViolation(c: any) {
    const flag = !isWithdrawViolation(c);
    const res = await fetch('/api/admin/customers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: c.id, withdrawViolation: flag }) });
    if (!res.ok) return showToast((await res.json()).error || 'Không cập nhật được trạng thái rút tiền vi phạm');
    reloadAdmin();
  }
  const pager = paginate(customers, page, 12);
  return <DataCard title="Khách hàng">
    <div className="overflow-x-auto">
      <Table className="min-w-[1080px]">
        <TableHeader><TableRow><TableHead>Khách hàng</TableHead><TableHead>CCCD</TableHead><TableHead>Số dư</TableHead><TableHead>LSGD</TableHead><TableHead>Hồ sơ</TableHead><TableHead>Trạng thái</TableHead><TableHead>Lịch sử</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader>
        <TableBody>{pager.items.map((c: any) => <Customer key={c.id} c={c} onViewContract={setContract} onOpenLoan={onOpenLoan} onToggleAccount={isAdmin ? toggleCustomer : undefined} onToggleWithdrawViolation={isAdmin ? toggleWithdrawViolation : undefined} onEdit={isAdmin ? setEditing : undefined} onOpenTransaction={isAdmin ? setTxFor : undefined} onOpenHistory={setHistoryFor} />)}</TableBody>
      </Table>
    </div>
    {!customers.length && <Empty text="Không có khách hàng" />}
    <Pagination page={pager.page} totalPages={pager.totalPages} total={customers.length} pageSize={12} onPage={onPage} />
    {contract && <ContractPopup data={contract} isAdmin={isAdmin} onClose={() => setContract(null)} onSaved={() => { reloadAdmin(); }} />}
    {editing && <EditCustomerPopup customer={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reloadAdmin(); }} />}
    {txFor && <TransactionPopup customer={txFor} onClose={() => setTxFor(null)} onSaved={() => { setTxFor(null); reloadAdmin(); }} />}
    {historyFor && <TransactionHistoryDialog customer={historyFor} onClose={() => setHistoryFor(null)} />}
  </DataCard>;
}
function Loans({ loans, agents, isAdmin, page, onPage, loanFilterCustomer, onClearCustomerFilter, customers }: any) { const pager = paginate(loans, page, 12); const filteredCustomer = customers?.find((c: any) => c.id === loanFilterCustomer); return <DataCard title="Hồ sơ vay">{loanFilterCustomer && <div className="mb-3 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800"><span>Đang lọc theo khách: <b>{filteredCustomer?.name || filteredCustomer?.phone || loanFilterCustomer}</b></span><button className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100" onClick={onClearCustomerFilter}>Bỏ lọc</button></div>}<LoanTable loans={pager.items} agents={agents} isAdmin={isAdmin} />{!loans.length && <Empty text="Không có hồ sơ" />}<Pagination page={pager.page} totalPages={pager.totalPages} total={loans.length} pageSize={12} onPage={onPage} /></DataCard>; }

function Agents({ agents, loans, logs, page, onPage }: any) {
  const router = useRouter();
  const { showToast } = useToast();
  const reloadAdmin = () => router.replace(router.asPath, undefined, { scroll: false });
  const [form, setForm] = useState({ name: '', phone: '', password: '', telegramLink: '' });
  const [editing, setEditing] = useState<any>(null);
  const [timeline, setTimeline] = useState<any>(null);

  async function createAgent() {
    if (!form.phone || !form.password) return showToast('Nhập SĐT và mật khẩu');
    const res = await fetch('/api/admin/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) return showToast((await res.json()).error || 'Không thêm được nhân viên');
    setForm({ name: '', phone: '', password: '', telegramLink: '' });
    reloadAdmin();
  }

  async function saveAgent() {
    if (!editing?.id) return;
    const res = await fetch('/api/admin/agents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: editing.id, name: editing.name, phone: editing.phone, telegramLink: editing.telegramLink, password: editing.password, locked: editing.locked }) });
    if (!res.ok) return showToast((await res.json()).error || 'Không sửa được nhân viên');
    setEditing(null);
    reloadAdmin();
  }

  async function deleteAgent(agent: any) {
    if (!confirm(`Xoá nhân viên ${agent.name || agent.phone}?`)) return;
    const res = await fetch('/api/admin/agents', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: agent.id }) });
    if (!res.ok) return showToast((await res.json()).error || 'Không xoá được nhân viên');
    reloadAdmin();
  }

  const pager = paginate(agents, page, 12);
  return <DataCard title="CS team">
    <div className="mb-5 grid gap-3 rounded-2xl bg-slate-50 p-4 lg:grid-cols-5"><Input placeholder="Tên" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input placeholder="SĐT" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><Input type="password" placeholder="Mật khẩu" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><Input placeholder="Telegram" value={form.telegramLink} onChange={(e) => setForm({ ...form, telegramLink: e.target.value })} /><Button onClick={createAgent}><Plus size={16} /> Thêm</Button></div>
    <Table className="min-w-[1080px]"><TableHeader><TableRow><TableHead>Nhân viên</TableHead><TableHead>SĐT</TableHead><TableHead>Telegram</TableHead><TableHead>Trạng thái</TableHead><TableHead>Hồ sơ</TableHead><TableHead className="w-[240px] min-w-[240px] text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>{pager.items.map((a: any) => <TableRow key={a.id}><TableCell><Person name={a.name || 'Agent'} sub={a.email || 'CS'} /></TableCell><TableCell>{a.phone || '-'}</TableCell><TableCell>{a.telegramLink || '-'}</TableCell><TableCell><AccountStatus account={a} /></TableCell><TableCell><Badge>{loans.filter((l: any) => l.assignedAgentId === a.id).length}</Badge></TableCell><TableCell className="w-[260px] min-w-[260px]"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setTimeline(a)}>Timeline</Button><Button size="sm" variant="outline" onClick={() => setEditing({ ...a, password: '', locked: isLocked(a) })}>Sửa</Button><Button size="sm" variant="destructive" onClick={() => deleteAgent(a)}>Xoá</Button></div></TableCell></TableRow>)}</TableBody></Table>
    <Pagination page={pager.page} totalPages={pager.totalPages} total={agents.length} pageSize={12} onPage={onPage} />
    {timeline && <AgentTimeline agent={timeline} loans={loans.filter((l: any) => l.assignedAgentId === timeline.id)} logs={logs.filter((log: any) => log.userId === timeline.id || log.metadata?.assignedAgentId === timeline.id || log.metadata?.assignedAgentId === String(timeline.id))} onClose={() => setTimeline(null)} />}
    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl"><div className="mb-5 text-xl font-black">Sửa nhân viên</div><div className="grid gap-3"><Input placeholder="Tên" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /><Input placeholder="SĐT" value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /><Input placeholder="Telegram" value={editing.telegramLink || ''} onChange={(e) => setEditing({ ...editing, telegramLink: e.target.value })} /><Input type="password" placeholder="Mật khẩu mới (bỏ trống nếu giữ nguyên)" value={editing.password || ''} onChange={(e) => setEditing({ ...editing, password: e.target.value })} /><label className="flex items-center gap-2 rounded-2xl border border-slate-200 p-3 text-sm font-bold"><input type="checkbox" checked={Boolean(editing.locked)} onChange={(e) => setEditing({ ...editing, locked: e.target.checked })} /> Khoá tài khoản</label></div><div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Huỷ</Button><Button onClick={saveAgent}>Lưu</Button></div></div></div>}
  </DataCard>;
}

function AgentTimeline({ agent, loans, logs, onClose }: any) {
  const events = [
    ...loans.map((l: any) => ({ type: 'loan', time: l.updatedAt || l.createdAt, title: 'Được chia hồ sơ vay', body: `${l.user?.name || l.user?.phone || '-'} · ${money(l.amount)} · ${loanLabel(l.status)}`, meta: `#${String(l.id).slice(0, 8)}` })),
    ...logs.map((log: any) => ({ type: 'log', time: log.createdAt, title: actionLabel(log.action), body: `${log.resource || '-'} ${log.resourceId ? '#' + String(log.resourceId).slice(0, 8) : ''}`, meta: formatMeta(log.metadata) })),
  ].sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4"><div><div className="text-xl font-black">Timeline nhân viên</div><div className="text-sm text-slate-500">{agent.name || agent.phone} · {loans.length} hồ sơ · {logs.length} logs</div></div><Button variant="outline" onClick={onClose}>Đóng</Button></div><div className="space-y-3 p-5">{events.map((e: any, i: number) => <div key={`${e.type}-${i}`} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><Badge className={e.type === 'loan' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'}>{e.type === 'loan' ? 'Đơn được chia' : 'Log'}</Badge><div className="mt-2 font-black">{e.title}</div><div className="text-sm font-semibold text-slate-600">{e.body}</div>{e.meta && <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{e.meta}</pre>}</div><div className="shrink-0 text-xs font-bold text-slate-400">{dateTime(e.time)}</div></div></div>)}{!events.length && <Empty text="Chưa có timeline/logs" />}</div></div></div>;
}

function LoanTable({ loans, agents, compact, isAdmin }: any) {
  const router = useRouter();
  const { showToast } = useToast();
  const reloadAdmin = () => router.replace(router.asPath, undefined, { scroll: false });
  const [busy, setBusy] = useState('');
  async function update(loanId: string, data: any) {
    setBusy(loanId);
    const res = await fetch('/api/admin/loans', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ loanId, ...data }) });
    setBusy('');
    if (!res.ok) return showToast((await res.json()).error || 'Cập nhật lỗi');
    reloadAdmin();
  }
  return <Table><TableHeader><TableRow><TableHead>Mã</TableHead><TableHead>Khách</TableHead><TableHead>Khoản vay</TableHead><TableHead className="text-right">Trạng thái</TableHead>{!compact && isAdmin && <TableHead>CS</TableHead>}<TableHead>Thao tác</TableHead></TableRow></TableHeader><TableBody>{loans.map((l: any) => {
    const wv = Boolean(l.user?.profile?.withdrawViolation);
    return <TableRow key={l.id}>
      <TableCell className="font-mono text-xs font-bold text-slate-500">#{String(l.id).slice(0, 8)}</TableCell>
      <TableCell><Person name={l.user?.name || l.user?.phone || '-'} sub={l.user?.phone || l.user?.profile?.citizenId || '-'} /></TableCell>
      <TableCell><b>{money(l.amount)}</b><div className="text-xs text-slate-500">{l.termMonths} tháng</div></TableCell>
      <TableCell><LoanStatusBadge loan={l} /></TableCell>
      {!compact && isAdmin && <TableCell><select disabled={busy === l.id} value={l.assignedAgentId || ''} onChange={(e) => update(l.id, { assignedAgentId: e.target.value })} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Chưa gán</option>{agents.map((a: any) => <option key={a.id} value={a.id}>{a.name || a.phone}</option>)}</select></TableCell>}
      <TableCell><div className="flex flex-wrap justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        {isAdmin && <Button size="sm" variant={wv ? 'destructive' : 'outline'} disabled={busy === l.id} onClick={() => update(l.id, { withdrawViolation: !wv })}><AlertTriangle size={14} />{wv ? 'Bỏ rút tiền vi phạm' : 'Rút tiền vi phạm'}</Button>}
        {isAdmin && !wv && !['approved', 'disbursed', 'closed'].includes(l.status) && <Button size="sm" disabled={busy === l.id} onClick={() => update(l.id, { status: 'approved' })}><CheckCircle2 size={14} /> Duyệt</Button>}
        {isAdmin && !wv && !['approved', 'rejected', 'disbursed', 'closed'].includes(l.status) && <Button size="sm" variant="outline" disabled={busy === l.id} onClick={() => update(l.id, { status: 'rejected', rejectionReason: 'Từ chối bởi admin' })}><XCircle size={14} /> Từ chối</Button>}
      </div></TableCell>
    </TableRow>;
  })}</TableBody></Table>;
}

function Customer({ c, onViewContract, onOpenLoan, onToggleAccount, onToggleWithdrawViolation, onEdit, onOpenTransaction, onOpenHistory }: any) {
  const p = c.profile;
  const loans = c.loans || [];
  const latestLoan = loans[0];
  const hasProfile = Boolean(p || loans.length);
  const txs = c.transactions || [];
  const txCredit = txs.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  const txDebit = txs.filter((t: any) => t.type === 'debit').reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  const balance = txCredit - txDebit;
  return <TableRow className={onEdit ? 'cursor-pointer hover:bg-slate-50' : ''} onClick={() => onEdit && onEdit(c)}>
    <TableCell><Person name={c.name || p?.fullName || c.phone || '-'} sub={c.phone || c.email || p?.address || '-'} /></TableCell>
    <TableCell className="font-mono text-xs">{p?.citizenId || '-'}</TableCell>
    <TableCell><div title={`Cộng: ${money(txCredit)} · Trừ: ${money(txDebit)}`}><b className={balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{balance >= 0 ? '+' : '-'}{money(Math.abs(balance))}</b>{txs.length > 0 && <div className="text-[10px] text-slate-400">{txs.length} giao dịch</div>}</div></TableCell>
    <TableCell>
      <Button type="button" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onOpenHistory && onOpenHistory(c); }} className="h-8 gap-1.5 px-3 text-xs"><History size={14} /> Lịch sử</Button>
    </TableCell>
    <TableCell>{money(p?.monthlyIncome || 0)}<div className="text-xs text-slate-500">{p?.jobTitle || 'Chưa cập nhật nghề'}</div></TableCell>
    <TableCell>
      <button type="button" onClick={(e) => { e.stopPropagation(); onOpenLoan && onOpenLoan(latestLoan || null, c); }} className="group flex flex-col items-start gap-1 rounded-lg px-1 py-1 text-left transition hover:bg-slate-100">
        <Badge variant="secondary" className="cursor-pointer">{loans.length} hồ sơ</Badge>
        {latestLoan ? (
          <div className="text-xs text-slate-500">{money(latestLoan.amount)} · {latestLoan.termMonths} tháng</div>
        ) : (
          <div className="text-xs italic text-slate-400">Chưa có hồ sơ</div>
        )}
        <span className="text-xs font-bold text-blue-600 opacity-70 group-hover:opacity-100">Xem hồ sơ vay →</span>
      </button>
    </TableCell>
    <TableCell><AccountStatus account={c} /></TableCell>
    <TableCell className="text-right"><div className="flex flex-wrap justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>{latestLoan && <Button size="sm" variant="outline" onClick={() => onViewContract({ customer: c, loan: latestLoan, contract: latestLoan.contracts?.[0] })}>Hợp đồng</Button>}{onOpenTransaction && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 px-2 text-xs" onClick={() => onOpenTransaction({ ...c, _txType: 'credit' })}><PlusCircle size={12} /> Cộng</Button>}{onOpenTransaction && <Button size="sm" className="bg-rose-600 hover:bg-rose-700 h-7 px-2 text-xs" onClick={() => onOpenTransaction({ ...c, _txType: 'debit' })}><MinusCircle size={12} /> Trừ</Button>}{onToggleAccount && <Button size="sm" variant={isLocked(c) ? 'outline' : 'destructive'} className="h-7 px-2 text-xs" onClick={() => onToggleAccount(c)}>{isLocked(c) ? 'Mở' : 'Khóa'}</Button>}{onToggleWithdrawViolation && <Button size="sm" variant={isWithdrawViolation(c) ? 'destructive' : 'outline'} className="h-7 px-2 text-xs" onClick={() => onToggleWithdrawViolation(c)}>{isWithdrawViolation(c) ? 'Bỏ rút tiền vi phạm' : 'Rút tiền vi phạm'}</Button>}</div></TableCell>
  </TableRow>;
}

function SocialLinks({ user }: any) {
  const phone = user?.phone;
  const telegram = user?.telegramLink;
  return <div className="flex items-center gap-1.5">
    {phone && <a title="G?i ?i?n" className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100" href={`tel:${phone}`}><Phone size={15} /></a>}
    {phone && <a title="Zalo" className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100" href={`https://zalo.me/${String(phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle size={15} /></a>}
    {telegram && <a title="Telegram" className="grid h-8 w-8 place-items-center rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100" href={telegram} target="_blank" rel="noreferrer"><Send size={15} /></a>}
    {user?.email && <a title="Email" className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200" href={`mailto:${user.email}`}><Facebook size={15} /></a>}
  </div>;
}

function BankMini({ profile }: any) {
  const b = profile?.bankAccounts?.find((x: any) => x.isPrimary) || profile?.bankAccounts?.[0];
  if (!b) return <span className="text-sm text-slate-400">-</span>;
  return <div className="text-sm"><div className="font-bold">{b.bankName}</div><div className="font-mono text-xs text-slate-500">{b.accountNumber}</div></div>;
}

function TransactionPopup({ customer, onClose, onSaved }: { customer: any; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const type: 'credit' | 'debit' = customer._txType === 'debit' ? 'debit' : 'credit';
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/transactions?customerId=${encodeURIComponent(customer.id)}`);
        const json = await res.json();
        if (alive && json.ok) setHistory(json.data || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [customer.id]);

  async function submit() {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return showToast('Số tiền phải > 0');
    if (!reason.trim()) return showToast('Vui lòng nhập lý do');
    setBusy(true);
    const res = await fetch('/api/admin/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: customer.id, type, amount: amt, reason: reason.trim() }),
    });
    setBusy(false);
    if (!res.ok) return showToast((await res.json()).error || 'Không tạo được giao dịch');
    showToast(type === 'credit' ? 'Đã cộng tiền' : 'Đã trừ tiền');
    onSaved();
  }

  const totalCredit = history.filter((t) => t.type === 'credit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalDebit = history.filter((t) => t.type === 'debit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const balance = totalCredit - totalDebit;
  const isCredit = type === 'credit';
  const color = isCredit ? 'emerald' : 'rose';
  const ColorIcon = isCredit ? PlusCircle : MinusCircle;

  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className={`flex items-center justify-between border-b border-slate-100 bg-${color}-50 px-6 py-4`}>
          <div>
            <div className={`flex items-center gap-2 text-xl font-black text-${color}-700`}>
              <ColorIcon className={`h-6 w-6 text-${color}-600`} />
              {isCredit ? 'Cộng tiền cho khách' : 'Trừ tiền khách'}
            </div>
            <div className="text-xs text-slate-500">{customer.name || customer.profile?.fullName || customer.phone} · ID: <span className="font-mono">{customer.id.slice(0, 8)}</span></div>
          </div>
          <Button variant="outline" onClick={onClose} disabled={busy}>Đóng</Button>
        </div>

        <div className="grid gap-3 p-6 sm:grid-cols-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-center">
            <div className="text-xs font-bold uppercase text-emerald-700">Tổng cộng</div>
            <div className="mt-1 text-base font-black text-emerald-700">{money(totalCredit)}</div>
          </div>
          <div className="rounded-2xl bg-rose-50 p-3 text-center">
            <div className="text-xs font-bold uppercase text-rose-700">Tổng trừ</div>
            <div className="mt-1 text-base font-black text-rose-700">{money(totalDebit)}</div>
          </div>
          <div className="rounded-2xl bg-slate-900 p-3 text-center text-white">
            <div className="text-xs font-bold uppercase text-slate-300">Số dư</div>
            <div className="mt-1 text-base font-black">{money(balance)}</div>
          </div>
        </div>

        <div className="space-y-3 px-6 pb-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Số tiền (KRW)</span>
            <input
              autoFocus
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Nhập số tiền..."
              className={`h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-${color}-500 focus:outline-none focus:ring-4 focus:ring-${color}-500/15`}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Lý do</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder={isCredit ? 'VD: Hoàn tiền hồ sơ #abc12345' : 'VD: Trừ phí phạt trả chậm'}
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={busy}>Huỷ</Button>
            <Button onClick={submit} disabled={busy} className={isCredit ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}>
              {busy ? 'Đang lưu...' : isCredit ? 'Xác nhận cộng' : 'Xác nhận trừ'}
            </Button>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          <div className="mb-2 text-sm font-black text-slate-700">Lịch sử giao dịch</div>
          {loading ? (
            <div className="py-4 text-center text-sm text-slate-500">Đang tải...</div>
          ) : !history.length ? (
            <div className="py-4 text-center text-sm text-slate-500">Chưa có giao dịch</div>
          ) : (
            <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white">
              {history.map((t) => {
                const credit = t.type === 'credit';
                return (
                  <div key={t.id} className="flex items-start gap-3 border-b border-slate-100 p-3 last:border-b-0">
                    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${credit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {credit ? <PlusCircle size={16} /> : <MinusCircle size={16} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-black ${credit ? 'text-emerald-700' : 'text-rose-700'}`}>{credit ? '+' : '-'}{money(t.amount)}</span>
                        <span className="text-xs text-slate-400">{dateTime(t.createdAt)}</span>
                      </div>
                      <div className="mt-0.5 break-words text-xs text-slate-600">{t.reason}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">bởi {t.createdBy?.name || t.createdBy?.phone || 'admin'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionHistoryDialog({ customer, onClose }: { customer: any; onClose: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/transactions?customerId=${encodeURIComponent(customer.id)}`);
        const json = await res.json();
        if (alive && json.ok) setItems(json.data || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [customer.id]);

  const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalCredit = sorted.filter((t) => t.type === 'credit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalDebit = sorted.filter((t) => t.type === 'debit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const balance = totalCredit - totalDebit;

  let running = 0;
  const txsAsc = [...sorted].reverse();
  for (const t of txsAsc) {
    if (t.type === 'credit') running += Number(t.amount || 0); else running -= Number(t.amount || 0);
    t._running = running;
  }
  const txsWithBalance = [...txsAsc].reverse();

  return <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
    <div className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
        <div>
          <div className="flex items-center gap-2 text-xl font-black text-slate-800"><History className="h-5 w-5 text-blue-600" />Lịch sử biến động số dư</div>
          <div className="text-xs text-slate-500">{customer.name || customer.profile?.fullName || customer.phone} · ID: <span className="font-mono">{String(customer.id).slice(0, 8)}</span></div>
        </div>
        <Button variant="outline" onClick={onClose}>Đóng</Button>
      </div>

      <div className="grid gap-3 p-6 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-3 text-center">
          <div className="text-xs font-bold uppercase text-emerald-700">Tổng cộng</div>
          <div className="mt-1 text-base font-black text-emerald-700">{money(totalCredit)}</div>
        </div>
        <div className="rounded-2xl bg-rose-50 p-3 text-center">
          <div className="text-xs font-bold uppercase text-rose-700">Tổng trừ</div>
          <div className="mt-1 text-base font-black text-rose-700">{money(totalDebit)}</div>
        </div>
        <div className="rounded-2xl bg-slate-900 p-3 text-center text-white">
          <div className="text-xs font-bold uppercase text-slate-300">Số dư hiện tại</div>
          <div className={`mt-1 text-base font-black ${balance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{balance >= 0 ? '+' : '-'}{money(Math.abs(balance))}</div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-black text-slate-700">Timeline ({sorted.length} giao dịch)</div>
          <div className="text-xs text-slate-500">Cột mốc: thời gian · số tiền · số dư sau</div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">Đang tải...</div>
        ) : !sorted.length ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">Chưa có giao dịch nào</div>
        ) : (
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-200" />
            <ol className="space-y-3">
              {txsWithBalance.map((t, idx) => {
                const credit = t.type === 'credit';
                const ColorIcon = credit ? PlusCircle : MinusCircle;
                const runningBal = t._running as number;
                return <li key={t.id} className="relative flex gap-4 pl-0">
                  <div className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-4 border-white ${credit ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'} shadow`}>
                    <ColorIcon size={18} />
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-300">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`text-base font-black ${credit ? 'text-emerald-700' : 'text-rose-700'}`}>{credit ? '+ ' : '− '}{money(t.amount)}</span>
                      <span className="text-xs text-slate-400">{dateTime(t.createdAt)}</span>
                    </div>
                    <div className="mt-1.5 text-sm text-slate-700">{t.reason || <span className="italic text-slate-400">Không có lý do</span>}</div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs">
                      <span className="text-slate-500">bởi <b className="text-slate-700">{t.createdBy?.name || t.createdBy?.phone || 'admin'}</b>{t.createdBy?.phone && t.createdBy?.name ? ` (${t.createdBy.phone})` : ''}</span>
                      <span className={`font-bold ${runningBal >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Số dư sau GD: {runningBal >= 0 ? '+' : '-'}{money(Math.abs(runningBal))}</span>
                    </div>
                    {idx === 0 && <span className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">Mới nhất</span>}
                  </div>
                </li>;
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  </div>
}

function EditCustomerPopup({ customer, onClose, onSaved }: { customer: any; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const p = customer.profile || {};
  const primaryBank = (p.bankAccounts || []).find((b: any) => b.isPrimary) || (p.bankAccounts || [])[0] || {};
  const latestKyc = (p.kycs || [])[0] || {};
  const [form, setForm] = useState({
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    telegramLink: customer.telegramLink || '',
    password: '',
    locked: isLocked(customer),
    fullName: p.fullName || '',
    citizenId: p.citizenId || '',
    dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : '',
    gender: p.gender || '',
    address: p.address || '',
    jobTitle: p.jobTitle || '',
    employerName: p.employerName || '',
    monthlyIncome: p.monthlyIncome ?? '',
    emergencyName: p.emergencyName || '',
    emergencyPhone: p.emergencyPhone || '',
    emergencyRelation: p.emergencyRelation || '',
    bankName: primaryBank.bankName || '',
    accountNumber: primaryBank.accountNumber || '',
    accountName: primaryBank.accountName || '',
    kycStatus: latestKyc.status || 'pending',
    kycRejectionReason: latestKyc.rejectionReason || '',
  });
  const [images, setImages] = useState<{ front?: string; back?: string; face?: string }>({
    front: latestKyc.frontIdUrl || '',
    back: latestKyc.backIdUrl || '',
    face: latestKyc.selfieUrl || '',
  });
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'info' | 'work' | 'bank' | 'kyc'>('info');

  const set = (key: string, val: any) => setForm((s) => ({ ...s, [key]: val }));

  async function fileToDataUrl(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1200;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Không xử lý được ảnh');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.72);
  }

  async function pickImage(key: 'front' | 'back' | 'face', file: File | null) {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setImages((s) => ({ ...s, [key]: dataUrl }));
    } catch (e) {
      showToast('Không đọc được ảnh');
    }
  }

  async function save() {
    setBusy(true);
    const payload: any = {
      customerId: customer.id,
      ...form,
      monthlyIncome: form.monthlyIncome === '' ? null : Number(form.monthlyIncome),
      frontIdUrl: images.front || null,
      backIdUrl: images.back || null,
      selfieUrl: images.face || null,
    };
    // If no new images uploaded, keep existing by sending current values
    if (!images.front) payload.frontIdUrl = latestKyc.frontIdUrl || null;
    if (!images.back) payload.backIdUrl = latestKyc.backIdUrl || null;
    if (!images.face) payload.selfieUrl = latestKyc.selfieUrl || null;
    if (!payload.password) delete payload.password;
    const res = await fetch('/api/admin/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) return showToast((await res.json()).error || 'Không lưu được');
    showToast('Đã lưu thay đổi');
    onSaved();
  }

  return (    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <div className="text-xl font-black">Sửa khách hàng</div>
            <div className="text-xs text-slate-500">ID: <span className="font-mono">{customer.id}</span> · Tạo {date(customer.createdAt)}</div>
          </div>
          <div className="flex gap-2"><Button variant="outline" onClick={onClose} disabled={busy}>Đóng</Button><Button onClick={save} disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu thay đổi'}</Button></div>
        </div>
        <div className="px-6 pt-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-100">
            {([
              ['info', 'Thông tin cá nhân'],
              ['work', 'Công việc'],
              ['bank', 'Ngân hàng'],
              ['kyc', 'Ảnh KYC'],
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={`rounded-t-xl px-4 py-2 text-sm font-bold transition ${tab === id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="space-y-4 p-6">
          {tab === 'info' && (
            <div className="grid gap-3 md:grid-cols-2">
              <InputField form={form} setForm={setForm} label="Tên hiển thị" name="name" placeholder="Tên" />
              <InputField form={form} setForm={setForm} label="Số điện thoại" name="phone" placeholder="SĐT" />
              <InputField form={form} setForm={setForm} label="Email" name="email" placeholder="Email" />
              <InputField form={form} setForm={setForm} label="Telegram" name="telegramLink" placeholder="https://t.me/..." />
              <InputField form={form} setForm={setForm} label="Mật khẩu mới (bỏ trống nếu giữ)" name="password" type="password" placeholder="••••••" />
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 p-3 text-sm font-bold">
                <input type="checkbox" checked={form.locked} onChange={(e) => set('locked', e.target.checked)} />
                Khoá tài khoản
              </label>
              <hr className="md:col-span-2 border-slate-100" />
              <InputField form={form} setForm={setForm} label="Họ tên đầy đủ" name="fullName" placeholder="Nguyễn Văn A" />
              <InputField form={form} setForm={setForm} label="CCCD/Hộ chiếu" name="citizenId" placeholder="0123456789" />
              <InputField form={form} setForm={setForm} label="Ngày sinh" name="dateOfBirth" type="date" />
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-600">Giới tính</span>
                <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm">
                  <option value="">--</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </label>
              <InputField form={form} setForm={setForm} label="Địa chỉ" name="address" placeholder="Địa chỉ thường trú" />
              <hr className="md:col-span-2 border-slate-100" />
              <InputField form={form} setForm={setForm} label="Tên người thân" name="emergencyName" placeholder="Họ tên" />
              <InputField form={form} setForm={setForm} label="SĐT người thân" name="emergencyPhone" placeholder="SĐT" />
              <InputField form={form} setForm={setForm} label="Quan hệ" name="emergencyRelation" placeholder="Cha/Mẹ/Vợ/Chồng..." />
            </div>
          )}
          {tab === 'work' && (
            <div className="grid gap-3 md:grid-cols-2">
              <InputField form={form} setForm={setForm} label="Nghề nghiệp" name="jobTitle" placeholder="Nghề nghiệp" />
              <InputField form={form} setForm={setForm} label="Nơi làm việc" name="employerName" placeholder="Công ty" />
              <InputField form={form} setForm={setForm} label="Thu nhập tháng (KRW)" name="monthlyIncome" type="number" placeholder="0" />
            </div>
          )}
          {tab === 'bank' && (
            <div className="grid gap-3 md:grid-cols-2">
              <InputField form={form} setForm={setForm} label="Ngân hàng" name="bankName" placeholder="Vietcombank, KB..." />
              <InputField form={form} setForm={setForm} label="Số tài khoản" name="accountNumber" placeholder="0123456789" />
              <InputField form={form} setForm={setForm} label="Tên chủ TK" name="accountName" placeholder="NGUYEN VAN A" />
            </div>
          )}
          {tab === 'kyc' && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-600">Trạng thái KYC</span>
                  <select value={form.kycStatus} onChange={(e) => set('kycStatus', e.target.value)} className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm">
                    <option value="pending">Chờ upload</option>
                    <option value="submitted">Đã gửi</option>
                    <option value="verified">Đã duyệt</option>
                    <option value="rejected">Từ chối</option>
                  </select>
                </label>
                <div className="md:col-span-2">
                  <InputField form={form} setForm={setForm} label="Lý do từ chối (nếu có)" name="kycRejectionReason" placeholder="Lý do" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {([
                  ['front', 'CCCD mặt trước'],
                  ['back', 'CCCD mặt sau'],
                  ['face', 'Selfie'],
                ] as const).map(([key, label]) => (
                  <div key={key} className="rounded-2xl border border-slate-200 p-3">
                    <div className="mb-2 text-sm font-bold text-slate-600">{label}</div>
                    {images[key] ? (
                      <img src={images[key]} alt={label} className="h-32 w-full rounded-xl object-cover" />
                    ) : (
                      <div className="grid h-32 place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">Chưa có ảnh</div>
                    )}
                    <label className="mt-2 inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700">
                      Tải ảnh mới
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(key, e.target.files?.[0] || null)} />
                    </label>
                    {images[key] && (
                      <button type="button" onClick={() => setImages((s) => ({ ...s, [key]: '' }))} className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
                        Xoá ảnh
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">Bỏ trống nếu giữ ảnh cũ. Chọn ảnh mới = thay thế ảnh hiện tại.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContractPopup({ data, isAdmin, onClose, onSaved }: any) {
  const { showToast } = useToast();
  const c = data.customer;
  const p = c.profile || {};
  const l = data.loan;
  const contract = data.contract;
  const kyc = p?.kycs?.[0];
  const bank = p?.bankAccounts?.find((b: any) => b.isPrimary) || p?.bankAccounts?.[0];

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: c.name || '',
    phone: c.phone || '',
    email: c.email || '',
    telegramLink: c.telegramLink || '',
    fullName: p.fullName || '',
    citizenId: p.citizenId || '',
    dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : '',
    gender: p.gender || '',
    address: p.address || '',
    emergencyName: p.emergencyName || '',
    emergencyPhone: p.emergencyPhone || '',
    emergencyRelation: p.emergencyRelation || '',
    jobTitle: p.jobTitle || '',
    employerName: p.employerName || '',
    monthlyIncome: p.monthlyIncome ?? '',
    bankName: bank?.bankName || '',
    accountNumber: bank?.accountNumber || '',
    accountName: bank?.accountName || '',
  });
  const set = (key: string, val: any) => setForm((s) => ({ ...s, [key]: val }));

  async function save() {
    setBusy(true);
    const payload: any = {
      customerId: c.id,
      ...form,
      monthlyIncome: form.monthlyIncome === '' ? null : Number(form.monthlyIncome),
    };
    const res = await fetch('/api/admin/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) return showToast((await res.json()).error || 'Không lưu được');
    showToast('Đã lưu thay đổi');
    setMode('view');
    onSaved?.();
  }

  const viewBox = (title: string, icon: any, rows: any[]) => (
    <InfoBox icon={icon} title={title} rows={rows} />
  );

  const editableFields: any = mode === 'edit';

  return <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
    <div className="my-auto max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-6 py-4">
        <div>
          <div className="text-xl font-black">{editableFields ? 'Sửa thông tin khách hàng' : 'Chi tiết hồ sơ khách hàng'}</div>
          <div className="text-sm text-slate-500">Mã hồ sơ vay #{String(l.id).slice(0, 8)}</div>
        </div>
        <div className="flex gap-2">
          {!editableFields && isAdmin && <Button variant="outline" onClick={() => setMode('edit')}>Sửa thông tin</Button>}
          {editableFields && <><Button variant="outline" disabled={busy} onClick={() => setMode('view')}>Huỷ</Button><Button disabled={busy} onClick={save}>{busy ? 'Đang lưu...' : 'Lưu thay đổi'}</Button></>}
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-3">
            {editableFields ? (
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="mb-2 flex items-center gap-2 font-black"><UserRound size={17} className="text-blue-600" />Thông tin khách hàng</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <InputField form={form} setForm={setForm} label="Tên hiển thị" name="name" />
                  <InputField form={form} setForm={setForm} label="SĐT" name="phone" />
                  <InputField form={form} setForm={setForm} label="Email" name="email" type="email" />
                  <InputField form={form} setForm={setForm} label="Telegram" name="telegramLink" />
                  <InputField form={form} setForm={setForm} label="Họ tên đầy đủ" name="fullName" />
                  <InputField form={form} setForm={setForm} label="CCCD/Hộ chiếu" name="citizenId" />
                  <InputField form={form} setForm={setForm} label="Ngày sinh" name="dateOfBirth" type="date" />
                  <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Giới tính</span>
                    <select defaultValue={form.gender || ''} onChange={(e) => set('gender', e.target.value)} className="h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm transition-all duration-150 hover:border-slate-300 hover:shadow focus:border-blue-500 focus:bg-blue-50/30 focus:outline-none focus:ring-4 focus:ring-blue-500/15">
                      <option value="">--</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option>
                    </select>
                  </label>
                  <div className="md:col-span-2"><InputField form={form} setForm={setForm} label="Địa chỉ" name="address" /></div>
                  <InputField form={form} setForm={setForm} label="Tên người thân" name="emergencyName" />
                  <InputField form={form} setForm={setForm} label="SĐT người thân" name="emergencyPhone" />
                  <InputField form={form} setForm={setForm} label="Quan hệ" name="emergencyRelation" />
                </div>
              </div>
            ) : viewBox("Thông tin khách hàng", UserRound, [
              ["Họ tên", c.name || p?.fullName || '-'],
              ["SĐT", c.phone || '-'],
              ["Email", c.email || '-'],
              ["CCCD", p?.citizenId || '-'],
              ["Ngày sinh", date(p?.dateOfBirth)],
              ["Giới tính", p?.gender || '-'],
              ["Địa chỉ thường trú", p?.address || '-'],
              ["Tên người thân", p?.emergencyName || '-'],
              ["Số điện thoại người thân", p?.emergencyPhone || '-'],
              ["Quan hệ", p?.emergencyRelation || '-'],
            ])}
            <InfoBox icon={CreditCard} title="Thông tin khoản vay" rows={[["Số tiền vay", money(l.amount)], ["Kỳ hạn", `${l.termMonths || 0} tháng`], ["Lãi suất", `${l.interestRate || 0}%`], ["Trạng thái hồ sơ", loanLabel(l.status)], ["Ngày tạo", date(l.createdAt)], ["Ghi chú", l.notes || '-']]} />
            <SignatureBox customerName={c.name || p?.fullName || '-'} signatureImage={contract?.signatureImage} signedAt={contract?.signedAt} loanId={l.id} />
          </div>
          <div className="space-y-3">
            {editableFields ? (
              <>
                <div className="rounded-2xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center gap-2 font-black"><Activity size={17} className="text-blue-600" />Công việc & thu nhập</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <InputField form={form} setForm={setForm} label="Nghề nghiệp" name="jobTitle" />
                    <InputField form={form} setForm={setForm} label="Nơi làm việc" name="employerName" />
                    <InputField form={form} setForm={setForm} label="Thu nhập tháng (KRW)" name="monthlyIncome" type="number" />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center gap-2 font-black"><ShieldCheck size={17} className="text-blue-600" />Tài khoản nhận giải ngân</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <InputField form={form} setForm={setForm} label="Ngân hàng" name="bankName" />
                    <InputField form={form} setForm={setForm} label="Số tài khoản" name="accountNumber" />
                    <div className="md:col-span-2"><InputField form={form} setForm={setForm} label="Tên chủ tài khoản" name="accountName" /></div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <InfoBox icon={Activity} title="Công việc & thu nhập" rows={[["Nghề nghiệp", p?.jobTitle || '-'], ["Nơi làm việc", p?.employerName || '-'], ["Thu nhập tháng", money(p?.monthlyIncome || 0)]]} />
                <InfoBox icon={ClipboardList} title="Thông tin hợp đồng" rows={[["Mã hợp đồng", contract?.id ? `#${String(contract.id).slice(0, 8)}` : 'Chưa phát hành'], ["Trạng thái", contractLabel(contract?.status)], ["Ngày ký", date(contract?.signedAt)], ["IP ký", contract?.signatureIp || '-'], ["File", contract?.fileUrl || '-']]} />
                <InfoBox icon={ShieldCheck} title="Tài khoản nhận giải ngân" rows={[["Ngân hàng", bank?.bankName || '-'], ["Số tài khoản", bank?.accountNumber || '-'], ["Tên chủ tài khoản", bank?.accountName || '-']]} />
              </>
            )}
          </div>
        </div>
        <KycImages kyc={kyc} />
      </div>
    </div>
  </div>;
}


function Pagination({ page, totalPages, total, pageSize, onPage }: any) {
  if (total <= pageSize) return null;
  return <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
    <div>Hiển thị {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} / {total}</div>
    <div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Trước</Button><span className="rounded-xl bg-slate-100 px-3 py-2 font-bold text-slate-700">{page}/{totalPages}</span><Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Sau</Button></div>
  </div>;
}
function paginate(items: any[], page: number, pageSize: number) { const totalPages = Math.max(1, Math.ceil(items.length / pageSize)); const safePage = Math.min(Math.max(1, page || 1), totalPages); return { page: safePage, totalPages, items: items.slice((safePage - 1) * pageSize, safePage * pageSize) }; }
function SignatureBox({ customerName, signatureImage, signedAt, loanId }: any) { return <div className="self-start rounded-2xl border border-slate-200 p-3"><div className="mb-2 flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-black"><CheckCircle2 size={17} className="text-blue-600" />Chữ ký người vay</div>{loanId && <a className="shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white" href={`/contract/${loanId}`} target="_blank" rel="noreferrer">Xem PDF</a>}</div><div className="rounded-2xl border border-dashed border-slate-200 p-3">{signatureImage ? <img src={signatureImage} alt={`Chữ ký ${customerName}`} className="h-16 w-full object-contain" /> : <div className="py-4 font-serif text-lg italic text-slate-400">Chưa có chữ ký</div>}<div className="mt-2 text-xs text-slate-400">Ký điện tử: {date(signedAt)}</div></div></div>; }

function KycImages({ kyc }: any) {
  const [preview, setPreview] = useState<any>(null);
  const images = [
    ['Ảnh CCCD mặt trước', kyc?.frontIdUrl, 'cccd-mat-truoc.jpg'],
    ['Ảnh CCCD mặt sau', kyc?.backIdUrl, 'cccd-mat-sau.jpg'],
    ['Ảnh chân dung/selfie', kyc?.selfieUrl, 'anh-selfie.jpg'],
  ];
  return <div className="rounded-2xl border border-slate-200 p-4 md:col-span-2">
    <div className="mb-3 flex items-center gap-2 font-black"><ShieldCheck size={17} className="text-blue-600" />Ảnh xác minh KYC</div>
    <div className="grid gap-3 md:grid-cols-3">{images.map(([label, url, filename]: any[]) => <div key={label} className="rounded-2xl bg-slate-50 p-3">
      <div className="mb-2 text-sm font-bold text-slate-600">{label}</div>
      {url ? <>
        <button type="button" onClick={() => setPreview({ label, url, filename })} className="block w-full overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"><img src={url} alt={label} className="h-40 w-full object-cover transition hover:scale-105" /></button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setPreview({ label, url, filename })} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 hover:bg-slate-100"><ExternalLink size={14} />Xem to</button>
          <a href={url} download={filename} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-blue-600 px-2 text-xs font-bold text-white hover:bg-blue-700"><Download size={14} />Tải về</a>
        </div>
      </> : <div className="grid h-40 place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">Chưa có ảnh</div>}
    </div>)}</div>
    {preview && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4" onClick={() => setPreview(null)}><div className="max-h-[92vh] w-full max-w-5xl rounded-2xl bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="mb-3 flex items-center justify-between gap-3"><div className="font-black">{preview.label}</div><Button variant="outline" onClick={() => setPreview(null)}>Đóng</Button></div><img src={preview.url} alt={preview.label} className="max-h-[78vh] w-full rounded-2xl object-contain" /></div></div>}
  </div>;
}

function InfoBox({ icon: Icon, title, rows }: any) { return <div className="self-start rounded-2xl border border-slate-200 p-3"><div className="mb-2 flex items-center gap-2 font-black">{Icon && <Icon size={17} className="text-blue-600" />}{title}</div><div className="space-y-1.5">{rows.map(([label, value]: any[]) => <div key={label} className="grid grid-cols-[132px_1fr] gap-2 text-sm"><div className="font-bold text-slate-400">{label}</div><div className="font-semibold text-slate-700">{value}</div></div>)}</div></div>; }
function DataCard({ title, subtitle, children }: any) { return <Card className="rounded-2xl border-slate-200 bg-white shadow-sm"><CardContent className="p-0"><div className="border-b border-slate-100 p-4"><div className="text-lg font-black">{title}</div><div className="text-sm text-slate-500">{subtitle}</div></div><div className="p-4 lg:p-4">{children}</div></CardContent></Card>; }
function Metric({ icon: Icon, label, value, tone }: any) { const color = tone === 'green' ? 'bg-emerald-50 text-emerald-700' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : tone === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'; return <Card className="rounded-2xl border-slate-200"><CardContent className="flex items-center gap-4 p-5"><div className={`grid h-12 w-12 place-items-center rounded-2xl ${color}`}><Icon size={22} /></div><div><div className="text-2xl font-black">{value}</div><div className="text-sm text-slate-500">{label}</div></div></CardContent></Card>; }
function Person({ name, sub }: any) { return <div className="flex min-w-0 items-center gap-2"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100"><UserRound size={15} /></div><div className="min-w-0"><div className="truncate text-sm font-bold">{name}</div><div className="truncate text-xs text-slate-500">{sub}</div></div></div>; }
function Tile({ label, value }: any) { return <div className="rounded-2xl bg-slate-50 p-3"><div className="text-xs font-bold uppercase text-slate-400">{label}</div><div className="mt-1 truncate font-bold">{value}</div></div>; }
function Health({ label, value }: any) { return <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><span className="text-sm text-slate-500">{label}</span><b>{value}</b></div>; }
function Empty({ text }: any) { return <div className="p-8 text-center text-sm text-slate-500">{text}</div>; }
function AccountStatus({ account }: any) {
  const locked = isLocked(account);
  const wv = isWithdrawViolation(account);
  if (locked && wv) {
    return <div className="flex flex-col items-end gap-1"><Badge className="border-red-200 bg-red-600 text-white shadow-sm">Khóa tài khoản</Badge><Badge className="border-orange-200 bg-orange-500 text-white shadow-sm">Rút tiền vi phạm</Badge></div>;
  }
  if (locked) return <Badge className="border-red-200 bg-red-600 text-white shadow-sm">Khóa tài khoản</Badge>;
  if (wv) return <Badge className="border-orange-200 bg-orange-500 text-white shadow-sm">Rút tiền vi phạm</Badge>;
  return <Badge variant="success">Hoạt động</Badge>;
}
function LoanStatusBadge({ loan }: any) {
  const status = loan?.status;
  const loanBadge = <Status status={status} />;
  const locked = isLocked(loan?.user);
  const wv = Boolean(loan?.user?.profile?.withdrawViolation);
  if (!locked && !wv) return <div className="flex justify-end">{loanBadge}</div>;
  return (
    <div className="flex flex-col items-end gap-1">
      {loanBadge}
      {locked && <Badge className="border-red-200 bg-red-600 text-white shadow-sm">Khóa tài khoản</Badge>}
      {wv && <Badge className="border-orange-200 bg-orange-500 text-white shadow-sm">Rút tiền vi phạm</Badge>}
    </div>
  );
}
function isLocked(account: any) { return account?.lockedUntil ? new Date(account.lockedUntil).getTime() > Date.now() : false; }
function isWithdrawViolation(account: any) { return Boolean(account?.profile?.withdrawViolation); }
function accountLabel(account: any) { return isLocked(account) ? 'đã khóa locked' : 'hoạt động active'; }
function Status({ status }: any) { const ok = ['approved', 'disbursed', 'closed'].includes(status); const bad = status === 'rejected'; return <Badge variant={ok ? 'success' : bad ? 'destructive' : 'warning'}>{({ draft: 'Chờ duyệt', submitted: 'Chờ duyệt', reviewing: 'Đang duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', disbursed: 'Giải ngân', closed: 'Đóng', defaulted: 'Quá hạn' } as any)[status] || status}</Badge>; }
function has(q: string, values: any[]) { if (!q) return true; return values.some((v) => String(v || '').toLowerCase().includes(q)); }
function inDateRange(value: any, from: string, to: string) { if (!from && !to) return true; const time = value ? new Date(value).getTime() : 0; if (!time) return false; if (from && time < new Date(from + 'T00:00:00').getTime()) return false; if (to && time > new Date(to + 'T23:59:59').getTime()) return false; return true; }
function money(v: number) { return new Intl.NumberFormat('ko-KR').format(Number(v || 0)) + ' KRW'; }
function date(v: any) { return v ? new Date(v).toLocaleDateString('ko-KR') : '-'; }
function dateTime(v: any) { return v ? new Date(v).toLocaleString('ko-KR') : '-'; }
function actionLabel(action: any) { return ({ 'loan.update': 'Cập nhật hồ sơ vay', 'auth.login': 'Đăng nhập', 'auth.logout': 'Đăng xuất' } as any)[action] || action || 'Hoạt động'; }
function formatMeta(meta: any) { if (!meta) return ''; try { return typeof meta === 'string' ? meta : JSON.stringify(meta, null, 2); } catch { return String(meta); } }
function loanLabel(status: any) { return ({ draft: 'Chờ duyệt', submitted: 'Chờ duyệt', reviewing: 'Đang duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', disbursed: 'Giải ngân', closed: 'Đóng', defaulted: 'Quá hạn' } as any)[status] || status || '-'; }
function contractLabel(status: any) { return ({ draft: 'Chờ duyệt', issued: 'Đã phát hành', signed: 'Đã ký', cancelled: 'Đã huỷ' } as any)[status] || status || 'Chưa có'; }
function title(tab: Tab) { return ({ overview: 'Tổng quan vận hành', customers: 'Quản lý khách hàng', loans: 'Quản lý hồ sơ vay', agents: 'Quản lý CS team' } as Record<Tab, string>)[tab]; }

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const token = req.cookies?.token;
  const payload = token ? await verifyToken(token) : null;
  if (!payload?.id || !['admin', 'agent'].includes(String(payload.role))) return { redirect: { destination: '/login', permanent: false } };
  const user = await prisma.user.findUnique({ where: { id: payload.id as string }, select: { id: true, name: true, phone: true, email: true, role: true } });
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  const isAdmin = user.role === 'admin';
  const loanWhere = isAdmin ? {} : { assignedAgentId: user.id };
  const customerWhere = isAdmin ? { role: 'user' as const } : { role: 'user' as const, loans: { some: { assignedAgentId: user.id } } };
  const [agents, customers, loans, logs] = await Promise.all([
    prisma.user.findMany({ where: { role: 'agent' }, select: { id: true, name: true, phone: true, email: true, telegramLink: true, lockedUntil: true, lastLoginAt: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
    prisma.user.findMany({ where: customerWhere, select: { id: true, name: true, phone: true, email: true, telegramLink: true, lockedUntil: true, lastLoginAt: true, createdAt: true, profile: { include: { kycs: { orderBy: { createdAt: 'desc' } }, bankAccounts: { orderBy: { createdAt: 'desc' } } } }, loans: { where: loanWhere, include: { contracts: true }, orderBy: { createdAt: 'desc' } }, transactions: { select: { type: true, amount: true } } }, orderBy: { createdAt: 'desc' }, take: 300 }),
    prisma.loan.findMany({
      where: loanWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            lockedUntil: true,
            profile: { select: { withdrawViolation: true, fullName: true, citizenId: true, monthlyIncome: true, jobTitle: true, kycs: { orderBy: { createdAt: 'desc' } }, bankAccounts: { orderBy: { createdAt: 'desc' } } } },
          },
        },
        assignedAgent: { select: { id: true, name: true, phone: true } },
        contracts: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
    prisma.activityLog.findMany({ include: { user: { select: { id: true, name: true, phone: true, email: true, role: true } } }, orderBy: { createdAt: 'desc' }, take: 500 }),
  ]);
  return { props: { user: JSON.parse(JSON.stringify(user)), agents: JSON.parse(JSON.stringify(agents)), customers: JSON.parse(JSON.stringify(customers)), loans: JSON.parse(JSON.stringify(loans)), logs: JSON.parse(JSON.stringify(logs)) } };
};

function InputField({ label, name, form, setForm, ...rest }: any) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">{label}</span>
      <input
        autoComplete="off"
        data-lpignore="true"
        data-1p-ignore="true"
        data-form-type="other"
        spellCheck={false}
        name={name}
        defaultValue={form?.[name] ?? ''}
        onInput={(e: any) => setForm((s: any) => ({ ...s, [name]: e.target.value }))}
        placeholder={`Nhập ${label.toLowerCase()}...`}
        className="h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 placeholder:font-normal placeholder:text-slate-400 shadow-sm transition-all duration-150 hover:border-slate-300 hover:shadow focus:border-blue-500 focus:bg-blue-50/30 focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
        {...rest}
      />
    </label>
  );
}

