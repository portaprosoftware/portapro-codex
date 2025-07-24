import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertTriangle, TrendingUp, Calendar, Package, Brain, Target } from 'lucide-react';

export const ReorderAnalytics: React.FC = () => {
  const [analysisType, setAnalysisType] = useState('usage');
  const [timeframe, setTimeframe] = useState('30');

  const { data: consumables } = useQuery({
    queryKey: ['consumables-reorder-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables' as any)
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return (data || []) as any[];
    }
  });

  const { data: stockMovements } = useQuery({
    queryKey: ['stock-movements-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumable_stock_adjustments' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return (data || []) as any[];
    }
  });

  // Calculate reorder predictions
  const calculateReorderPredictions = () => {
    return consumables?.map((consumable: any) => {
      const movements = stockMovements?.filter((m: any) => m.consumable_id === consumable.id) || [];
      const usageRate = movements.length > 0 ? movements.reduce((sum: number, m: any) => sum + Math.abs(m.quantity_change), 0) / movements.length : 0;
      const daysUntilReorder = usageRate > 0 ? Math.floor((consumable.on_hand_qty - consumable.reorder_threshold) / usageRate) : 999;
      
      return {
        ...consumable,
        usage_rate: usageRate,
        days_until_reorder: Math.max(0, daysUntilReorder),
        reorder_urgency: daysUntilReorder <= 7 ? 'urgent' : daysUntilReorder <= 14 ? 'soon' : 'normal',
        stock_level_percent: (consumable.on_hand_qty / Math.max(consumable.reorder_threshold * 3, 1)) * 100,
        suggested_order_qty: Math.max(usageRate * 30, consumable.reorder_threshold)
      };
    }) || [];
  };

  const reorderPredictions = calculateReorderPredictions();
  const urgentItems = reorderPredictions.filter(item => item.reorder_urgency === 'urgent');
  const soonItems = reorderPredictions.filter(item => item.reorder_urgency === 'soon');

  // Mock usage trend data
  const usageTrendData = [
    { month: 'Jan', usage: 120, cost: 2400 },
    { month: 'Feb', usage: 150, cost: 3000 },
    { month: 'Mar', usage: 180, cost: 3600 },
    { month: 'Apr', usage: 160, cost: 3200 },
    { month: 'May', usage: 200, cost: 4000 },
    { month: 'Jun', usage: 175, cost: 3500 }
  ];

  // Top items by usage velocity
  const topUsageItems = reorderPredictions
    .sort((a, b) => b.usage_rate - a.usage_rate)
    .slice(0, 10);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'soon':
        return <Badge variant="default">Soon</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-500';
      case 'soon': return 'bg-orange-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Reorder Analysis Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Analysis Type</Label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usage">Usage-Based</SelectItem>
                  <SelectItem value="seasonal">Seasonal Trends</SelectItem>
                  <SelectItem value="cost">Cost Optimization</SelectItem>
                  <SelectItem value="predictive">Predictive Model</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <Button className="w-full">
                <Brain className="w-4 h-4 mr-2" />
                Generate Predictions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent Reorders</p>
                <p className="text-2xl font-bold text-red-600">{urgentItems.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Soon to Reorder</p>
                <p className="text-2xl font-bold text-orange-600">{soonItems.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{reorderPredictions.length}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Usage Rate</p>
                <p className="text-2xl font-bold">
                  {(reorderPredictions.reduce((sum, item) => sum + item.usage_rate, 0) / reorderPredictions.length).toFixed(1)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="usage" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Usage Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topUsageItems.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="usage_rate" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Reorder Predictions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reorder Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Usage Rate</TableHead>
                <TableHead>Days Until Reorder</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Suggested Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reorderPredictions.slice(0, 15).map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    {item.on_hand_qty} / {item.reorder_threshold}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={Math.min(item.stock_level_percent, 100)} 
                        className="w-16" 
                      />
                      <span className="text-sm">{item.stock_level_percent.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.usage_rate.toFixed(1)}/day</TableCell>
                  <TableCell>
                    {item.days_until_reorder === 999 ? 'N/A' : `${item.days_until_reorder} days`}
                  </TableCell>
                  <TableCell>{getUrgencyBadge(item.reorder_urgency)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {Math.round(item.suggested_order_qty)} units
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};