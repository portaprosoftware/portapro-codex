import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface IssueFrequencyChartProps {
  issuesByType: Record<string, number>;
  issuesByPriority: Record<string, number>;
}

export const IssueFrequencyChart: React.FC<IssueFrequencyChartProps> = ({ 
  issuesByType, 
  issuesByPriority 
}) => {
  const chartData = Object.entries(issuesByType)
    .map(([type, count]) => ({
      type: type.replace('_', ' '),
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Frequency by Source</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="type" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium capitalize">{payload[0].payload.type}</p>
                        <p className="text-sm text-primary">
                          {payload[0].value} work orders
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="Work Orders"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No issue data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
