
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity, 
  Zap,
  Download,
  Settings,
  Maximize2
} from 'lucide-react';

interface AdvancedChartsProps {
  kpiData: any;
  performanceData: any;
  businessData: any;
  dateRange: { from: Date; to: Date };
}

export const AdvancedCharts: React.FC<AdvancedChartsProps> = ({
  kpiData,
  performanceData,
  businessData,
  dateRange
}) => {
  const [selectedChart, setSelectedChart] = useState('trend');
  const [chartConfig, setChartConfig] = useState({
    showGrid: true,
    showLegend: true,
    theme: 'light',
    animation: true
  });

  // Advanced chart data
  const trendData = [
    { date: '2024-01-01', revenue: 12500, jobs: 45, efficiency: 85, satisfaction: 4.6 },
    { date: '2024-01-02', revenue: 13200, jobs: 48, efficiency: 87, satisfaction: 4.7 },
    { date: '2024-01-03', revenue: 11800, jobs: 42, efficiency: 83, satisfaction: 4.5 },
    { date: '2024-01-04', revenue: 14600, jobs: 52, efficiency: 89, satisfaction: 4.8 },
    { date: '2024-01-05', revenue: 15200, jobs: 55, efficiency: 91, satisfaction: 4.9 },
    { date: '2024-01-06', revenue: 13800, jobs: 49, efficiency: 88, satisfaction: 4.7 },
    { date: '2024-01-07', revenue: 16400, jobs: 58, efficiency: 93, satisfaction: 4.8 }
  ];

  const correlationData = [
    { efficiency: 85, satisfaction: 4.6, revenue: 12500, jobs: 45 },
    { efficiency: 87, satisfaction: 4.7, revenue: 13200, jobs: 48 },
    { efficiency: 83, satisfaction: 4.5, revenue: 11800, jobs: 42 },
    { efficiency: 89, satisfaction: 4.8, revenue: 14600, jobs: 52 },
    { efficiency: 91, satisfaction: 4.9, revenue: 15200, jobs: 55 },
    { efficiency: 88, satisfaction: 4.7, revenue: 13800, jobs: 49 },
    { efficiency: 93, satisfaction: 4.8, revenue: 16400, jobs: 58 }
  ];

  const performanceHeatmap = [
    { name: 'Delivery', Mon: 95, Tue: 92, Wed: 88, Thu: 94, Fri: 96, Sat: 89, Sun: 87 },
    { name: 'Pickup', Mon: 89, Tue: 91, Wed: 93, Thu: 87, Fri: 94, Sat: 92, Sun: 90 },
    { name: 'Service', Mon: 92, Tue: 94, Wed: 91, Thu: 93, Fri: 89, Sat: 87, Sun: 85 },
    { name: 'Return', Mon: 88, Tue: 90, Wed: 87, Thu: 91, Fri: 93, Sat: 94, Sun: 92 }
  ];

  const geographicData = [
    { region: 'North', value: 2400, customers: 45, color: '#3B82F6' },
    { region: 'South', value: 1398, customers: 32, color: '#10B981' },
    { region: 'East', value: 1800, customers: 38, color: '#8B5CF6' },
    { region: 'West', value: 2200, customers: 42, color: '#F59E0B' },
    { region: 'Central', value: 1600, customers: 28, color: '#EF4444' }
  ];

  const multiDimensionalData = [
    { subject: 'Revenue', thisMonth: 120, lastMonth: 110, target: 130, fullMark: 150 },
    { subject: 'Efficiency', thisMonth: 98, lastMonth: 85, target: 100, fullMark: 150 },
    { subject: 'Satisfaction', thisMonth: 86, lastMonth: 90, target: 95, fullMark: 150 },
    { subject: 'Growth', thisMonth: 99, lastMonth: 95, target: 105, fullMark: 150 },
    { subject: 'Quality', thisMonth: 85, lastMonth: 80, target: 90, fullMark: 150 },
    { subject: 'Speed', thisMonth: 65, lastMonth: 60, target: 70, fullMark: 150 }
  ];

  const chartTypes = [
    { id: 'trend', label: 'Trend Analysis', icon: TrendingUp },
    { id: 'correlation', label: 'Correlation', icon: Activity },
    { id: 'performance', label: 'Performance Matrix', icon: BarChart3 },
    { id: 'geographic', label: 'Geographic', icon: PieChartIcon },
    { id: 'multidimensional', label: 'Multi-dimensional', icon: Zap }
  ];

  const renderChart = () => {
    switch (selectedChart) {
      case 'trend':
        return (
          <ComposedChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#3B82F6" fillOpacity={0.2} />
            <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="#8B5CF6" strokeWidth={2} />
            <Bar yAxisId="left" dataKey="jobs" fill="#F59E0B" />
          </ComposedChart>
        );

      case 'correlation':
        return (
          <ScatterChart data={correlationData}>
            <CartesianGrid />
            <XAxis type="number" dataKey="efficiency" name="Efficiency" />
            <YAxis type="number" dataKey="satisfaction" name="Satisfaction" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Performance" dataKey="revenue" fill="#3B82F6" />
          </ScatterChart>
        );

      case 'performance':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceHeatmap}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Mon" fill="#3B82F6" />
              <Bar dataKey="Tue" fill="#10B981" />
              <Bar dataKey="Wed" fill="#8B5CF6" />
              <Bar dataKey="Thu" fill="#F59E0B" />
              <Bar dataKey="Fri" fill="#EF4444" />
              <Bar dataKey="Sat" fill="#6B7280" />
              <Bar dataKey="Sun" fill="#EC4899" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'geographic':
        return (
          <PieChart>
            <Pie
              data={geographicData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {geographicData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      case 'multidimensional':
        return (
          <RadarChart data={multiDimensionalData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis />
            <Radar name="This Month" dataKey="thisMonth" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
            <Radar name="Last Month" dataKey="lastMonth" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
            <Radar name="Target" dataKey="target" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} />
          </RadarChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {chartTypes.map((type) => (
            <Button
              key={type.id}
              variant={selectedChart === type.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChart(type.id)}
              className="flex items-center gap-2"
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="w-4 h-4 mr-2" />
            Full Screen
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Main Chart Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {chartTypes.find(t => t.id === selectedChart)?.label} Chart
            <Badge variant="secondary">
              {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            {renderChart()}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chart Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium">Strong Correlation</p>
                  <p className="text-xs text-muted-foreground">
                    Efficiency and satisfaction show 0.89 correlation
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium">Peak Performance</p>
                  <p className="text-xs text-muted-foreground">
                    Fridays show highest efficiency at 93%
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium">Growth Opportunity</p>
                  <p className="text-xs text-muted-foreground">
                    Central region shows 25% growth potential
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Data Completeness</span>
                <Badge variant="outline">98.5%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Accuracy Score</span>
                <Badge variant="outline">96.2%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Freshness</span>
                <Badge variant="outline">Real-time</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Sample Size</span>
                <Badge variant="outline">1,247 records</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chart Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Show Grid</span>
                <Button
                  variant={chartConfig.showGrid ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartConfig(prev => ({ ...prev, showGrid: !prev.showGrid }))}
                >
                  {chartConfig.showGrid ? 'On' : 'Off'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Animation</span>
                <Button
                  variant={chartConfig.animation ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartConfig(prev => ({ ...prev, animation: !prev.animation }))}
                >
                  {chartConfig.animation ? 'On' : 'Off'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Theme</span>
                <Select value={chartConfig.theme} onValueChange={(value) => setChartConfig(prev => ({ ...prev, theme: value }))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
