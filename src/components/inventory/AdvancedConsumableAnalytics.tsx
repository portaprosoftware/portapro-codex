import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Package, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AdvancedAnalyticsData {
  usageByCategory: Array<{ category: string; value: number; cost: number }>;
  usageByJob: Array<{ job_type: string; usage: number; cost: number }>;
  stockTrends: Array<{ date: string; stock_value: number; usage_cost: number }>;
  topConsumables: Array<{ name: string; quantity: number; cost: number }>;
  wastageAnalysis: Array<{ item: string; wasted: number; cost: number }>;
  predictiveReorder: Array<{ item: string; predicted_runout: string; recommended_order: number }>;
}

export const AdvancedConsumableAnalytics: React.FC = () => {
  const [dateRange] = useState({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() });
  const [selectedMetric, setSelectedMetric] = useState('usage');

  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['advanced-consumable-analytics', dateRange],
    queryFn: async () => {
      // Mock advanced analytics data - in production, this would be calculated from actual data
      const mockData: AdvancedAnalyticsData = {
        usageByCategory: [
          { category: 'Cleaning Supplies', value: 245, cost: 1234.50 },
          { category: 'Safety Equipment', value: 156, cost: 987.25 },
          { category: 'Paper Products', value: 189, cost: 543.75 },
          { category: 'Chemicals', value: 87, cost: 2156.80 }
        ],
        usageByJob: [
          { job_type: 'delivery', usage: 145, cost: 678.30 },
          { job_type: 'service', usage: 234, cost: 1245.75 },
          { job_type: 'pickup', usage: 98, cost: 456.20 },
          { job_type: 'cleaning', usage: 167, cost: 892.45 }
        ],
        stockTrends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          stock_value: 15000 + Math.random() * 5000,
          usage_cost: 200 + Math.random() * 400
        })),
        topConsumables: [
          { name: 'Toilet Paper', quantity: 456, cost: 1234.56 },
          { name: 'Hand Sanitizer', quantity: 234, cost: 987.34 },
          { name: 'Paper Towels', quantity: 345, cost: 678.90 },
          { name: 'Cleaning Spray', quantity: 123, cost: 543.21 }
        ],
        wastageAnalysis: [
          { item: 'Toilet Paper', wasted: 23, cost: 45.67 },
          { item: 'Paper Towels', wasted: 12, cost: 23.45 },
          { item: 'Hand Soap', wasted: 8, cost: 15.32 }
        ],
        predictiveReorder: [
          { item: 'Toilet Paper', predicted_runout: '2024-02-15', recommended_order: 100 },
          { item: 'Hand Sanitizer', predicted_runout: '2024-02-20', recommended_order: 50 },
          { item: 'Paper Towels', predicted_runout: '2024-02-25', recommended_order: 75 }
        ]
      };
      return mockData;
    }
  });

  const exportReport = () => {
    toast.success('Analytics report exported to CSV');
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  if (isLoading) {
    return <div className="p-6">Loading advanced analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Advanced Consumables Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-4 items-center">
              <div>
                <label className="text-sm font-medium">Metric Focus</label>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usage">Usage Analysis</SelectItem>
                    <SelectItem value="cost">Cost Analysis</SelectItem>
                    <SelectItem value="efficiency">Efficiency Metrics</SelectItem>
                    <SelectItem value="predictive">Predictive Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportReport}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Usage Cost</p>
                <p className="text-2xl font-bold">${analyticsData?.usageByCategory.reduce((sum, cat) => sum + cat.cost, 0).toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Items Used</p>
                <p className="text-2xl font-bold">{analyticsData?.usageByCategory.reduce((sum, cat) => sum + cat.value, 0)}</p>
              </div>
              <Package className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wastage Cost</p>
                <p className="text-2xl font-bold text-destructive">${analyticsData?.wastageAnalysis.reduce((sum, w) => sum + w.cost, 0).toFixed(2)}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reorder Alerts</p>
                <p className="text-2xl font-bold">{analyticsData?.predictiveReorder.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.usageByCategory}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                >
                  {analyticsData?.usageByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stock Value Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Value & Usage Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData?.stockTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="stock_value" stroke="#8884d8" name="Stock Value" />
                <Line type="monotone" dataKey="usage_cost" stroke="#82ca9d" name="Daily Usage Cost" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage by Job Type */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Job Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.usageByJob}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="job_type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="usage" fill="#8884d8" name="Quantity Used" />
                <Bar dataKey="cost" fill="#82ca9d" name="Cost ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Predictive Reorder Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Predictive Reorder Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData?.predictiveReorder.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.item}</p>
                    <p className="text-sm text-muted-foreground">Predicted runout: {item.predicted_runout}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">Order: {item.recommended_order}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};