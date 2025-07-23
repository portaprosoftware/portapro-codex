
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Briefcase, 
  Users, 
  Truck,
  AlertTriangle,
  Target,
  Activity,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface KPIData {
  revenue: number;
  jobs: { total: number; completed: number; completion_rate: number };
  fleet_utilization: number;
  customer_growth: number;
}

interface RealTimeKPIDashboardProps {
  data: KPIData;
  dateRange: { from: Date; to: Date };
  isLoading: boolean;
  refreshInterval: number;
}

export const RealTimeKPIDashboard: React.FC<RealTimeKPIDashboardProps> = ({
  data,
  dateRange,
  isLoading,
  refreshInterval
}) => {
  const [liveData, setLiveData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Simulate live data updates
    const interval = setInterval(() => {
      const newDataPoint = {
        timestamp: new Date().toISOString(),
        revenue: (data?.revenue || 0) + Math.random() * 1000,
        jobs: (data?.jobs?.total || 0) + Math.floor(Math.random() * 5),
        utilization: (data?.fleet_utilization || 0) + Math.random() * 10 - 5
      };
      
      setLiveData(prev => [...prev.slice(-23), newDataPoint]);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [data, refreshInterval]);

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: `$${(data?.revenue || 0).toLocaleString()}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Active Jobs',
      value: data?.jobs?.total || 0,
      change: '+8.2%',
      trend: 'up',
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Completion Rate',
      value: `${(data?.jobs?.completion_rate || 0).toFixed(1)}%`,
      change: '-2.1%',
      trend: 'down',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Fleet Utilization',
      value: `${(data?.fleet_utilization || 0).toFixed(1)}%`,
      change: '+5.3%',
      trend: 'up',
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const recentAlerts = [
    { type: 'warning', message: 'Vehicle V-001 requires maintenance', time: '2 min ago' },
    { type: 'info', message: 'New customer inquiry received', time: '5 min ago' },
    { type: 'error', message: 'Job J-456 delayed', time: '12 min ago' }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status Bar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Live Data</span>
          <Badge variant="outline" className="text-xs">
            Updates every {refreshInterval / 1000}s
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <Activity className="w-4 h-4" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <div className="flex items-center gap-1">
                    {kpi.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Live Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={liveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                <YAxis />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleTimeString()} />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue" />
                <Line type="monotone" dataKey="jobs" stroke="#10B981" name="Jobs" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Live Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'error' ? 'bg-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Current Rate</span>
                <span className="text-sm font-medium">{(data?.jobs?.completion_rate || 0).toFixed(1)}%</span>
              </div>
              <Progress value={data?.jobs?.completion_rate || 0} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Target: 95% | Current: {(data?.jobs?.completion_rate || 0).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fleet Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Current Utilization</span>
                <span className="text-sm font-medium">{(data?.fleet_utilization || 0).toFixed(1)}%</span>
              </div>
              <Progress value={data?.fleet_utilization || 0} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Target: 80% | Current: {(data?.fleet_utilization || 0).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Growth Rate</span>
                <span className="text-sm font-medium">{(data?.customer_growth || 0).toFixed(1)}%</span>
              </div>
              <Progress value={Math.abs(data?.customer_growth || 0)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Target: 15% | Current: {(data?.customer_growth || 0).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
