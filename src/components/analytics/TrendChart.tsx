
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

interface TrendChartProps {
  data: any[];
  title: string;
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, title, height = 300 }) => {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  const formatXAxisLabel = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return viewMode === 'daily' ? format(date, 'MMM dd') : format(date, 'MMM yyyy');
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
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 rounded-2xl shadow-md border-l-4 border-blue-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('daily')}
            className="text-xs"
          >
            Daily
          </Button>
          <Button
            variant={viewMode === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('monthly')}
            className="text-xs"
          >
            Monthly
          </Button>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisLabel}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="delivery" stackId="a" fill="hsl(214, 83%, 53%)" name="Delivery" radius={[0, 0, 0, 0]} />
          <Bar dataKey="pickup" stackId="a" fill="hsl(32, 95%, 44%)" name="Pickup" radius={[0, 0, 0, 0]} />
          <Bar dataKey="service" stackId="a" fill="hsl(259, 55%, 52%)" name="Service" radius={[0, 0, 0, 0]} />
          <Bar dataKey="survey" stackId="a" fill="hsl(0, 74%, 35%)" name="Survey/Estimate" radius={[0, 0, 0, 0]} />
          <Bar dataKey="partial-pickup" stackId="a" fill="hsl(25, 95%, 53%)" name="Partial Pickup" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
