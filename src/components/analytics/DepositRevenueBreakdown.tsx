import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useDepositAnalytics } from '@/hooks/useDepositAnalytics';
import { DollarSign } from 'lucide-react';

interface DepositRevenueBreakdownProps {
  dateRange?: { from: Date; to: Date };
}

const COLORS = {
  paid: '#22c55e',
  pending: '#eab308',
  overdue: '#ef4444',
};

export function DepositRevenueBreakdown({ dateRange }: DepositRevenueBreakdownProps) {
  const { data, isLoading } = useDepositAnalytics(dateRange);

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Deposit Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.breakdown
    .filter(item => item.total_amount > 0)
    .map(item => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      value: item.total_amount,
      count: item.count,
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Deposit Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No deposit data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Deposit Revenue Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || '#8884d8'} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `$${value.toFixed(2)}`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))' 
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          {chartData.map((item) => (
            <div key={item.name} className="p-2 rounded-lg border">
              <p className="text-xs text-muted-foreground">{item.name}</p>
              <p className="text-sm font-bold">${item.value.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{item.count} items</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
