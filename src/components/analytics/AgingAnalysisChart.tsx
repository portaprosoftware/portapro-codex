import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AgingData {
  range: string;
  amount: number;
  count: number;
  color: string;
}

interface AgingAnalysisChartProps {
  data: AgingData[];
  title: string;
  height?: number;
}

export const AgingAnalysisChart: React.FC<AgingAnalysisChartProps> = ({ data, title, height = 300 }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <p className="text-sm text-gray-700">
            Amount: ${data.amount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-700">
            Invoices: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 rounded-2xl shadow-md border-l-4 border-blue-500">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="range" 
            stroke="#6b7280"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#6b7280" 
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="amount" 
            fill="hsl(214, 83%, 53%)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            ${data.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Outstanding</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {data.reduce((sum, item) => sum + item.count, 0)}
          </p>
          <p className="text-sm text-gray-500">Total Invoices</p>
        </div>
      </div>
    </Card>
  );
};