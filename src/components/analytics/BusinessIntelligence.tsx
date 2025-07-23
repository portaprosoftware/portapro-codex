
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface BusinessIntelligenceProps {
  data: any;
  dateRange: { from: Date; to: Date };
  isLoading: boolean;
}

export const BusinessIntelligence: React.FC<BusinessIntelligenceProps> = ({
  data,
  dateRange,
  isLoading
}) => {
  const [selectedView, setSelectedView] = useState('overview');
  const [forecastPeriod, setForecastPeriod] = useState('30');

  // Mock data for demonstration
  const revenueData = [
    { month: 'Jan', revenue: 12500, forecast: 13000, target: 15000 },
    { month: 'Feb', revenue: 14200, forecast: 14800, target: 15000 },
    { month: 'Mar', revenue: 16800, forecast: 17500, target: 15000 },
    { month: 'Apr', revenue: 15600, forecast: 16200, target: 15000 },
    { month: 'May', revenue: 18400, forecast: 19000, target: 15000 },
    { month: 'Jun', revenue: 20200, forecast: 21000, target: 15000 }
  ];

  const customerSegments = [
    { name: 'Commercial', value: 45, color: '#3B82F6' },
    { name: 'Residential', value: 30, color: '#10B981' },
    { name: 'Government', value: 15, color: '#8B5CF6' },
    { name: 'Industrial', value: 10, color: '#F59E0B' }
  ];

  const operationalData = [
    { category: 'Delivery', completed: 85, scheduled: 100, efficiency: 85 },
    { category: 'Pickup', completed: 92, scheduled: 95, efficiency: 97 },
    { category: 'Service', completed: 78, scheduled: 80, efficiency: 98 },
    { category: 'Return', completed: 89, scheduled: 90, efficiency: 99 }
  ];

  const predictiveInsights = [
    {
      title: 'Revenue Forecast',
      insight: 'Based on current trends, expect 15% revenue growth next quarter',
      confidence: 85,
      impact: 'high',
      status: 'positive'
    },
    {
      title: 'Fleet Optimization',
      insight: 'Consolidating routes could reduce costs by 12%',
      confidence: 78,
      impact: 'medium',
      status: 'opportunity'
    },
    {
      title: 'Customer Retention',
      insight: 'Service quality improvements needed to maintain 95% retention',
      confidence: 92,
      impact: 'high',
      status: 'warning'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Intelligence Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="revenue">Revenue Analysis</SelectItem>
              <SelectItem value="customers">Customer Insights</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="forecasting">Forecasting</SelectItem>
            </SelectContent>
          </Select>

          <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Forecast period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revenue Growth</p>
                    <p className="text-2xl font-bold text-green-600">+15.2%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customer LTV</p>
                    <p className="text-2xl font-bold text-blue-600">$2,450</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                    <p className="text-2xl font-bold text-purple-600">28.5%</p>
                  </div>
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Efficiency Score</p>
                    <p className="text-2xl font-bold text-orange-600">87.3</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Predictive Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Predictive Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-full ${
                      insight.status === 'positive' ? 'bg-green-100' :
                      insight.status === 'warning' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      {insight.status === 'positive' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : insight.status === 'warning' ? (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{insight.insight}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={insight.impact === 'high' ? 'default' : 'secondary'}>
                          {insight.impact} impact
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {insight.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends & Forecasting</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} name="Actual" />
                    <Area type="monotone" dataKey="forecast" stroke="#10B981" fill="#10B981" fillOpacity={0.2} name="Forecast" />
                    <Area type="monotone" dataKey="target" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} name="Target" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={customerSegments}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {customerSegments.map((segment) => (
                    <div key={segment.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                      <span className="text-sm">{segment.name} ({segment.value}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operational Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {operationalData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.category}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.completed}/{item.scheduled} completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.efficiency}%</p>
                        <p className="text-xs text-muted-foreground">Efficiency</p>
                      </div>
                      <div className={`p-1 rounded-full ${
                        item.efficiency >= 95 ? 'bg-green-100' :
                        item.efficiency >= 85 ? 'bg-yellow-100' :
                        'bg-red-100'
                      }`}>
                        {item.efficiency >= 95 ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        ) : item.efficiency >= 85 ? (
                          <ArrowUpRight className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
