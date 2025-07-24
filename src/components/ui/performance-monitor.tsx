import React from 'react';
import { cn } from '@/lib/utils';
import { Activity, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'error';
  threshold: number;
}

interface PerformanceMonitorProps {
  metrics?: PerformanceMetric[];
  className?: string;
}

const defaultMetrics: PerformanceMetric[] = [
  { name: 'Page Load Time', value: 1.2, unit: 's', status: 'good', threshold: 2.0 },
  { name: 'API Response', value: 150, unit: 'ms', status: 'good', threshold: 300 },
  { name: 'Memory Usage', value: 45, unit: '%', status: 'good', threshold: 80 },
  { name: 'Error Rate', value: 0.1, unit: '%', status: 'good', threshold: 1.0 },
];

const MetricCard: React.FC<{ metric: PerformanceMetric }> = ({ metric }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'doc-current';
      case 'warning': return 'doc-expiring';
      case 'error': return 'doc-overdue';
      default: return 'doc-not-set';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <Zap className="h-4 w-4" />;
      case 'warning': return <TrendingUp className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const percentage = Math.min((metric.value / metric.threshold) * 100, 100);

  return (
    <Card className="enterprise-job-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {metric.name}
        </CardTitle>
        <Badge className={getStatusColor(metric.status)}>
          {getStatusIcon(metric.status)}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">
          {metric.value}{metric.unit}
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              metric.status === 'good' && "bg-green-500",
              metric.status === 'warning' && "bg-yellow-500", 
              metric.status === 'error' && "bg-red-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground">
          Threshold: {metric.threshold}{metric.unit}
        </p>
      </CardContent>
    </Card>
  );
};

const RealTimeChart: React.FC = () => {
  const [dataPoints, setDataPoints] = React.useState<number[]>([]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints(prev => {
        const newPoint = Math.random() * 100;
        const updated = [...prev, newPoint];
        return updated.slice(-20); // Keep last 20 points
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const maxValue = Math.max(...dataPoints, 100);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-time Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-32 flex items-end gap-1 overflow-hidden">
          {dataPoints.map((point, index) => (
            <div
              key={index}
              className="bg-gradient-primary rounded-t flex-1 min-w-[2px] transition-all duration-500"
              style={{ 
                height: `${(point / maxValue) * 100}%`,
                opacity: 0.5 + (index / dataPoints.length) * 0.5
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  metrics = defaultMetrics, 
  className 
}) => {
  const overallStatus = metrics.every(m => m.status === 'good') 
    ? 'good' 
    : metrics.some(m => m.status === 'error') 
    ? 'error' 
    : 'warning';

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitor</h2>
          <p className="text-muted-foreground">Real-time system performance metrics</p>
        </div>
        <Badge className={cn(
          overallStatus === 'good' && 'doc-current',
          overallStatus === 'warning' && 'doc-expiring',
          overallStatus === 'error' && 'doc-overdue'
        )}>
          System {overallStatus === 'good' ? 'Healthy' : overallStatus === 'warning' ? 'Warning' : 'Critical'}
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Real-time Chart */}
      <RealTimeChart />
    </div>
  );
};