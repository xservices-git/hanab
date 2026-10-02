import type { GetServerSideProps } from 'next';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { FileText, Users } from 'lucide-react';

type AgentProps = { user: any; customers: any[]; loans: any[] };

export default function AgentPage({ user, customers, loans }: AgentProps) {
  return (
    <Layout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Trang nhân viên</h1>
          <p className="text-sm text-gray-500">Quản lý khách hàng và hồ sơ vay được phân công.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Stat icon={<Users />} label="Khách được giao" value={customers.length} />
          <Stat icon={<FileText />} label="Hồ sơ vay" value={loans.length} />
          <Stat icon={<FileText />} label="Chờ xử lý" value={loans.filter((l) => ['submitted', 'reviewing'].includes(l.status)).length} />
        </div>
        <Card>
          <CardHeader><CardTitle>Hồ sơ vay được phân công</CardTitle></CardHeader>
          <CardContent><div className="space-y-3">{loans.map((l) => <LoanRow key={l.id} loan={l} />)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Khách hàng</CardTitle></CardHeader>
          <CardContent><div className="space-y-3">{customers.map((c) => <CustomerRow key={c.id} c={c} />)}</div></CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function Stat({ icon, label, value }: any) { return <Card><CardContent className="flex items-center gap-3 pt-6"><div className="rounded-2xl bg-blue-50 p-3 text-blue-700">{icon}</div><div><div className="text-2xl font-bold">{value}</div><div className="text-sm text-gray-500">{label}</div></div></CardContent></Card>; }
function LoanRow({ loan }: any) { return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"><div><div className="font-semibold">{loan.user?.name || loan.user?.phone}</div><div className="text-sm text-gray-500">{money(loan.amount)} · {loan.termMonths} tháng</div></div><div className="flex items-center gap-2"><Badge>{loan.status}</Badge><Dialog><DialogTrigger asChild><Button variant="outline">Xem hồ sơ</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Chi tiết hồ sơ vay</DialogTitle><DialogDescription>Thông tin khách, KYC, ngân hàng, hợp đồng.</DialogDescription></DialogHeader><pre className="max-h-96 overflow-auto rounded-xl bg-gray-950 p-4 text-xs text-white">{JSON.stringify(loan, null, 2)}</pre></DialogContent></Dialog></div></div>; }
function CustomerRow({ c }: any) { const p = c.profile; return <div className="rounded-2xl border p-4"><div className="font-semibold">{c.name || p?.fullName || c.phone}</div><div className="mt-1 text-sm text-gray-500">{c.phone} · CCCD: {p?.citizenId || '-'} · Thu nhập: {money(p?.monthlyIncome || 0)}</div></div>; }
function money(v: number) { return new Intl.NumberFormat('vi-VN').format(v || 0) + 'đ'; }

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const token = req.cookies?.token;
  const payload = token ? await verifyToken(token) : null;
  if (!payload?.id || !['agent', 'admin'].includes(String(payload.role))) return { redirect: { destination: '/login', permanent: false } };
  const user = await prisma.user.findUnique({ where: { id: payload.id as string }, select: { id: true, name: true, phone: true, email: true, role: true } });
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  const loans = await prisma.loan.findMany({ where: user.role === 'admin' ? {} : { assignedAgentId: user.id }, include: { user: { select: { id: true, name: true, phone: true, email: true, profile: { include: { kycs: { orderBy: { createdAt: 'desc' }, take: 1 }, bankAccounts: true } } } }, contracts: true }, orderBy: { createdAt: 'desc' }, take: 200 });
  const userIds = [...new Set(loans.map((l: any) => l.userId))];
  const customers = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, phone: true, email: true, profile: { include: { kycs: { orderBy: { createdAt: 'desc' }, take: 1 }, bankAccounts: true } } } });
  return { props: { user: JSON.parse(JSON.stringify(user)), loans: JSON.parse(JSON.stringify(loans)), customers: JSON.parse(JSON.stringify(customers)) } };
};
