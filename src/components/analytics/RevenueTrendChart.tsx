import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface RevenueTrendData {
  date: string;
  invoiced: number;
  collected: number;
  outstanding: number;
}

interface RevenueTrendChartProps {
  data: RevenueTrendData[];
  title: string;
  height?: number;
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ data, title, height = 300 }) => {
  const formatXAxisLabel = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'MMM dd');
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">
            {formatXAxisLabel(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: $${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 rounded-2xl shadow-md border-l-4 border-green-500">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisLabel}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280" 
            fontSize={12}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="invoiced" 
            stroke="hsl(142, 76%, 36%)" 
            strokeWidth={3}
            name="Invoiced"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="collected" 
            stroke="hsl(214, 83%, 53%)" 
            strokeWidth={3}
            name="Collected"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="outstanding" 
            stroke="hsl(32, 95%, 44%)" 
            strokeWidth={3}
            name="Outstanding"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};