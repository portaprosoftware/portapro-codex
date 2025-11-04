import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CompletionTimeChartProps {
  data: { month: string; avgHours: number; count: number }[];
}

export const CompletionTimeChart: React.FC<CompletionTimeChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    month: item.month,
    hours: parseFloat(item.avgHours.toFixed(1)),
    count: item.count
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Completion Time Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                label={{ value: 'Avg Hours', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{payload[0].payload.month}</p>
                        <p className="text-sm text-primary">
                          Avg: {payload[0].value} hours
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payload[0].payload.count} work orders
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="hours" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Avg Hours"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No completion data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
