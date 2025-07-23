
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Clock, 
  MapPin, 
  Star, 
  TrendingUp, 
  Trophy, 
  Target,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from 'recharts';

interface PerformanceMetricsProps {
  data: any;
  dateRange: { from: Date; to: Date };
  isLoading: boolean;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  data,
  dateRange,
  isLoading
}) => {
  const [selectedMetric, setSelectedMetric] = useState('overall');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock performance data
  const driverPerformance = [
    { 
      id: 'driver-1', 
      name: 'John Smith', 
      completionRate: 96, 
      customerRating: 4.8, 
      efficiency: 92, 
      jobs: 45,
      status: 'excellent'
    },
    { 
      id: 'driver-2', 
      name: 'Sarah Johnson', 
      completionRate: 94, 
      customerRating: 4.7, 
      efficiency: 89, 
      jobs: 42,
      status: 'good'
    },
    { 
      id: 'driver-3', 
      name: 'Mike Davis', 
      completionRate: 88, 
      customerRating: 4.5, 
      efficiency: 85, 
      jobs: 38,
      status: 'needs-improvement'
    }
  ];

  const teamMetrics = [
    { metric: 'Completion Rate', current: 94, target: 95, trend: 'up' },
    { metric: 'Customer Satisfaction', current: 4.7, target: 4.8, trend: 'up' },
    { metric: 'Average Response Time', current: 2.3, target: 2.0, trend: 'down' },
    { metric: 'Route Efficiency', current: 87, target: 90, trend: 'up' },
    { metric: 'Safety Score', current: 98, target: 100, trend: 'stable' }
  ];

  const performanceRadarData = [
    { subject: 'Speed', A: 92, B: 88, fullMark: 100 },
    { subject: 'Accuracy', A: 95, B: 92, fullMark: 100 },
    { subject: 'Customer Service', A: 89, B: 85, fullMark: 100 },
    { subject: 'Safety', A: 98, B: 94, fullMark: 100 },
    { subject: 'Efficiency', A: 87, B: 83, fullMark: 100 },
    { subject: 'Communication', A: 91, B: 87, fullMark: 100 }
  ];

  const weeklyTrends = [
    { week: 'Week 1', completions: 85, efficiency: 87, satisfaction: 4.6 },
    { week: 'Week 2', completions: 89, efficiency: 89, satisfaction: 4.7 },
    { week: 'Week 3', completions: 92, efficiency: 91, satisfaction: 4.8 },
    { week: 'Week 4', completions: 94, efficiency: 93, satisfaction: 4.7 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return CheckCircle;
      case 'good': return Trophy;
      case 'needs-improvement': return AlertTriangle;
      default: return Activity;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Controls */}
      <div className="flex gap-4">
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overall">Overall Performance</SelectItem>
            <SelectItem value="individual">Individual Drivers</SelectItem>
            <SelectItem value="team">Team Metrics</SelectItem>
            <SelectItem value="efficiency">Efficiency Analysis</SelectItem>
            <SelectItem value="satisfaction">Customer Satisfaction</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMetrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{metric.metric}</span>
                    <span className="text-sm text-muted-foreground">
                      {metric.current}{metric.metric.includes('Rate') || metric.metric.includes('Score') ? '%' : ''}
                    </span>
                  </div>
                  <Progress value={(metric.current / metric.target) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Target: {metric.target}{metric.metric.includes('Rate') || metric.metric.includes('Score') ? '%' : ''}</span>
                    <span className={`flex items-center gap-1 ${
                      metric.trend === 'up' ? 'text-green-600' :
                      metric.trend === 'down' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={performanceRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis />
                <Radar name="Current" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                <Radar name="Target" dataKey="B" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="completions" stroke="#3B82F6" name="Completions" />
                <Line type="monotone" dataKey="efficiency" stroke="#10B981" name="Efficiency" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Individual Driver Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Individual Driver Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {driverPerformance.map((driver, index) => {
              const StatusIcon = getStatusIcon(driver.status);
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{driver.name}</h4>
                      <p className="text-sm text-muted-foreground">{driver.jobs} jobs completed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium">{driver.completionRate}%</p>
                      <p className="text-xs text-muted-foreground">Completion</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{driver.customerRating}</p>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{driver.efficiency}%</p>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                    </div>
                    <Badge className={getStatusColor(driver.status)}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {driver.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Driver Efficiency Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={driverPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completionRate" fill="#3B82F6" name="Completion Rate %" />
                <Bar dataKey="efficiency" fill="#10B981" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Top Performer</h4>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  John Smith leads with 96% completion rate and 4.8 customer rating
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Team Goal</h4>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Team is 1% away from achieving 95% completion rate target
                </p>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-800">Improvement Needed</h4>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Mike Davis needs support to improve completion rate to team standard
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
