import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LiveClock } from '@/components/ui/LiveClock';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  Users, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign
} from 'lucide-react';

interface DashboardMetric {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  variant: 'primary' | 'success' | 'warning' | 'danger';
}

interface EnhancedDashboardProps {
  metrics: DashboardMetric[];
  className?: string;
}

const MetricCard: React.FC<{ metric: DashboardMetric }> = ({ metric }) => {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-primary text-white';
      case 'success':
        return 'bg-gradient-green text-white';
      case 'warning':
        return 'bg-gradient-orange text-white';
      case 'danger':
        return 'bg-gradient-red text-white';
      default:
        return 'bg-gradient-card';
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover-lift",
      getVariantStyles(metric.variant)
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium opacity-90">
          {metric.title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
          {metric.icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {metric.value}
        </div>
        {metric.change && (
          <p className={cn("text-xs flex items-center gap-1", getTrendColor(metric.trend))}>
            {metric.trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {metric.trend === 'down' && <TrendingUp className="h-3 w-3 rotate-180" />}
            {metric.change}
          </p>
        )}
      </CardContent>
      
      {/* Animated bottom stripe */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent transform scale-x-0 hover:scale-x-100 transition-transform duration-300" />
    </Card>
  );
};

const DashboardHeader: React.FC = () => {
  return (
    <div className="enterprise-header">
      <div className="flex items-center justify-between w-full">
        {/* Left side - Welcome */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome back! 👋
          </h1>
          <p className="text-white/80 text-sm">
            Here's what's happening with your business today
          </p>
        </div>

        {/* Center - Digital Clock */}
        <div className="hidden md:flex items-center">
          <LiveClock showDigital showAnalog={false} size="sm" />
        </div>

        {/* Right side - Analog Clock */}
        <div className="hidden lg:flex items-center">
          <LiveClock showAnalog showDigital={false} size="md" />
        </div>
      </div>
    </div>
  );
};

const QuickActions: React.FC = () => {
  const actions = [
    { title: 'Schedule Job', icon: <Calendar className="h-4 w-4" />, href: '/jobs/new' },
    { title: 'Add Customer', icon: <Users className="h-4 w-4" />, href: '/customers/new' },
    { title: 'Track Inventory', icon: <Package className="h-4 w-4" />, href: '/inventory' },
    { title: 'View Reports', icon: <TrendingUp className="h-4 w-4" />, href: '/analytics' },
  ];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <button
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-gradient-card hover:bg-gradient-to-br hover:from-white hover:to-gray-50 transition-all duration-200 hover:shadow-md group"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200">
                {action.icon}
              </div>
              <span className="font-medium text-sm">{action.title}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const StatusOverview: React.FC = () => {
  const statuses = [
    { label: 'Active Jobs', count: 24, status: 'current' },
    { label: 'Pending', count: 8, status: 'pending' },
    { label: 'Completed Today', count: 16, status: 'completed' },
    { label: 'Overdue', count: 3, status: 'overdue' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Status Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statuses.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm font-medium">{item.label}</span>
            <Badge className={`doc-${item.status}`}>
              {item.count}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ 
  metrics, 
  className 
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Dashboard Header */}
      <DashboardHeader />
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>
      
      {/* Secondary Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <StatusOverview />
      </div>
    </div>
  );
};

// Default metrics for demo
export const defaultMetrics: DashboardMetric[] = [
  {
    title: "Active Jobs",
    value: 156,
    change: "+12% from last week",
    trend: "up",
    icon: <Calendar className="h-4 w-4" />,
    variant: "primary"
  },
  {
    title: "Revenue",
    value: "$45,231",
    change: "+8% from last month",
    trend: "up", 
    icon: <DollarSign className="h-4 w-4" />,
    variant: "success"
  },
  {
    title: "Pending Issues",
    value: 23,
    change: "3 new today",
    trend: "neutral",
    icon: <AlertTriangle className="h-4 w-4" />,
    variant: "warning"
  },
  {
    title: "Fleet Utilization",
    value: "87%",
    change: "+5% from yesterday", 
    trend: "up",
    icon: <Package className="h-4 w-4" />,
    variant: "primary"
  }
];