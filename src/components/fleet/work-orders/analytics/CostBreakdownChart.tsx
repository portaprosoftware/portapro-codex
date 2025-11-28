import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartWrapper } from '@/components/analytics/ChartWrapper';

interface CostBreakdownChartProps {
  data: { category: string; value: number }[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))'
];

export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({ data }) => {
  const chartData = data.filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartWrapper>
            {(Recharts) => {
              const { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } = Recharts;
              
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{payload[0].name}</p>
                              <p className="text-sm text-primary">
                                ${payload[0].value?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              );
            }}
          </ChartWrapper>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No cost data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
