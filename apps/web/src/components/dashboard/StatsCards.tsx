'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Users, FileText } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalLoans: number;
    totalAmount: number;
    totalUsers: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { title: 'Tổng khoản vay', value: stats.totalLoans, icon: FileText, color: 'text-blue-600' },
    { title: 'Tổng giá trị', value: formatCurrency(stats.totalAmount), icon: DollarSign, color: 'text-green-600' },
    { title: 'Người dùng', value: stats.totalUsers, icon: Users, color: 'text-purple-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
